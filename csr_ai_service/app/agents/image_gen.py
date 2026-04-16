"""通义万相 Wan 2.7 Image Pro API 调用封装（multimodal-generation 端点）"""

import logging
from typing import Any, Dict

import httpx

from config import DASHSCOPE_API_KEY, IMAGE_MODEL

logger = logging.getLogger(__name__)

DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"


async def generate_image(prompt: str) -> str:
    """
    调用通义万相 wan2.7-image-pro 生成图片，返回临时图片 URL。

    使用 HTTP 同步调用端点（一次请求获得结果）。
    Returns:
        临时图片 URL（有效期 24h，需及时下载）
    Raises:
        RuntimeError: API 调用失败时
    """
    logger.info("调用通义万相 API，模型=%s", IMAGE_MODEL)

    payload: Dict[str, Any] = {
        "model": IMAGE_MODEL,
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"text": prompt}
                    ],
                }
            ]
        },
        "parameters": {
            "size": "1024*1024",
            "n": 1,
            "watermark": False,
        },
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(DASHSCOPE_API_URL, json=payload, headers=headers)

        if resp.status_code != 200:
            error_msg = f"通义万相 API 返回 HTTP {resp.status_code}: {resp.text}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        data = resp.json()
        choices = data.get("output", {}).get("choices", [])
        if not choices:
            raise RuntimeError(f"API 返回成功但无 choices: {data}")

        content_list = choices[0].get("message", {}).get("content", [])
        for item in content_list:
            if "image" in item:
                image_url = item["image"]
                logger.info("图片生成成功，临时 URL=%s", image_url)
                return image_url

        raise RuntimeError(f"API 返回成功但未包含图片 URL: {data}")

    except RuntimeError:
        raise
    except Exception as e:
        error_msg = f"通义万相 API 异常: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e


async def download_image(url: str) -> bytes:
    """
    下载图片 URL 的内容为 bytes。

    Args:
        url: 图片 URL
    Returns:
        图片字节数据
    """
    logger.info("下载图片: %s", url)
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        logger.info("图片下载完成，大小=%d bytes", len(resp.content))
        return resp.content
