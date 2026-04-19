"""AI 服务 Pydantic 请求/响应模型"""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class PosterStyle(str, Enum):
    """海报风格枚举"""
    MINIMALIST = "minimalist"
    WATERCOLOR = "watercolor"
    THREE_D = "3d"
    CARTOON = "cartoon"
    CHINESE = "chinese"
    REALISTIC = "realistic"


class PosterStatus(str, Enum):
    """海报生成状态"""
    PENDING = "PENDING"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class GeneratePosterRequest(BaseModel):
    """海报生成请求"""
    task_id: str = Field(..., description="后端分配的任务 ID")
    activity_name: str = Field(..., description="活动名称")
    activity_type: str = Field(..., description="活动模板类型")
    style: PosterStyle = Field(..., description="海报风格")
    user_prompt: Optional[str] = Field(None, description="用户自定义提示词")
    user_name: Optional[str] = Field(None, description="用户姓名")


class PosterTaskResponse(BaseModel):
    """海报任务状态响应"""
    task_id: str
    status: PosterStatus
    poster_url: Optional[str] = None
    error_message: Optional[str] = None


class ApiResponseModel(BaseModel):
    """统一 API 响应格式"""
    code: int = 200
    message: str = "success"
    data: Optional[object] = None


# ========== AI 对话报名 ==========

class ChatTemplateType(str, Enum):
    """活动模板类型（与后端保持一致）"""
    BASIC = "BASIC"
    DONATION = "DONATION"
    VOLUNTEER = "VOLUNTEER"
    CHECKIN = "CHECKIN"
    CUSTOM = "CUSTOM"


class ChatSessionStatus(str, Enum):
    """会话状态。只保留三种终态；字段不合法由 reply 兜底，不单独升级为 FAILED。"""
    COLLECTING = "COLLECTING"     # 字段收集中
    CONFIRMING = "CONFIRMING"     # 字段齐全，等待用户确认
    COMPLETED = "COMPLETED"       # 已确认并提交


class ChatStartRequest(BaseModel):
    """创建会话请求（AI 服务内部）"""
    session_id: str = Field(..., description="后端分配的会话 ID")
    activity_id: int
    activity_name: str
    template_type: ChatTemplateType
    form_schema: Optional[str] = Field(None, description="CUSTOM 模板的字段 Schema（JSON 字符串）")


class ChatMessageRequest(BaseModel):
    """发送消息请求（AI 服务内部）"""
    session_id: str
    content: str = Field(..., description="用户输入内容")


class ChatMessage(BaseModel):
    """对话消息"""
    role: str  # user / assistant
    content: str


class ChatResponse(BaseModel):
    """对话响应（AI 服务）"""
    session_id: str
    reply: str
    status: ChatSessionStatus
    collected_fields: dict[str, Any] = Field(default_factory=dict)
    is_complete: bool = False
    messages: Optional[list[ChatMessage]] = None
