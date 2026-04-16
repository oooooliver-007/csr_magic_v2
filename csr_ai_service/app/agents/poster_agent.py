"""海报生成主流程编排 — 协调 prompt_builder、image_gen、image_compose、storage"""

import logging
import asyncio
from typing import Dict, Optional

from models import GeneratePosterRequest, PosterStatus, PosterTaskResponse
from app.utils.prompt_builder import build_poster_prompt
from app.agents.image_gen import generate_image, download_image
from app.utils.image_compose import compose_poster
from app.utils.storage import save_poster

logger = logging.getLogger(__name__)

# 内存中的任务状态存储（MVP 方案，生产环境应使用 Redis/DB）
_task_store: Dict[str, PosterTaskResponse] = {}


def get_task_status(task_id: str) -> Optional[PosterTaskResponse]:
    """查询任务状态"""
    return _task_store.get(task_id)


async def run_poster_generation(request: GeneratePosterRequest) -> None:
    """
    海报生成完整流程（异步执行）：
    1. 构建 prompt
    2. 调用通义万相生成图片
    3. 下载临时 URL 图片
    4. Pillow 合成最终海报
    5. 保存到本地文件
    6. 更新任务状态
    """
    task_id = request.task_id
    logger.info("开始海报生成任务: task_id=%s", task_id)

    # 更新状态为 GENERATING
    _task_store[task_id] = PosterTaskResponse(
        task_id=task_id,
        status=PosterStatus.GENERATING,
    )

    try:
        # 1. 构建 prompt
        prompt = build_poster_prompt(
            activity_name=request.activity_name,
            activity_type=request.activity_type,
            style=request.style.value,
            user_prompt=request.user_prompt,
        )

        # 2. 调用通义万相生成图片
        temp_url = await generate_image(prompt)

        # 3. 下载临时 URL 图片
        image_bytes = await download_image(temp_url)

        # 4. Pillow 合成最终海报（叠加文字）
        poster_bytes = compose_poster(
            background_bytes=image_bytes,
            activity_name=request.activity_name,
            user_name=request.user_name,
        )

        # 5. 保存到本地文件
        poster_path = save_poster(task_id, poster_bytes)

        # 6. 更新状态为 COMPLETED
        _task_store[task_id] = PosterTaskResponse(
            task_id=task_id,
            status=PosterStatus.COMPLETED,
            poster_url=poster_path,
        )
        logger.info("海报生成成功: task_id=%s, path=%s", task_id, poster_path)

    except Exception as e:
        error_msg = str(e)
        logger.error("海报生成失败: task_id=%s, error=%s", task_id, error_msg)
        _task_store[task_id] = PosterTaskResponse(
            task_id=task_id,
            status=PosterStatus.FAILED,
            error_message=error_msg,
        )
