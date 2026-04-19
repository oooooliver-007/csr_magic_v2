"""对话报名 Agent — 基于模板类型的字段收集 + Qwen 自然语言生成。

设计说明：
- 为保证确定性与可测性，字段收集使用规则状态机（按模板类型定义必填字段清单）。
- Qwen 作为自然语言生成层增强用户体验：在提问 / 汇总时调用其润色回复；
  若 DashScope API 不可用或未配置 key，Agent 回退到内置中文模板，仍能完成收集流程。
- 会话状态使用进程内字典保存（MVP）。
"""

from __future__ import annotations

import json
import re
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from models import ChatMessage, ChatResponse, ChatSessionStatus, ChatTemplateType
from app.utils.field_parser import (
    detect_confirm_intent,
    detect_modify_intent,
    parse_modify_instruction,
    parse_number,
    parse_text_field,
)

logger = logging.getLogger(__name__)

_PROMPT_DIR = Path(__file__).resolve().parent.parent / "prompts"


def _load_welcome_map() -> dict[str, str]:
    """加载 chat_welcome.txt，返回 {TEMPLATE: 模板文本}。"""
    path = _PROMPT_DIR / "chat_welcome.txt"
    if not path.exists():
        return {}
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        result[key.strip()] = value.strip()
    return result


_WELCOME_TEMPLATES: dict[str, str] = _load_welcome_map()


# ========== 字段定义 ==========

@dataclass(frozen=True)
class FieldDef:
    """字段定义。`name` 与前端 FormFieldSchema / 后端 Activity.formSchema 的字段键一致。"""
    name: str
    label: str
    type: str           # number / text
    required: bool
    unit: Optional[str] = None
    prompt: str = ""
    invalid_hint: str = ""


# 模板 → 必填/可选字段清单
_TEMPLATE_FIELDS: dict[ChatTemplateType, list[FieldDef]] = {
    ChatTemplateType.BASIC: [
        FieldDef(
            name="note",
            label="留言",
            type="text",
            required=False,
            prompt="请留下你的参与备注，或回复「跳过」直接报名。",
            invalid_hint="没关系，请再发一次你的备注，或回复「跳过」。",
        ),
    ],
    ChatTemplateType.DONATION: [
        FieldDef(
            name="amount",
            label="捐赠金额",
            type="number",
            required=True,
            unit="元",
            prompt="请告诉我你计划捐赠的金额（单位：元）。",
            invalid_hint="金额需要是一个数字（例如 200），请再试一次。",
        ),
        FieldDef(
            name="note",
            label="留言",
            type="text",
            required=False,
            prompt="你想附上一句留言吗？没有的话回复「跳过」。",
            invalid_hint="没关系，请再发一次你的留言，或回复「跳过」。",
        ),
    ],
    ChatTemplateType.VOLUNTEER: [
        FieldDef(
            name="hours",
            label="服务时长",
            type="number",
            required=True,
            unit="小时",
            prompt="请告诉我你计划参与的服务时长（单位：小时）。",
            invalid_hint="服务时长需要是一个数字（例如 3），请再试一次。",
        ),
        FieldDef(
            name="note",
            label="备注",
            type="text",
            required=False,
            prompt="需要补充备注吗？没有的话回复「跳过」。",
            invalid_hint="没关系，请再发一次你的备注，或回复「跳过」。",
        ),
    ],
    ChatTemplateType.CHECKIN: [],
    ChatTemplateType.CUSTOM: [],  # 由 form_schema 动态解析
}


