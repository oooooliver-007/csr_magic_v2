"""问卷生成 API 路由"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.agents.survey_agent import generate_survey

logger = logging.getLogger(__name__)

router = APIRouter()


class SurveyGenerateRequest(BaseModel):
    """问卷生成请求"""
    activity_name: str = Field(..., description="活动名称")
    activity_description: str = Field("", description="活动描述")
    template_type: str = Field(..., description="活动模板类型")


class ApiResponseModel(BaseModel):
    """统一 API 响应格式"""
    code: int = 200
    message: str = "success"
    data: Optional[object] = None


@router.post("/generate")
async def generate_survey_api(request: SurveyGenerateRequest) -> ApiResponseModel:
    """
    根据活动信息自动生成问卷题目。

    调用通义千问 API，返回结构化的问卷数据（标题、说明、题目列表）。
    """
    logger.info(
        "收到问卷生成请求: activity=%s, type=%s",
        request.activity_name,
        request.template_type,
    )

    try:
        result = await generate_survey(
            activity_name=request.activity_name,
            activity_description=request.activity_description,
            template_type=request.template_type,
        )

        return ApiResponseModel(
            code=200,
            message="success",
            data=result,
        )

    except RuntimeError as e:
        logger.error("问卷生成失败: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
