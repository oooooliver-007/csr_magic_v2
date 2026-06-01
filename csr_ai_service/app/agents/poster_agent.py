"""海报生成主流程编排 — 协调 prompt_builder、image_gen、image_compose、storage

任务状态持久化到本地 JSON 文件，AI 服务重启后自动恢复。
生成完成后主动回调后端，无需轮询等待。
"""

import logging
import asyncio
import json
import os
import threading
import time
from typing import Dict, Optional

import httpx

from config import BACKEND_BASE_URL, POSTER_CALLBACK_TOKEN
from models import GeneratePosterRequest, PosterStatus, PosterTaskResponse
from app.utils.prompt_builder import build_poster_prompt
from app.agents.image_gen import generate_image, download_image
from app.utils.image_compose import compose_poster
from app.utils.storage import save_poster

logger = logging.getLogger(__name__)

# 持久化文件路径（与 static/posters 同级）
TASK_STORE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "task_store.json")

# 线程安全的任务状态存储
_task_store: Dict[str, PosterTaskResponse] = {}
_store_lock = threading.Lock()

# 已完成/失败任务的保留时间（秒），超时后自动从内存中清理
TASK_RETENTION_SECONDS = 3600  # 1 小时


def _normalize_path() -> str:
    """解析持久化文件的绝对路径"""
    return os.path.abspath(TASK_STORE_FILE)


def _load_task_store() -> None:
    """从 JSON 文件恢复任务状态（模块加载时调用）"""
    global _task_store
    filepath = _normalize_path()
    if not os.path.exists(filepath):
        logger.info("任务存储文件不存在，使用空存储: %s", filepath)
        return

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        loaded = 0
        now = time.time()
        for task_id, item in data.items():
            status = item.get("status")
            if status in (PosterStatus.COMPLETED.value, PosterStatus.FAILED.value):
                continue
            _task_store[task_id] = PosterTaskResponse(**item)
            loaded += 1
        logger.info("从 %s 恢复了 %d 个任务状态", filepath, loaded)
    except Exception as e:
        logger.error("加载任务存储文件失败: %s", e)


def _save_task_store() -> None:
    """将当前任务状态写入 JSON 文件"""
    filepath = _normalize_path()
    try:
        with _store_lock:
            data = {tid: t.model_dump() for tid, t in _task_store.items()}
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error("保存任务存储文件失败: %s", e)


def _cleanup_old_tasks() -> None:
    """清理过期的已完成/失败任务，防止内存无限增长"""
    global _task_store
    to_remove = []
    with _store_lock:
        for task_id, task in _task_store.items():
            if task.status in (PosterStatus.COMPLETED, PosterStatus.FAILED):
                to_remove.append(task_id)
    if len(to_remove) > 100:
        remove_count = len(to_remove) - 100
        with _store_lock:
            for task_id in to_remove[:remove_count]:
                _task_store.pop(task_id, None)
        logger.info("清理了 %d 个过期任务", remove_count)
        _save_task_store()


async def _callback_backend(task_id: str, status: PosterStatus,
                            poster_url: str = None, error_message: str = None) -> bool:
    """
    回调后端更新任务状态。
    如果后端不可达或令牌未配置，静默失败（后端轮询兜底）。
    """
    if not POSTER_CALLBACK_TOKEN:
        logger.debug("POSTER_CALLBACK_TOKEN 未配置，跳过回调")
        return False

    callback_url = f"{BACKEND_BASE_URL}/api/v2/posters/{task_id}/callback"
    payload = {
        "status": status.value,
        "poster_url": poster_url or "",
        "error_message": error_message or "",
    }
    headers = {
        "Content-Type": "application/json",
        "X-Callback-Token": POSTER_CALLBACK_TOKEN,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(callback_url, json=payload, headers=headers)
        if resp.status_code == 200:
            logger.info("回调后端成功: task_id=%s, status=%s", task_id, status.value)
            return True
        else:
            logger.warning("回调后端返回 HTTP %d: task_id=%s", resp.status_code, task_id)
            return False
    except Exception as e:
        logger.warning("回调后端失败（将由轮询兜底）: task_id=%s, error=%s", task_id, e)
        return False


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
    6. 更新本地状态 + 回调后端
    """
    task_id = request.task_id
    logger.info("开始海报生成任务: task_id=%s", task_id)

    # 更新状态为 GENERATING
    with _store_lock:
        _task_store[task_id] = PosterTaskResponse(
            task_id=task_id,
            status=PosterStatus.GENERATING,
        )
    _save_task_store()

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

        # 6. 更新状态 + 回调后端
        with _store_lock:
            _task_store[task_id] = PosterTaskResponse(
                task_id=task_id,
                status=PosterStatus.COMPLETED,
                poster_url=poster_path,
            )
        _save_task_store()
        logger.info("海报生成成功: task_id=%s, path=%s", task_id, poster_path)

        # 回调后端（失败时由轮询兜底）
        await _callback_backend(task_id, PosterStatus.COMPLETED, poster_url=poster_path)

    except Exception as e:
        error_msg = str(e)
        logger.error("海报生成失败: task_id=%s, error=%s", task_id, error_msg)
        with _store_lock:
            _task_store[task_id] = PosterTaskResponse(
                task_id=task_id,
                status=PosterStatus.FAILED,
                error_message=error_msg,
            )
        _save_task_store()

        # 回调后端通知失败
        await _callback_backend(task_id, PosterStatus.FAILED, error_message=error_msg)

    finally:
        _cleanup_old_tasks()


# 模块加载时恢复持久化的任务状态
_load_task_store()
