from dataclasses import dataclass


@dataclass(slots=True)
class AppError(Exception):
    code: str
    message: str
    status_code: int


class MissingApiKeyError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="missing_api_key",
            message="缺少 OPENAI_API_KEY，请在环境变量或 .env 中配置后重试。",
            status_code=500,
        )


class UpstreamTimeoutError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="openai_timeout",
            message="OpenAI 上游请求超时，请稍后重试或调大 OPENAI_TIMEOUT_SECONDS。",
            status_code=504,
        )


class UpstreamAuthError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="openai_auth_error",
            message="OpenAI API key 无效或无权限访问当前模型，请检查 OPENAI_API_KEY 和 OPENAI_MODEL。",
            status_code=502,
        )


class UpstreamRequestError(AppError):
    def __init__(self, message: str = "OpenAI 上游请求失败，请检查模型、网关和网络配置。") -> None:
        super().__init__(
            code="openai_request_error",
            message=message,
            status_code=502,
        )


class InvalidModelOutputError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="invalid_model_output",
            message="模型输出结构不合法，无法解析为文案审判庭结果。",
            status_code=502,
        )
