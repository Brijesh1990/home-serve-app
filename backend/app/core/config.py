import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "HomeServe API"
    ENVIRONMENT: str = os.getenv("VERCEL_ENV", os.getenv("ENVIRONMENT", "development"))
    DATABASE_URL: str = "mysql+pymysql://root:admin@localhost:3306/homeserve_db"
    SECRET_KEY: str = "homeserve-enterprise-super-secret-jwt-key-2026-production-ready"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    RAZORPAY_KEY_ID: str = "rzp_test_HomeServeKey123"
    RAZORPAY_KEY_SECRET: str = "rzp_test_HomeServeSecret456"
    RAZORPAY_WEBHOOK_SECRET: str = "whsec_HomeServeWebhook789"

    CLOUDINARY_CLOUD_NAME: str = "demo-homeserve"
    CLOUDINARY_API_KEY: str = "1234567890"
    CLOUDINARY_API_SECRET: str = "cloudinary_secret_demo"

    PLATFORM_COMMISSION_PERCENT: float = 15.0
    TAX_PERCENT: float = 18.0
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=(str(BASE_DIR / ".env"), str(BASE_DIR / ".env.production")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def normalized_database_url(self) -> str:
        url = (self.DATABASE_URL or "").strip()
        if url.startswith("mysql://"):
            url = "mysql+pymysql://" + url[len("mysql://") :]
        elif url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]
        return url

    @property
    def cors_origin_list(self) -> List[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "https://home-serve-app.vercel.app",
        ]
        for d in default_origins:
            if d not in origins:
                origins.append(d)
        return origins


settings = Settings()
