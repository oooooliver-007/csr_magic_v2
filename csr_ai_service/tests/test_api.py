"""API 端点集成测试"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# 在导入之前设置环境变量，避免读取 .env 文件
import os
os.environ["API_AUTH_TOKEN"] = "test-secret-token"

from main import app
from models import PosterStatus, PosterTaskResponse

client = TestClient(app)


class TestHealthCheck:
    """健康检查端点测试"""

    def test_health_returns_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestPosterGenerateAuth:
    """海报生成鉴权测试"""

    def test_generate_without_api_key_returns_401(self):
        response = client.post("/poster/generate", json={
            "task_id": "test-001",
            "activity_name": "Test Activity",
            "activity_type": "BASIC",
            "style": "minimalist",
        })
        assert response.status_code == 401

    def test_generate_with_invalid_api_key_returns_401(self):
        response = client.post(
            "/poster/generate",
            json={
                "task_id": "test-002",
                "activity_name": "Test Activity",
                "activity_type": "BASIC",
                "style": "minimalist",
            },
            headers={"X-Api-Key": "wrong-token"},
        )
        assert response.status_code == 401

    @patch("app.agents.poster_agent.run_poster_generation")
    def test_generate_with_valid_api_key_returns_200(self, mock_run):
        response = client.post(
            "/poster/generate",
            json={
                "task_id": "test-003",
                "activity_name": "Test Activity",
                "activity_type": "BASIC",
                "style": "minimalist",
            },
            headers={"X-Api-Key": "test-secret-token"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["task_id"] == "test-003"
        assert data["data"]["status"] == "PENDING"


class TestPosterStatus:
    """海报状态查询测试"""

    def test_get_nonexistent_task_returns_404(self):
        response = client.get("/poster/nonexistent-task")
        assert response.status_code == 404

    @patch("app.api.poster.get_task_status")
    def test_get_existing_task_returns_status(self, mock_get_status):
        mock_get_status.return_value = PosterTaskResponse(
            task_id="test-004",
            status=PosterStatus.COMPLETED,
            poster_url="/static/posters/test-004.png",
        )
        response = client.get("/poster/test-004")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["task_id"] == "test-004"
        assert data["data"]["status"] == "COMPLETED"


class TestPosterImage:
    """海报图片获取测试"""

    def test_get_nonexistent_image_returns_404(self):
        response = client.get("/poster/nonexistent-task/image")
        assert response.status_code == 404
