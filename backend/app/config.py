from functools import lru_cache
from os import getenv

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="https://api.openai.com/v1", alias="OPENAI_BASE_URL")
    openai_model: str = Field(default_factory=lambda: getenv("OPENAI_MODEL", "gpt-5.5"), alias="OPENAI_MODEL")
    openai_timeout_seconds: float = Field(default=45.0, alias="OPENAI_TIMEOUT_SECONDS")
    frontend_origins: str = Field(
        default_factory=lambda: (
            f"http://localhost:{getenv('APP_PORT', '3000')},"
            f"http://127.0.0.1:{getenv('APP_PORT', '3000')}"
        ),
        alias="FRONTEND_ORIGINS",
    )

    @property
    def frontend_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
