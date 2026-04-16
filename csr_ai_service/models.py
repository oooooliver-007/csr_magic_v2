"""AI 服务 Pydantic 请求/响应模型"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


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
