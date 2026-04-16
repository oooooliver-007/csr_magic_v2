"""CSR Magic AI 服务入口"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from config import PORT, POSTER_STORAGE_DIR
from app.api.poster import router as poster_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="CSR Magic AI Service", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件：海报图片
poster_dir = Path(POSTER_STORAGE_DIR)
poster_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 注册路由
app.include_router(poster_router, prefix="/poster", tags=["海报生成"])


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
