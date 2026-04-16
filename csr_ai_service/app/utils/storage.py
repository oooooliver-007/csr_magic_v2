"""本地文件存储 — 海报图片保存到 static/posters/"""

import logging
from pathlib import Path

from config import POSTER_STORAGE_DIR

logger = logging.getLogger(__name__)


def save_poster(task_id: str, image_bytes: bytes) -> str:
    """
    保存海报图片到本地文件系统。

    Args:
        task_id: 任务 ID（用作文件名）
        image_bytes: 海报 PNG 字节数据
    Returns:
        相对于服务根目录的访问路径，如 /static/posters/{task_id}.png
    """
    storage_dir = Path(POSTER_STORAGE_DIR)
    storage_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"{task_id}.png"
    file_path = storage_dir / file_name

    file_path.write_bytes(image_bytes)
    logger.info("海报已保存: %s（%d bytes）", file_path, len(image_bytes))

    # 返回可通过 HTTP 访问的相对路径
    return f"/static/posters/{file_name}"
