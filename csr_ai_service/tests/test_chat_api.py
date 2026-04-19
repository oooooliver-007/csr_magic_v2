"""对话 API 集成测试 — 通过 FastAPI TestClient 覆盖 3 个端点。"""

import pytest
from fastapi.testclient import TestClient

from app.agents.chat_agent import reset_sessions_for_tests


@pytest.fixture()
def client():
    from main import app

    reset_sessions_for_tests()
    with TestClient(app) as c:
        yield c
    reset_sessions_for_tests()


def test_chat_start_and_message_and_complete(client):
    # /chat/start
    start_resp = client.post(
        "/chat/start",
        json={
            "session_id": "sess-1",
            "activity_id": 1,
            "activity_name": "捐款",
            "template_type": "DONATION",
        },
    )
    assert start_resp.status_code == 200
    start_body = start_resp.json()
    assert start_body["code"] == 200
    assert start_body["data"]["status"] == "COLLECTING"
    assert "捐款" in start_body["data"]["reply"]

    # /chat/message - 金额
    msg1 = client.post(
        "/chat/message",
        json={"session_id": "sess-1", "content": "500"},
    )
    assert msg1.status_code == 200
    data1 = msg1.json()["data"]
    assert data1["collected_fields"]["amount"] == 500

    # /chat/message - 跳过留言
    msg2 = client.post(
        "/chat/message",
        json={"session_id": "sess-1", "content": "跳过"},
    )
    data2 = msg2.json()["data"]
    assert data2["status"] == "CONFIRMING"
    assert data2["is_complete"] is True

    # /chat/{session_id}/complete
    complete = client.post("/chat/sess-1/complete")
    assert complete.status_code == 200
    assert complete.json()["data"]["status"] == "COMPLETED"


def test_chat_message_unknown_session_returns_404(client):
    resp = client.post(
        "/chat/message",
        json={"session_id": "nope", "content": "hi"},
    )
    assert resp.status_code == 404


def test_chat_start_conflict_returns_409(client):
    """相同 session_id 二次 start → 409，防止覆盖活跃会话。"""
    payload = {
        "session_id": "dup-sess",
        "activity_id": 9,
        "activity_name": "活动",
        "template_type": "DONATION",
    }
    first = client.post("/chat/start", json=payload)
    assert first.status_code == 200

    conflict = client.post("/chat/start", json=payload)
    assert conflict.status_code == 409


def test_chat_get_session_returns_history(client):
    client.post(
        "/chat/start",
        json={
            "session_id": "sess-hist",
            "activity_id": 11,
            "activity_name": "社区晨跑",
            "template_type": "CHECKIN",
        },
    )
    get_resp = client.get("/chat/sess-hist")
    assert get_resp.status_code == 200
    data = get_resp.json()["data"]
    assert data["session_id"] == "sess-hist"
    assert data["status"] == "CONFIRMING"