def _resolve_fields(
    template_type: ChatTemplateType,
    form_schema: Optional[str],
) -> list[FieldDef]:
    """根据模板类型解析字段清单。CUSTOM 模板从 form_schema（JSON）解析。"""
    if template_type != ChatTemplateType.CUSTOM:
        return _TEMPLATE_FIELDS.get(template_type, [])

    if not form_schema:
        return []
    try:
        schema = json.loads(form_schema)
    except json.JSONDecodeError:
        logger.warning("CUSTOM 模板 form_schema 解析失败: %s", form_schema)
        return []
    if not isinstance(schema, list):
        return []

    fields: list[FieldDef] = []
    for item in schema:
        if not isinstance(item, dict):
            continue
        # 权威字段键为 `name`（与前端 FormFieldSchema / 后端 Activity.formSchema 对齐）。
        # 为兼容历史数据，`key` 作为 fallback；新代码不应生成 `key`。
        field_name = item.get("name") or item.get("key")
        label = item.get("label") or field_name
        if not field_name:
            continue
        ftype = item.get("type", "text")
        required = bool(item.get("required", False))
        unit = item.get("unit")
        fields.append(
            FieldDef(
                name=str(field_name),
                label=str(label),
                type=str(ftype),
                required=required,
                unit=str(unit) if unit else None,
                prompt=item.get("prompt")
                or f"请告诉我「{label}」的值{'（选填，可回复“跳过”）' if not required else ''}。",
                invalid_hint=item.get("invalid_hint")
                or f"「{label}」输入不合法，请再试一次。",
            )
        )
    return fields


# ========== 会话状态 ==========


@dataclass
class ChatSession:
    """对话会话状态（进程内存储）"""
    session_id: str
    activity_id: int
    activity_name: str
    template_type: ChatTemplateType
    form_schema: Optional[str]
    fields_def: list[FieldDef]
    collected: dict[str, Any] = field(default_factory=dict)
    messages: list[ChatMessage] = field(default_factory=list)
    status: ChatSessionStatus = ChatSessionStatus.COLLECTING
    current_index: int = 0  # 下一个待收集字段索引

    def to_response(self, reply: str) -> ChatResponse:
        return ChatResponse(
            session_id=self.session_id,
            reply=reply,
            status=self.status,
            collected_fields=dict(self.collected),
            is_complete=self.status
            in (ChatSessionStatus.CONFIRMING, ChatSessionStatus.COMPLETED),
            messages=list(self.messages),
        )


# ========== 会话存储 ==========

_sessions: dict[str, ChatSession] = {}


class SessionConflictError(Exception):
    """会话 ID 冲突（sessionId 已存在）。由 API 层转为 HTTP 409。"""


def get_session(session_id: str) -> Optional[ChatSession]:
    return _sessions.get(session_id)


def _put_session_if_absent(session: ChatSession) -> None:
    """putIfAbsent 语义：sessionId 已存在则抛 SessionConflictError。"""
    if session.session_id in _sessions:
        raise SessionConflictError(session.session_id)
    _sessions[session.session_id] = session


def _save_session(session: ChatSession) -> None:
    _sessions[session.session_id] = session


def reset_sessions_for_tests() -> None:
    """测试辅助：清空会话存储。生产代码不应调用。"""
    _sessions.clear()


# ========== 对外 API ==========


def start_session(
    session_id: str,
    activity_id: int,
    activity_name: str,
    template_type: ChatTemplateType,
    form_schema: Optional[str] = None,
) -> ChatResponse:
    """创建会话，返回开场白。"""
    fields_def = _resolve_fields(template_type, form_schema)

    welcome_template = _WELCOME_TEMPLATES.get(template_type.value) or (
        "你好！我来帮你完成「{activity_name}」的报名。"
    )
    welcome = welcome_template.format(activity_name=activity_name)

    session = ChatSession(
        session_id=session_id,
        activity_id=activity_id,
        activity_name=activity_name,
        template_type=template_type,
        form_schema=form_schema,
        fields_def=fields_def,
        collected={},
        messages=[],
        status=ChatSessionStatus.COLLECTING,
        current_index=0,
    )

    # 签到活动无字段，直接进入确认阶段
    if not fields_def:
        session.status = ChatSessionStatus.CONFIRMING
        welcome = welcome + "\n\n" + _build_summary(session)

    session.messages.append(ChatMessage(role="assistant", content=welcome))
    _put_session_if_absent(session)
    logger.info(
        "创建对话会话: sessionId=%s, activityId=%d, template=%s, fields=%d",
        session_id,
        activity_id,
        template_type.value,
        len(fields_def),
    )
    return session.to_response(welcome)


