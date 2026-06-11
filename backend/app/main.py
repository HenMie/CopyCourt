import json
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.config import Settings, get_settings
from app.errors import AppError
from app.models import ErrorResponse, HealthResponse, TrialRequest, TrialResponse
from app.openai_client import OpenAITrialService


app = FastAPI(title="CopyCourt API", version="0.1.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def get_trial_service(settings: Settings = Depends(get_settings)) -> OpenAITrialService:
    return OpenAITrialService(settings=settings)


@app.exception_handler(AppError)
async def app_error_handler(_request, exc: AppError) -> JSONResponse:
    payload = ErrorResponse(error={"code": exc.code, "message": exc.message})
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="copycourt-app")


@app.post("/api/trials", response_model=TrialResponse)
async def create_trial(
    payload: TrialRequest,
    service: OpenAITrialService = Depends(get_trial_service),
) -> TrialResponse:
    return await service.create_trial(payload)


def format_sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/trials/stream")
async def stream_trial(
    payload: TrialRequest,
    service: OpenAITrialService = Depends(get_trial_service),
) -> StreamingResponse:
    async def event_generator() -> AsyncIterator[str]:
        try:
            async for stream_event in service.stream_trial_events(payload):
                yield format_sse(stream_event["event"], stream_event["data"])
        except AppError as exc:
            yield format_sse("error", {"error": {"code": exc.code, "message": exc.message}})
        except Exception as exc:
            import traceback
            traceback.print_exc()
            yield format_sse(
                "error",
                {
                    "error": {
                        "code": "stream_failed",
                        "message": "审判流式响应中断，请稍后重试。",
                    }
                },
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
