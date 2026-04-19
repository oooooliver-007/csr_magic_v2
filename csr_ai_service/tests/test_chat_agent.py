"""对话 Agent 单元测试 — 覆盖 5 种模板类型 + 正例 / 负例。"""

import pytest

from app.agents.chat_agent import (
    handle_message,
    mark_completed,
    reset_sessions_for_tests,
    start_session,
)
from models import ChatSessionStatus, ChatTemplateType


@pytest.fixture(autouse=True)
def _reset_sessions():
    reset_sessions_for_tests()
    yield
    reset_sessions_for_tests()


# ================= 正例：各模板主流程 =================


def test_checkin_template_enters_confirming_immediately():
    """CHECKIN：无字段，开场即进入确认状态。"""
    res = start_session(
        session_id="s-checkin",
        activity_id=1,
        activity_name="晨间签到",
        template_type=ChatTemplateType.CHECKIN,
    )
    assert res.status == ChatSessionStatus.CONFIRMING
    assert res.is_complete is True
    assert "《晨间签到》" in res.reply


def test_basic_template_skip_note_and_confirm():
    """BASIC：用户直接「跳过」→ 进入摘要 → 确认。"""
    start_session(
        session_id="s-basic",
        activity_id=2,
        activity_name="社区探访",
        template_type=ChatTemplateType.BASIC,
    )

    res1 = handle_message("s-basic", "跳过")
    assert res1.status == ChatSessionStatus.CONFIRMING
    assert "社区探访" in res1.reply
    assert res1.collected_fields == {}

    res2 = handle_message("s-basic", "确认")
    assert res2.status == ChatSessionStatus.CONFIRMING  # 仍待 mark_completed
    assert "确认" in res2.reply


def test_donation_template_collects_amount_and_note():
    """DONATION：收金额 → 收留言 → 摘要 → 确认 → mark_completed。"""
    start_session(
        session_id="s-donation",
        activity_id=3,
        activity_name="春季捐赠",
        template_type=ChatTemplateType.DONATION,
    )

    res1 = handle_message("s-donation", "我想捐 200 元")
    assert res1.collected_fields["amount"] == 200
    assert res1.status == ChatSessionStatus.COLLECTING
    assert "留言" in res1.reply or "备注" in res1.reply

    res2 = handle_message("s-donation", "希望能帮助更多人")
    assert res2.status == ChatSessionStatus.CONFIRMING
    assert res2.collected_fields == {"amount": 200, "note": "希望能帮助更多人"}
    assert "希望能帮助更多人" in res2.reply

    res3 = handle_message("s-donation", "确认")
    assert res3.status == ChatSessionStatus.CONFIRMING

    done = mark_completed("s-donation")
    assert done is not None
    assert done.status == ChatSessionStatus.COMPLETED
    assert "成功" in done.reply


def test_volunteer_template_collects_hours():
    """VOLUNTEER：收服务时长 → 跳过备注 → 摘要。"""
    start_session(
        session_id="s-vol",
        activity_id=4,
        activity_name="植树志愿",
        template_type=ChatTemplateType.VOLUNTEER,
    )

    res1 = handle_message("s-vol", "3 小时")
    assert res1.collected_fields["hours"] == 3
    assert res1.status == ChatSessionStatus.COLLECTING

    res2 = handle_message("s-vol", "跳过")
    assert res2.status == ChatSessionStatus.CONFIRMING
    assert "3" in res2.reply
    assert "小时" in res2.reply


def test_custom_template_uses_form_schema():
    """CUSTOM：按 form_schema JSON 动态收集字段。"""
    schema = (
        '[{"key":"team","label":"所在团队","type":"text","required":true},'
        '{"key":"size","label":"同行人数","type":"number","required":true}]'
    )
    start_session(
        session_id="s-custom",
        activity_id=5,
        activity_name="定制活动",
        template_type=ChatTemplateType.CUSTOM,
        form_schema=schema,
    )

    res1 = handle_message("s-custom", "研发团队")
    assert res1.collected_fields["team"] == "研发团队"
    assert res1.status == ChatSessionStatus.COLLECTING

    res2 = handle_message("s-custom", "4")
    assert res2.collected_fields["size"] == 4
    assert res2.status == ChatSessionStatus.CONFIRMING


# ================= 负例：无效输入 / 偏题 =================


def test_donation_rejects_non_numeric_amount():
    """DONATION：金额字段收到文字时提示重试，且不推进到下一字段。"""
    start_session(
        session_id="s-dn-bad",
        activity_id=6,
        activity_name="爱心捐款",
        template_type=ChatTemplateType.DONATION,
    )

    res = handle_message("s-dn-bad", "我想捐一些钱")
    assert "金额" in res.reply
    assert res.collected_fields == {}
    assert res.status == ChatSessionStatus.COLLECTING


def test_volunteer_rejects_invalid_hours():
    """VOLUNTEER：服务时长非数字时提示重试。"""
    start_session(
        session_id="s-vol-bad",
        activity_id=7,
        activity_name="公益讲解",
        template_type=ChatTemplateType.VOLUNTEER,
    )

    res = handle_message("s-vol-bad", "很久")
    assert "数字" in res.reply or "时长" in res.reply
    assert res.collected_fields == {}


def test_empty_content_is_handled_gracefully():
    """空消息有友好兜底。"""
    start_session(
        session_id="s-empty",
        activity_id=8,
        activity_name="活动",
        template_type=ChatTemplateType.DONATION,
    )
    res = handle_message("s-empty", "   ")
    assert "再发一次" in res.reply


def test_unknown_session_returns_none():
    """未知 session_id → handle_message 返回 None。"""
    assert handle_message("nonexistent", "hello") is None


def test_modify_intent_after_confirming():
    """确认阶段：用户请求修改金额，Agent 更新字段并重新展示摘要。"""
    start_session(
        session_id="s-modify",
        activity_id=9,
        activity_name="捐赠活动",
        template_type=ChatTemplateType.DONATION,
    )
    handle_message("s-modify", "100")
    handle_message("s-modify", "跳过")

    res = handle_message("s-modify", "修改金额为 300")
    assert res.collected_fields["amount"] == 300
    assert res.status == ChatSessionStatus.CONFIRMING
    assert "300" in res.reply
