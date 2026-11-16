from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.database.base import Base
from app.database.session import ensure_database_initialized
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_database_initialized()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Enterprise-grade Home Services Booking & Dispatch SaaS API (FastAPI + SQLAlchemy 2.x + MySQL 8.0)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com|.*\.netlify\.app)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/", tags=["System"])
def root_status():
    ensure_database_initialized()
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "tagline": "Your Home, Our Responsibility.",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "tables_registered": len(Base.metadata.tables),
        "api_v1_base": "/api/v1",
        "swagger_docs": "/docs",
    }


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
def health_check():
    ensure_database_initialized()
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "tables_registered": len(Base.metadata.tables),
    }
