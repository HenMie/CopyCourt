import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from openai import APITimeoutError

from app.config import Settings
from app.errors import InvalidModelOutputError, MissingApiKeyError, UpstreamTimeoutError
from app.main import app, get_trial_service
from app.models import TrialRequest, TrialResponse
from app.openai_client import OpenAITrialService, trial_response_json_schema


VALID_REQUEST = {
    "original_text": "下周三下午两点，我们将在图书馆举办AI写作体验课，欢迎同学们报名参加，一起学习如何优化课程作业表达。",
    "target_platform": "campus",
    "audience": "大学生",
    "objective": "interest",
    "intensity": "balanced",
}


VALID_RESPONSE = {
    "case_summary": {
        "content_type": "校园活动通知",
        "main_intent": "邀请学生参加AI写作体验课",
        "target_reader": "对写作效率感兴趣的大学生",
    },
    "prosecution": [
        {"charge": "钩子偏弱", "evidence": "开头直接给时间地点，缺少参与理由。", "severity": 3}
    ],
    "defense": [
        {"strength": "信息完整", "reason": "时间、地点、主题和报名意图都清楚。"}
    ],
    "jury": [
        {"role": "普通用户", "reaction": "知道有活动，但不确定值不值得去。", "suggestion": "补充能获得什么。"},
        {"role": "平台运营", "reaction": "适合公告栏，但互动感不足。", "suggestion": "加一句报名行动。"},
        {"role": "AI味检测官", "reaction": "表达朴素，不油腻。", "suggestion": "避免过度包装。"},
        {"role": "挑剔用户", "reaction": "主题有用，但卖点太泛。", "suggestion": "讲清适合哪些作业场景。"},
        {"role": "品牌/组织方", "reaction": "风险低，调性稳。", "suggestion": "保留正式可信感。"},
    ],
    "verdict": {
        "main_problem": "价值感没有先于活动信息出现。",
        "rewrite_strategy": "先说明收获，再交代时间地点和报名。",
    },
    "rewritten_copy": {
        "title": "把课程作业写得更清楚：AI写作体验课来了",
        "body": "下周三下午两点，图书馆将举办AI写作体验课。你会现场学习如何梳理观点、优化表达，并把普通课程作业改得更清楚、更有说服力。",
        "cta": "欢迎感兴趣的同学报名参加。",
    },
    "review_scores": {
        "original": {
            "clarity": 6,
            "appeal": 6,
            "authenticity": 8,
            "platform_fit": 6,
            "risk_control": 8,
        },
        "revised": {
            "clarity": 8,
            "appeal": 8,
            "authenticity": 9,
            "platform_fit": 8,
            "risk_control": 9,
        },
    },
}


class StubService:
    async def create_trial(self, _payload: TrialRequest) -> TrialResponse:
        return TrialResponse.model_validate(VALID_RESPONSE)

    async def stream_trial_events(self, _payload: TrialRequest):
        yield {"event": "status", "data": {"status": "started"}}
        yield {"event": "delta", "data": {"text": json.dumps(VALID_RESPONSE, ensure_ascii=False)}}
        yield {"event": "complete", "data": {"result": VALID_RESPONSE}}


class ErrorService:
    def __init__(self, error):
        self.error = error

    async def create_trial(self, _payload: TrialRequest) -> TrialResponse:
        raise self.error

    async def stream_trial_events(self, _payload: TrialRequest):
        if False:
            yield {}
        raise self.error


def client_with_service(service) -> TestClient:
    app.dependency_overrides[get_trial_service] = lambda: service
    return TestClient(app)


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_health_check() -> None:
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "copycourt-app"}


@pytest.mark.parametrize(
    "patch",
    [
        {"original_text": "太短"},
        {"original_text": "x" * 3001},
        {"target_platform": "unknown"},
        {"intensity": "wild"},
    ],
)
def test_request_validation_rejects_bad_input(patch) -> None:
    payload = {**VALID_REQUEST, **patch}
    response = TestClient(app).post("/api/trials", json=payload)

    assert response.status_code == 422


def test_trials_endpoint_returns_structured_result() -> None:
    response = client_with_service(StubService()).post("/api/trials", json=VALID_REQUEST)

    assert response.status_code == 200
    body = response.json()
    assert body["jury"][2]["role"] == "AI味检测官"
    assert body["rewritten_copy"]["title"].startswith("把课程作业")
    assert body["review_scores"]["revised"]["clarity"] > body["review_scores"]["original"]["clarity"]


def test_stream_trials_endpoint_returns_sse_events() -> None:
    response = client_with_service(StubService()).post("/api/trials/stream", json=VALID_REQUEST)

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    assert "event: status" in response.text
    assert "event: delta" in response.text
    assert "event: complete" in response.text
    assert "用" in response.text


def test_stream_trials_endpoint_returns_error_event() -> None:
    response = client_with_service(ErrorService(MissingApiKeyError())).post("/api/trials/stream", json=VALID_REQUEST)

    assert response.status_code == 200
    assert "event: error" in response.text
    assert "missing_api_key" in response.text


def test_frontend_origins_are_parsed_from_settings() -> None:
    settings = Settings(FRONTEND_ORIGINS="http://localhost:3000, http://127.0.0.1:3000")

    assert settings.frontend_origin_list == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def test_missing_api_key_returns_readable_error() -> None:
    response = client_with_service(ErrorService(MissingApiKeyError())).post("/api/trials", json=VALID_REQUEST)

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "missing_api_key"


def test_invalid_model_output_returns_readable_error() -> None:
    response = client_with_service(ErrorService(InvalidModelOutputError())).post("/api/trials", json=VALID_REQUEST)

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "invalid_model_output"


class FakeResponses:
    def __init__(self, response=None, error=None) -> None:
        self.response = response
        self.error = error
        self.calls = []

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.response


class FakeOpenAIClient:
    def __init__(self, response=None, error=None) -> None:
        self.responses = FakeResponses(response=response, error=error)


async def test_openai_service_sends_json_schema_and_parses_result() -> None:
    fake_client = FakeOpenAIClient(response=SimpleNamespace(output_text=json.dumps(VALID_RESPONSE)))
    service = OpenAITrialService(
        settings=Settings(OPENAI_API_KEY="test-key", OPENAI_MODEL="gpt-test"),
        api_client=fake_client,
    )

    result = await service.create_trial(TrialRequest.model_validate(VALID_REQUEST))

    assert result.review_scores.revised.clarity == 8
    assert result.review_scores.original.clarity == 6
    call = fake_client.responses.calls[0]
    assert call["model"] == "gpt-test"
    assert call["text"]["format"]["type"] == "json_schema"
    assert call["text"]["format"]["strict"] is True
    assert call["text"]["format"]["schema"] == trial_response_json_schema()


async def test_openai_service_maps_timeout() -> None:
    fake_client = FakeOpenAIClient(error=APITimeoutError(request=None))
    service = OpenAITrialService(
        settings=Settings(OPENAI_API_KEY="test-key"),
        api_client=fake_client,
    )

    with pytest.raises(UpstreamTimeoutError):
        await service.create_trial(TrialRequest.model_validate(VALID_REQUEST))
