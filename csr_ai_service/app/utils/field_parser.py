"""对话字段解析 — 从用户自然语言输入中抽取结构化字段值"""

import json
import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

# 数字正则（支持整数和小数，允许前后带中英文字符，常见于 “捐 200 元”“3 小时”）
_NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")

# 修改指令的分词模板（按优先级从强到弱，防止“修改金额”误拆为 (“修”, “金额”)）
_MODIFY_INSTRUCTION_PATTERNS: tuple[re.Pattern[str], ...] = (
    # A: 把/将 X [改|修改|换|调整] [成/为/到]? Y
    re.compile(r"^(?:把|将)\s*(\S+?)\s*(?:改|修改|换|调整)(?:成|为|到)?\s*(.+)$"),
    # B: 修改/换/调整 X 为/成/到 Y
    re.compile(r"^(?:修改|换|调整)\s*(\S+?)\s*(?:为|成|到)\s*(.+)$"),
    # C: X 改成/改为/换成/换为 Y（连写）
    re.compile(r"^(\S+?)\s*(?:改成|改为|换成|换为)\s*(.+)$"),
    # D: X <空白> 改|换 Y（必须有分隔空白，避免“修改金额”误拆）
    re.compile(r"^(\S+?)\s+(?:改|换)\s*(.+)$"),
)

# 确认意图：
#   - _CONFIRM_EQUALS：短语本身即确认（严格等值匹配），避免 “对会” 误命中 “对”
#   - _CONFIRM_PHRASES：出现即视为确认的无歧义长短语
_CONFIRM_EQUALS: tuple[str, ...] = ("对", "好", "yes", "y", "ok")
_CONFIRM_PHRASES: tuple[str, ...] = (
    "确认", "确定", "提交", "没问题", "没毛病", "好的", "好了", "可以", "行",
    "就这样", "就这么", "完成", "确认提交",
)

# 修改意图关键词（更严格：明确的动词短语）
_MODIFY_PHRASES: tuple[str, ...] = (
    "修改", "改一下", "改成", "改为", "不对", "错了", "重新", "重填", "再想想",
    "不是", "换", "调整",
)

# 跳过意图
_SKIP_EQUALS: tuple[str, ...] = ("跳过", "无", "没有", "skip", "none", "n/a", "空")
_SKIP_PHRASES: tuple[str, ...] = ("不写", "不填", "跳过吧", "先跳过", "不用填")

# 标点（用于归一化）
_PUNCT_STRIP = " \t\n\r，。！？、,.!?~～"


def _normalize(text: str) -> str:
    return (text or "").strip().strip(_PUNCT_STRIP).lower()


def parse_number(text: str) -> Optional[float]:
    """从文本中抽取第一个数字。"""
    match = _NUMBER_PATTERN.search(text or "")
    if match is None:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def parse_text_field(text: str) -> Optional[str]:
    """解析文本字段：跳过意图返回 None，否则返回 trim 后的文本。"""
    stripped = (text or "").strip()
    if not stripped:
        return None
    lower = _normalize(stripped)
    if lower in _SKIP_EQUALS:
        return None
    if any(kw in lower for kw in _SKIP_PHRASES):
        return None
    return stripped


def detect_confirm_intent(text: str) -> bool:
    """判断用户是否表达了“确认提交”的意图。

    策略：
    1) 归一化后精确等值命中 _CONFIRM_EQUALS（避免短词子串误判，例如 “对会” 命中 “对”）。
    2) 或者出现明确的长短语（_CONFIRM_PHRASES）。
    3) 如果同时出现修改意图（detect_modify_intent），优先判为修改，不视为确认。
    """
    lower = _normalize(text)
    if not lower:
        return False
    if detect_modify_intent(text):
        return False
    if lower in _CONFIRM_EQUALS:
        return True
    return any(kw in lower for kw in _CONFIRM_PHRASES)


def detect_modify_intent(text: str) -> bool:
    """判断用户是否表达了“需要修改”的意图。"""
    lower = _normalize(text)
    if not lower:
        return False
    return any(kw in lower for kw in _MODIFY_PHRASES)


def parse_modify_instruction(text: str) -> tuple[Optional[str], Optional[str]]:
    """尝试从“把 X 改成 Y” 等指令中拆出 (field_hint, new_value_raw)。

    未命中时返回 (None, None)。new_value_raw 是尚未按类型解析的原始片段，
    由调用方按 FieldDef.type 进一步 parse_number / trim。
    """
    raw = (text or "").strip()
    if not raw:
        return None, None
    for pattern in _MODIFY_INSTRUCTION_PATTERNS:
        match = pattern.search(raw)
        if not match:
            continue
        field_hint = match.group(1).strip(_PUNCT_STRIP)
        value_raw = match.group(2).strip(_PUNCT_STRIP)
        if field_hint and value_raw:
            return field_hint, value_raw
    return None, None


def extract_json_fields(text: str) -> dict[str, Any]:
    """从文本中抽取 <fields>{...}</fields> 结构化标记。未找到则返回空 dict。"""
    match = re.search(r"<fields>(.*?)</fields>", text or "", re.DOTALL)
    if match is None:
        return {}
    try:
        data = json.loads(match.group(1))
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        logger.warning("field tag JSON 解析失败: %s", match.group(1))
    return {}
