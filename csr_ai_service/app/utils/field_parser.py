"""对话字段解析 — 从用户自然语言输入中抽取结构化字段值"""

import json
import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

# 数字正则（支持整数和小数，允许前后带中英文字符，常见于 “捐 200 元”“3 小时”）
_NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")

# 确认意图关键词
_CONFIRM_KEYWORDS = ("确认", "确定", "提交", "没问题", "ok", "yes", "对", "好的")
# 修改意图关键词
_MODIFY_KEYWORDS = ("修改", "改一下", "不对", "错了", "重新", "换", "no", "重填")
# 跳过意图关键词
_SKIP_KEYWORDS = ("跳过", "不写", "不填", "无", "没有", "skip")


def parse_number(text: str) -> Optional[float]:
    """从文本中抽取第一个数字。"""
    match = _NUMBER_PATTERN.search(text)
    if match is None:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def parse_text_field(text: str) -> Optional[str]:
    """解析文本字段：跳过意图返回 None，否则返回 trim 后的文本。"""
    stripped = text.strip()
    if not stripped:
        return None
    lower = stripped.lower()
    if any(kw in lower for kw in _SKIP_KEYWORDS):
        return None
    return stripped


def detect_confirm_intent(text: str) -> bool:
    """判断用户是否表达了“确认提交”的意图。"""
    lower = text.strip().lower()
    if not lower:
        return False
    return any(kw in lower for kw in _CONFIRM_KEYWORDS)


def detect_modify_intent(text: str) -> bool:
    """判断用户是否表达了“需要修改”的意图。"""
    lower = text.strip().lower()
    if not lower:
        return False
    return any(kw in lower for kw in _MODIFY_KEYWORDS)


def extract_json_fields(text: str) -> dict[str, Any]:
    """从文本中抽取 <fields>{...}</fields> 结构化标记。未找到则返回空 dict。"""
    match = re.search(r"<fields>(.*?)</fields>", text, re.DOTALL)
    if match is None:
        return {}
    try:
        data = json.loads(match.group(1))
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        logger.warning("field tag JSON 解析失败: %s", match.group(1))
    return {}
