from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Mastercard AI Defense Lab"
    VERSION: str = "0.1.0"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "https://ai-for-defense-lab.vercel.app/lab" ]
    WS_ORIGINS: list[str] = ["http://localhost:3000", "https://ai-for-defense-lab.vercel.app/lab"]

    class Config:
        env_file = ".env"


settings = Settings()
