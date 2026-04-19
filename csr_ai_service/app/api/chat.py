"""AI 对话报名 API 路由"""

import logging

from fastapi import APIRouter, HTTPException

from models import (
    ApiResponseModel,
    ChatMessageRequest,
    ChatStartRequest,
)
from app.agents.chat_agent import (
    SessionConflictError,
    get_session,
    handle_message,
    mark_completed,
    start_session,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/start")
async def chat_start(request: ChatStartRequest) -> ApiResponseModel:
    """创建对话会话，返回开场白。"""
    logger.info(
        "创建对话会话: sessionId=%s, activityId=%d, template=%s",
        request.session_id,
        request.activity_id,
        request.template_type.value,
    )
    try:
        response = start_session(
            session_id=request.session_id,
            activity_id=request.activity_id,
            activity_name=request.activity_name,
            template_type=request.template_type,
            form_schema=request.form_schema,
        )
    except SessionConflictError:
        logger.warning("sessionId 冲突: sessionId=%s", request.session_id)
        raise HTTPException(status_code=409, detail=f"会话 {request.session_id} 已存在")
    return ApiResponseModel(code=200, message="success", data=response.model_dump())


@router.post("/message")
async def chat_message(request: ChatMessageRequest) -> ApiResponseModel:
    """处理用户消息，返回 Agent 回复与字段状态。"""
    response = handle_message(request.session_id, request.content)
    if response is None:
        raise HTTPException(status_code=404, detail=f"会话 {request.session_id} 不存在")
    return ApiResponseModel(code=200, message="success", data=response.model_dump())


@router.post("/{session_id}/complete")
async def chat_complete(session_id: str) -> ApiResponseModel:
    """由后端在真正提交参与记录后调用，标记会话完成。"""
    response = mark_completed(session_id)
    if response is None:
        raise HTTPException(status_code=404, detail=f"会话 {session_id} 不存在")
    return ApiResponseModel(code=200, message="success", data=response.model_dump())


@router.get("/{session_id}")
async def chat_get(session_id: str) -> ApiResponseModel:
    """查询会话状态与对话历史。"""
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"会话 {session_id} 不存在")
    return ApiResponseModel(
        code=200,
        message="success",
        data=session.to_response(
            session.messages[-1].content if session.messages else ""
        ).model_dump(),
    )