def handle_message(session_id: str, content: str) -> Optional[ChatResponse]:
    """处理用户消息。会话不存在时返回 None。"""
    session = get_session(session_id)
    if session is None:
        return None

    content = (content or "").strip()
    session.messages.append(ChatMessage(role="user", content=content))

    if session.status == ChatSessionStatus.COMPLETED:
        reply = "本次报名已完成，如需再次操作请重新开始会话。"
        session.messages.append(ChatMessage(role="assistant", content=reply))
        return session.to_response(reply)

    if not content:
        reply = "我没有收到内容，请再发一次。"
        session.messages.append(ChatMessage(role="assistant", content=reply))
        return session.to_response(reply)

    if session.status == ChatSessionStatus.CONFIRMING:
        reply = _handle_confirming(session, content)
    else:
        reply = _handle_collecting(session, content)

    session.messages.append(ChatMessage(role="assistant", content=reply))
    _save_session(session)
    return session.to_response(reply)


def mark_completed(session_id: str) -> Optional[ChatResponse]:
    """标记会话已完成（由后端在 participation 写入后回调）。"""
    session = get_session(session_id)
    if session is None:
        return None
    session.status = ChatSessionStatus.COMPLETED
    reply = "报名已提交成功，感谢你的参与！"
    session.messages.append(ChatMessage(role="assistant", content=reply))
    _save_session(session)
    return session.to_response(reply)


# ========== 内部逻辑 ==========


def _handle_collecting(session: ChatSession, content: str) -> str:
    """字段收集阶段：按当前字段定义解析用户输入。"""
    if session.current_index >= len(session.fields_def):
        session.status = ChatSessionStatus.CONFIRMING
        return _build_summary(session)

    field_def = session.fields_def[session.current_index]

    # 数字类型字段
    if field_def.type == "number":
        value = parse_number(content)
        if value is None or value <= 0:
            return field_def.invalid_hint + _polite_guidance_suffix(field_def)
        session.collected[field_def.name] = value
    else:  # text
        value_text = parse_text_field(content)
        if value_text is None:
            if field_def.required:
                return field_def.invalid_hint
            # 可选字段允许跳过
        else:
            session.collected[field_def.name] = value_text

    session.current_index += 1
    return _ask_next_or_summary(session)


def _ask_next_or_summary(session: ChatSession) -> str:
    """推进到下一字段或生成确认摘要。"""
    while session.current_index < len(session.fields_def):
        next_field = session.fields_def[session.current_index]
        return next_field.prompt
    session.status = ChatSessionStatus.CONFIRMING
    return _build_summary(session)


def _handle_confirming(session: ChatSession, content: str) -> str:
    """确认阶段：确认 → 留给调用方触发真实提交；修改 → 返回收集阶段。"""
    if detect_confirm_intent(content):
        # 保持 CONFIRMING 状态，由外部调用 mark_completed 真正完成
        return "收到「确认」，我将为你提交报名。"

    if detect_modify_intent(content):
        return _handle_modify(session, content)

    # 未识别意图，默认当作“需要修改 + 重新输入”处理
    return (
        "如需提交请回复「确认」；如需修改，请告诉我要调整的字段，例如「修改金额为 300」。\n\n"
        + _build_summary(session)
    )


_MODIFY_KEYWORD_STRIP = re.compile(
    r"(修改|改成|改为|换成|换为|调整为|调整成|修改为|修改成|改到|换到|"
    r"改|修|换|调整|把|将|为|成|到|的|那个|这个|一下|重新|重填|再|想|想想)"
)


