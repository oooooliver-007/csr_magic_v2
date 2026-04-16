"""Prompt 模板构建 — 根据活动类型+风格构建通义万相 prompt"""

import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

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


def build_poster_prompt(
    activity_name: str,
    activity_type: str,
    style: str,
    user_prompt: Optional[str] = None,
) -> str:
    """
    构建海报生成 prompt。

    优先级：用户自定义 > 风格模板 + 活动类型模板
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

    # 用户自定义提示词追加
    if user_prompt and user_prompt.strip():
        base += f"Additional instructions: {user_prompt.strip()}. "

    # 通用质量后缀
    base += (
        "The poster should be visually appealing, professional, "
        "suitable for corporate communications. High quality, detailed."
    )

    logger.info("构建 prompt 完成，活动=%s，风格=%s", activity_name, style)
    return base
