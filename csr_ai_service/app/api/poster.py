"""海报生成 API 路由"""

import logging
import asyncio
from fastapi import APIRouter, HTTPException, Header, Depends

from models import (
    GeneratePosterRequest,
    PosterTaskResponse,
    PosterStatus,
    ApiResponseModel,
)
from app.agents.poster_agent import run_poster_generation, get_task_status
from app.utils.storage import get_poster_bytes
from app.utils.rate_limit import RateLimiter
from config import API_AUTH_TOKEN
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter()


def verify_api_key(x_api_key: str = Header(None, alias="X-Api-Key")) -> None:
    """
    API 鉴权依赖：验证 X-Api-Key 头是否匹配配置的共享密钥。
    未配置密钥时（开发环境）跳过鉴权。
    """
    if API_AUTH_TOKEN and x_api_key != API_AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="无效的 API 密钥")


@router.post("/generate", dependencies=[Depends(verify_api_key), Depends(RateLimiter(max_requests=5, window_seconds=60))])
async def generate_poster(request: GeneratePosterRequest) -> ApiResponseModel:
    """
    接收海报生成请求，异步启动生成任务。

    立即返回 task_id，前端通过轮询 GET /poster/{task_id} 获取状态。
    需要 X-Api-Key 头部进行鉴权。
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


@router.get("/{task_id}/image")
async def get_poster_image(task_id: str):
    """
    返回海报原始 PNG 图片字节，供后端下载后存入 DB。
    文件不存在时返回 404。
    """
    image_bytes = get_poster_bytes(task_id)
    if image_bytes is None:
        raise HTTPException(status_code=404, detail=f"海报图片不存在: {task_id}")

    return Response(content=image_bytes, media_type="image/png")