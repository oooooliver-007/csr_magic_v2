"""测试配置 — 在所有测试之前执行"""

import os
import sys

# 将 csr_ai_service 目录加入 sys.path，确保可以导入 app 模块
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置测试环境变量（避免读取 .env 文件中的真实密钥）
os.environ.setdefault("DASHSCOPE_API_KEY", "test-key")
os.environ.setdefault("API_AUTH_TOKEN", "test-secret-token")
os.environ.setdefault("POSTER_STORAGE_DIR", "static/posters")
