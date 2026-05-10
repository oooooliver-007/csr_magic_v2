"""对话 Agent 单元测试 — 覆盖 5 种模板类型 + 正例 / 负例。"""

import pytest

from app.agents.chat_agent import (
    SessionConflictError,
    handle_message,
    mark_completed,
    reset_sessions_for_tests,
    start_session,
)
from app.utils.field_parser import (
    detect_confirm_intent,
    detect_modify_intent,
    parse_modify_instruction,
)
from models import ChatSessionStatus, ChatTemplateType


@pytest.fixture(autouse=True)
def _reset_sessions():
    reset_sessions_for_tests()
    yield
    reset_sessions_for_tests()


# ================= 正例：各模板主流程 =================


def test_checkin_template_enters_confirming_immediately():
    """CHECKIN：无字段，开场即进入确认状态。"""
    res = start_session(
        session_id="s-checkin",
        activity_id=1,
        activity_name="晨间签到",
        template_type=ChatTemplateType.CHECKIN,
    )
    assert res.status == ChatSessionStatus.CONFIRMING
    assert res.is_complete is True
    assert "《晨间签到》" in res.reply


def test_basic_template_skip_note_and_confirm():
    """BASIC：用户直接「跳过」→ 进入摘要 → 确认。"""
    start_session(
        session_id="s-basic",
        activity_id=2,
        activity_name="社区探访",
        template_type=ChatTemplateType.BASIC,
    )

    res1 = handle_message("s-basic", "跳过")
    assert res1.status == ChatSessionStatus.CONFIRMING
    assert "社区探访" in res1.reply
    assert res1.collected_fields == {}

    res2 = handle_message("s-basic", "确认")
    assert res2.status == ChatSessionStatus.CONFIRMING  # 仍待 mark_completed
    assert "确认" in res2.reply


def test_donation_template_collects_amount_and_note():
    """DONATION：收金额 → 收留言 → 摘要 → 确认 → mark_completed。"""
    start_session(
        session_id="s-donation",
        activity_id=3,
        activity_name="春季捐赠",
        template_type=ChatTemplateType.DONATION,
    )

    res1 = handle_message("s-donation", "我想捐 200 元")
    assert res1.collected_fields["amount"] == 200
    assert res1.status == ChatSessionStatus.COLLECTING
    assert "留言" in res1.reply or "备注" in res1.reply

    res2 = handle_message("s-donation", "希望能帮助更多人")
    assert res2.status == ChatSessionStatus.CONFIRMING
    assert res2.collected_fields == {"amount": 200, "note": "希望能帮助更多人"}
    assert "希望能帮助更多人" in res2.reply

    res3 = handle_message("s-donation", "确认")
    assert res3.status == ChatSessionStatus.CONFIRMING

    done = mark_completed("s-donation")
    assert done is not None
    assert done.status == ChatSessionStatus.COMPLETED
    assert "成功" in done.reply


def test_volunteer_template_collects_hours():
    """VOLUNTEER：收服务时长 → 跳过备注 → 摘要。"""
    start_session(
        session_id="s-vol",
        activity_id=4,
        activity_name="植树志愿",
        template_type=ChatTemplateType.VOLUNTEER,
    )

    res1 = handle_message("s-vol", "3 小时")
    assert res1.collected_fields["hours"] == 3
    assert res1.status == ChatSessionStatus.COLLECTING

    res2 = handle_message("s-vol", "跳过")
    assert res2.status == ChatSessionStatus.CONFIRMING
    assert "3" in res2.reply
    assert "小时" in res2.reply


def test_custom_template_uses_form_schema_with_name_key():
    """CUSTOM：form_schema 使用权威字段键 `name`，与前端 FormFieldSchema 对齐。"""
    schema = (
        '[{"name":"team","label":"所在团队","type":"text","required":true},'
        '{"name":"size","label":"同行人数","type":"number","required":true}]'
    )
    start_session(
        session_id="s-custom",
        activity_id=5,
        activity_name="定制活动",
        template_type=ChatTemplateType.CUSTOM,
        form_schema=schema,
    )

    res1 = handle_message("s-custom", "研发团队")
    assert res1.collected_fields["team"] == "研发团队"
    assert res1.status == ChatSessionStatus.COLLECTING

    res2 = handle_message("s-custom", "4")
    assert res2.collected_fields["size"] == 4
    assert res2.status == ChatSessionStatus.CONFIRMING


def test_custom_template_falls_back_to_legacy_key_field():
    """兼容历史数据：schema 条目仅有 `key` 时也能解析出字段。"""
    schema = '[{"key":"legacy","label":"老字段","type":"text","required":true}]'
    start_session(
        session_id="s-legacy",
        activity_id=50,
        activity_name="兼容活动",
        template_type=ChatTemplateType.CUSTOM,
        form_schema=schema,
    )
    res = handle_message("s-legacy", "示例值")
    assert res.collected_fields == {"legacy": "示例值"}


# ================= 负例：无效输入 / 偏题 =================


def test_donation_rejects_non_numeric_amount():
    """DONATION：金额字段收到文字时提示重试，且不推进到下一字段。"""
    start_session(
        session_id="s-dn-bad",
        activity_id=6,
        activity_name="爱心捐款",
        template_type=ChatTemplateType.DONATION,
    )

    res = handle_message("s-dn-bad", "我想捐一些钱")
    assert "金额" in res.reply
    assert res.collected_fields == {}
    assert res.status == ChatSessionStatus.COLLECTING


