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

# 回调认证令牌（与后端 app.poster-callback-token 一致）
POSTER_CALLBACK_TOKEN: str = os.getenv("POSTER_CALLBACK_TOKEN", "")

# API 鉴权令牌（后端调用时需携带 X-Api-Key 头）
API_AUTH_TOKEN: str = os.getenv("API_AUTH_TOKEN", "")

# CORS 允许的来源（逗号分隔）
CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080")
