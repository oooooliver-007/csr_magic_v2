"""海报生成 API 路由"""

import logging
import asyncio
from fastapi import APIRouter, HTTPException

from models import (
    GeneratePosterRequest,
    PosterTaskResponse,
    PosterStatus,
    ApiResponseModel,
)
from app.agents.poster_agent import run_poster_generation, get_task_status

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate")
async def generate_poster(request: GeneratePosterRequest) -> ApiResponseModel:
    """
    接收海报生成请求，异步启动生成任务。

    立即返回 task_id，前端通过轮询 GET /poster/{task_id} 获取状态。
    """
    logger.info(
        "收到海报生成请求: task_id=%s, activity=%s, style=%s",
        request.task_id,
        request.activity_name,
        request.style.value,
    )

    # 异步启动生成任务（不等待完成）
    asyncio.create_task(run_poster_generation(request))

    return ApiResponseModel(
        code=200,
        message="success",
        data=PosterTaskResponse(
            task_id=request.task_id,
            status=PosterStatus.PENDING,
        ).model_dump(),
    )


@router.get("/{task_id}")
async def get_poster_status(task_id: str) -> ApiResponseModel:
    """查询海报生成任务状态"""
    task = get_task_status(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    return ApiResponseModel(
        code=200,
        message="success",
        data=task.model_dump(),
    )