def test_volunteer_rejects_invalid_hours():
    """VOLUNTEER：服务时长非数字时提示重试。"""
    start_session(
        session_id="s-vol-bad",
        activity_id=7,
        activity_name="公益讲解",
        template_type=ChatTemplateType.VOLUNTEER,
    )

    res = handle_message("s-vol-bad", "很久")
    assert "数字" in res.reply or "时长" in res.reply
    assert res.collected_fields == {}


def test_empty_content_is_handled_gracefully():
    """空消息有友好兜底。"""
    start_session(
        session_id="s-empty",
        activity_id=8,
        activity_name="活动",
        template_type=ChatTemplateType.DONATION,
    )
    res = handle_message("s-empty", "   ")
    assert "再发一次" in res.reply


def test_unknown_session_returns_none():
    """未知 session_id → handle_message 返回 None。"""
    assert handle_message("nonexistent", "hello") is None


def test_modify_intent_after_confirming():
    """确认阶段：用户请求修改金额，Agent 更新字段并重新展示摘要。"""
    start_session(
        session_id="s-modify",
        activity_id=9,
        activity_name="捐赠活动",
        template_type=ChatTemplateType.DONATION,
    )
    handle_message("s-modify", "100")
    handle_message("s-modify", "跳过")

    res = handle_message("s-modify", "修改金额为 300")
    assert res.collected_fields["amount"] == 300
    assert res.status == ChatSessionStatus.CONFIRMING
    assert "300" in res.reply


# ================= 意图识别（确认 / 修改）白名单 =================


@pytest.mark.parametrize(
    "text",
    ["确认", "确定", "提交", "没问题", "好的", "ok", "OK", "对", "yes"],
)
def test_detect_confirm_intent_positive(text: str):
    assert detect_confirm_intent(text) is True


@pytest.mark.parametrize(
    "text",
    [
        "对会",          # 子串匹配旧实现会误命中“对”
        "对方",
        "我再想想",       # 含“想”不应视为确认
        "不对",          # 修改否定
        "错了",
        "修改金额",
        "我还没想好",
        "嗯？",           # 含问号 + 疑问
    ],
)
def test_detect_confirm_intent_negative(text: str):
    assert detect_confirm_intent(text) is False


@pytest.mark.parametrize(
    "text",
    ["修改金额", "把金额改成 300", "不对", "错了", "我再想想", "重新填"],
)
def test_detect_modify_intent_positive(text: str):
    assert detect_modify_intent(text) is True


@pytest.mark.parametrize(
    "text",
    ["确认", "提交", "ok", "好的"],
)
def test_detect_modify_intent_negative(text: str):
    assert detect_modify_intent(text) is False


@pytest.mark.parametrize(
    "text, expected_field, expected_value",
    [
        ("把金额改成 200", "金额", "200"),
        ("将服务时长调整为 5 小时", "服务时长", "5 小时"),
        ("金额 改 300", "金额", "300"),
        ("修改留言为 加油", "留言", "加油"),
    ],
)
def test_parse_modify_instruction(text, expected_field, expected_value):
    field_hint, value = parse_modify_instruction(text)
    assert field_hint == expected_field
    assert value == expected_value


def test_parse_modify_instruction_unrecognized():
    field_hint, value = parse_modify_instruction("再想想")
    assert field_hint is None and value is None


# ================= _handle_modify：字段识别 + 新值解析 =================


def test_handle_modify_inline_value_applies_directly():
    """“把金额改成 200” 在确认阶段被识别后，原地更新字段并回到 CONFIRMING。"""
    start_session(
        session_id="s-mi",
        activity_id=11,
        activity_name="爱心捐赠",
        template_type=ChatTemplateType.DONATION,
    )
    handle_message("s-mi", "100")
    handle_message("s-mi", "谢谢")
    res = handle_message("s-mi", "把金额改成 200")
    assert res.status == ChatSessionStatus.CONFIRMING
    assert res.collected_fields["amount"] == 200
    assert "200" in res.reply


def test_handle_modify_without_field_asks_user():
    """未识别具体字段时，Agent 询问“你想修改哪一项？”。"""
    start_session(
        session_id="s-ask",
        activity_id=12,
        activity_name="社区公益",
        template_type=ChatTemplateType.DONATION,
    )
    handle_message("s-ask", "100")
    handle_message("s-ask", "跳过")
    res = handle_message("s-ask", "重新填")
    assert "修改哪一项" in res.reply
    # 状态保持在 CONFIRMING，等用户进一步澄清
    assert res.status == ChatSessionStatus.CONFIRMING


def test_handle_modify_field_only_returns_to_collecting():
    """“修改金额” 无新值时，回到 COLLECTING 状态等待新值。"""
    start_session(
        session_id="s-f",
        activity_id=13,
        activity_name="社区公益",
        template_type=ChatTemplateType.DONATION,
    )
    handle_message("s-f", "100")
    handle_message("s-f", "谢谢")
    res = handle_message("s-f", "修改金额")
    assert res.status == ChatSessionStatus.COLLECTING
    assert "金额" in res.reply


# ================= sessionId 冲突 =================


def test_start_session_raises_on_duplicate_session_id():
    """sessionId 已存在时 start_session 抛 SessionConflictError，不覆盖活跃会话。"""
    start_session(
        session_id="dup",
        activity_id=20,
        activity_name="活动 A",
        template_type=ChatTemplateType.DONATION,
    )
    with pytest.raises(SessionConflictError):
        start_session(
            session_id="dup",
            activity_id=21,
            activity_name="活动 B",
            template_type=ChatTemplateType.DONATION,
        )
