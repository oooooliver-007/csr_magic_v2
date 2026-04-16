"""Pillow 合成最终海报 — 在 AI 生成的背景图上叠加文字"""

import logging
from io import BytesIO
from typing import Optional
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# 海报尺寸
POSTER_WIDTH = 1024
POSTER_HEIGHT = 1024

# 文字颜色
TEXT_COLOR_PRIMARY = (255, 255, 255)  # 白色
TEXT_COLOR_ACCENT = (255, 179, 71)    # #FFB347 强调色


def compose_poster(
    background_bytes: bytes,
    activity_name: str,
    user_name: Optional[str] = None,
) -> bytes:
    """
    在 AI 生成的背景图上叠加活动信息文字。

    Args:
        background_bytes: AI 生成的背景图字节数据
        activity_name: 活动名称
        user_name: 用户姓名（可选）
    Returns:
        合成后海报的 PNG 字节数据
    """
    logger.info("开始合成海报，活动=%s", activity_name)

    # 打开背景图并调整尺寸
    bg = Image.open(BytesIO(background_bytes)).convert("RGBA")
    bg = bg.resize((POSTER_WIDTH, POSTER_HEIGHT), Image.Resampling.LANCZOS)

    # 创建渐变遮罩层（底部半透明黑色渐变）
    overlay = Image.new("RGBA", (POSTER_WIDTH, POSTER_HEIGHT), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    for y in range(POSTER_HEIGHT // 2, POSTER_HEIGHT):
        alpha = int(180 * (y - POSTER_HEIGHT // 2) / (POSTER_HEIGHT // 2))
        draw_overlay.line([(0, y), (POSTER_WIDTH, y)], fill=(0, 0, 0, alpha))

    bg = Image.alpha_composite(bg, overlay)

    # 在合成图上绘制文字
    draw = ImageDraw.Draw(bg)

    # 尝试加载字体，回退到默认字体
    try:
        font_large = ImageFont.truetype("arial.ttf", 48)
        font_medium = ImageFont.truetype("arial.ttf", 28)
        font_small = ImageFont.truetype("arial.ttf", 22)
    except (OSError, IOError):
        logger.warning("未找到 Arial 字体，使用默认字体")
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # 底部文字区域
    text_y = POSTER_HEIGHT - 200

    # 标签文字："I'm joining!"
    draw.text(
        (60, text_y),
        "I'm joining!",
        font=font_small,
        fill=TEXT_COLOR_ACCENT,
    )

    # 活动名称
    draw.text(
        (60, text_y + 35),
        activity_name,
        font=font_large,
        fill=TEXT_COLOR_PRIMARY,
    )

    # 用户姓名（可选）
    if user_name:
        draw.text(
            (60, text_y + 95),
            f"— {user_name}",
            font=font_medium,
            fill=(255, 255, 255, 200),
        )

    # CSR Magic 品牌标识
    draw.text(
        (60, POSTER_HEIGHT - 50),
        "CSR Magic",
        font=font_small,
        fill=(255, 255, 255, 150),
    )

    # 导出为 PNG
    output = BytesIO()
    bg.convert("RGB").save(output, format="PNG", quality=95)
    poster_bytes = output.getvalue()
    logger.info("海报合成完成，大小=%d bytes", len(poster_bytes))
    return poster_bytes
