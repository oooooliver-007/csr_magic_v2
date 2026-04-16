"""AI 服务配置 — 通过环境变量加载"""

import os
from dotenv import load_dotenv

load_dotenv()

# DashScope API
DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")

# 图像生成模型
IMAGE_MODEL: str = os.getenv("IMAGE_MODEL", "wan2.7-image-pro")

# 服务端口
PORT: int = int(os.getenv("PORT", "8000"))

# 海报存储目录
POSTER_STORAGE_DIR: str = os.getenv("POSTER_STORAGE_DIR", "static/posters")

# 后端回调 URL（用于更新海报状态）
BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:8080")
