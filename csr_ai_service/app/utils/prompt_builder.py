"""Prompt 模板构建 — 根据活动类型+风格构建通义万相 prompt，含注入过滤"""

import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# 用户提示词最大长度
MAX_USER_PROMPT_LENGTH = 500

# 需要从用户输入中移除的危险模式
UNSAFE_PATTERNS = [
    r"<script[^>]*>.*?</script>",  # script 标签
    r"<[^>]+>",                     # 任何 HTML 标签
    r"javascript\s*:",              # javascript: 协议
    r"on\w+\s*=",                   # 事件处理器
]

# 风格 → prompt 片段映射
STYLE_PROMPTS: Dict[str, str] = {
    "minimalist": "minimalist modern design, clean lines, flat colors, geometric shapes, simple composition",
    "watercolor": "watercolor painting style, soft brush strokes, flowing colors, artistic, hand-painted feel",
    "3d": "3D rendered illustration, volumetric lighting, depth of field, modern 3D art style, vibrant",
    "cartoon": "cartoon illustration style, cute characters, bright vivid colors, playful, fun",
    "chinese": "Chinese traditional art style (国潮), ink painting elements, red and gold tones, cultural motifs",
    "realistic": "realistic photography style, high detail, natural lighting, cinematic composition",
}

# 活动模板类型 → 活动主题 prompt 片段
ACTIVITY_TYPE_PROMPTS: Dict[str, str] = {
    "BASIC": "corporate social responsibility event, community gathering, people working together",
    "DONATION": "charity donation event, giving, generosity, helping hands, warm atmosphere",
    "VOLUNTEER": "volunteer service event, people helping community, outdoor teamwork, positive energy",
    "CHECKIN": "event check-in, community participation, people gathering at venue",
    "CUSTOM": "corporate social responsibility event, team collaboration",
}


def sanitize_user_prompt(user_prompt: str) -> str:
    """
    清洗用户自定义提示词：
    1. 移除 HTML 标签和脚本
    2. 移除危险协议和事件处理器
    3. 截断到最大长度
    """
    if not user_prompt:
        return ""

    cleaned = user_prompt.strip()

    # 移除危险模式
    for pattern in UNSAFE_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE | re.DOTALL)

    # 截断到最大长度
    if len(cleaned) > MAX_USER_PROMPT_LENGTH:
        cleaned = cleaned[:MAX_USER_PROMPT_LENGTH]
        logger.warning("用户提示词超长，已截断至 %d 字符", MAX_USER_PROMPT_LENGTH)

    return cleaned.strip()


def build_poster_prompt(
    activity_name: str,
    activity_type: str,
    style: str,
    user_prompt: Optional[str] = None,
) -> str:
    """
    构建海报生成 prompt。

    优先级：用户自定义 > 风格模板 + 活动类型模板
    用户输入经过安全清洗。
    """
    style_fragment = STYLE_PROMPTS.get(style, STYLE_PROMPTS["minimalist"])
    activity_fragment = ACTIVITY_TYPE_PROMPTS.get(
        activity_type, ACTIVITY_TYPE_PROMPTS["BASIC"]
    )

    # 基础 prompt：CSR 海报 + 活动名称
    base = (
        f"Create a beautiful CSR (Corporate Social Responsibility) poster "
        f"for an event called '{activity_name}'. "
        f"Theme: {activity_fragment}. "
        f"Art style: {style_fragment}. "
    )

    # 用户自定义提示词（已清洗）
    safe_prompt = sanitize_user_prompt(user_prompt or "")
    if safe_prompt:
        base += f"Additional instructions: {safe_prompt}. "

    # 通用质量后缀
    base += (
        "The poster should be visually appealing, professional, "
        "suitable for corporate communications. High quality, detailed."
    )

    logger.info("构建 prompt 完成，活动=%s，风格=%s", activity_name, style)
    return base
