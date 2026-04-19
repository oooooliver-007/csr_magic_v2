"""pytest 公共配置 — 把服务根目录加入 sys.path 以便直接 import main/models/app.*。"""

import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