def _resolve_target_field(session: ChatSession, hint: str) -> Optional[FieldDef]:
    """根据自然语言提示匹配字段。

    匹配顺序（越具体越优先）：
    1) label 完整出现在 hint 中（如 hint=“捐赠金额” 命中 label “捐赠金额”）。
    2) name（字段键）出现在 hint 中。
    3) 剥离修改类关键词后，hint 片段作为 label 子串匹配（如 hint=“修改金额” → 剩“金额”，
       命中 label “捐赠金额”）。
    未命中返回 None，由上层提示“你想修改哪一项？”。
    """
    if not hint:
        return None
    hint_norm = hint.strip()
    for f in session.fields_def:
        if f.label and f.label in hint_norm:
            return f
    for f in session.fields_def:
        if f.name and f.name in hint_norm:
            return f
    stripped = _MODIFY_KEYWORD_STRIP.sub("", hint_norm).strip()
    if not stripped:
        return None
    for f in session.fields_def:
        if f.label and stripped in f.label:
            return f
    return None


def _apply_new_value(
    session: ChatSession,
    target_field: FieldDef,
    value_raw: str,
) -> Optional[str]:
    """将 value_raw 按字段类型写入 collected；成功返回 None，失败返回兜底提示。"""
    if target_field.type == "number":
        value = parse_number(value_raw)
        if value is None or value <= 0:
            session.status = ChatSessionStatus.COLLECTING
            session.current_index = session.fields_def.index(target_field)
            return target_field.invalid_hint
        session.collected[target_field.name] = value
        return None

    text = parse_text_field(value_raw)
    if text is None:
        if target_field.required:
            session.status = ChatSessionStatus.COLLECTING
            session.current_index = session.fields_def.index(target_field)
            return target_field.invalid_hint
        session.collected.pop(target_field.name, None)
        return None
    session.collected[target_field.name] = text
    return None


def _handle_modify(session: ChatSession, content: str) -> str:
    """解析“把 X 改成 Y / 修改 X 为 Y”式指令，并在字段命中时原地更新摘要。

    - 可从指令中解析出 (field_hint, value_raw) 时：按类型回填并回到 CONFIRMING，给出最新摘要。
    - 若仅指出字段名（无新值）：回到 COLLECTING 并重新询问该字段。
    - 若既没有字段名也没有新值：主动询问“你想修改哪一项？”。
    """
    if not session.fields_def:
        return _build_summary(session)

    field_hint, value_raw = parse_modify_instruction(content)
    target_field = _resolve_target_field(session, field_hint or content)

    # 无法识别字段：主动询问
    if target_field is None:
        options = "、".join(f"「{f.label}」" for f in session.fields_def)
        return (
            "你想修改哪一项呢？可选的字段有：" + options + "。"
            "\n也可以用「把 X 改成 Y」的方式告诉我，例如「把捐赠金额改成 300」。"
        )

    # 命中字段 + 新值：原地更新
    if value_raw:
        hint = _apply_new_value(session, target_field, value_raw)
        if hint is None:
            session.status = ChatSessionStatus.CONFIRMING
            return f"已更新「{target_field.label}」。\n\n" + _build_summary(session)
        return hint + f" 当前正在修改「{target_field.label}」。"

    # 命中字段但没给新值：重新询问
    session.status = ChatSessionStatus.COLLECTING
    session.current_index = session.fields_def.index(target_field)
    return f"好的，请重新告诉我「{target_field.label}」的新值。"


def _build_summary(session: ChatSession) -> str:
    """构造确认摘要文案。"""
    lines = ["我将为你完成以下报名，请确认：", f"• 活动：《{session.activity_name}》"]
    for f in session.fields_def:
        if f.name in session.collected:
            value = session.collected[f.name]
            if f.type == "number":
                # 格式化数字，去除无意义小数尾
                if isinstance(value, float) and value.is_integer():
                    value_text = str(int(value))
                else:
                    value_text = str(value)
                if f.unit:
                    value_text = f"{value_text} {f.unit}"
            else:
                value_text = str(value)
            lines.append(f"• {f.label}：{value_text}")
        elif not f.required:
            lines.append(f"• {f.label}：（未填写）")
    lines.append("回复「确认」提交，或告诉我需要修改的内容。")
    return "\n".join(lines)


def _polite_guidance_suffix(field_def: FieldDef) -> str:
    """为无效输入附加软引导。"""
    return f" 例如「3」。"
