import os
import tempfile
from typing import Generator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _build_engine():
    db_url = settings.normalized_database_url
    is_vercel = os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_URL"))

    # If deployed on Vercel and DATABASE_URL still points to localhost, use serverless SQLite in /tmp
    if is_vercel and ("localhost" in db_url or "127.0.0.1" in db_url or not db_url):
        sqlite_path = os.path.join(tempfile.gettempdir(), "homeserve_vercel.db")
        return create_engine(
            f"sqlite:///{sqlite_path}",
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )

    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )

    # Handle cloud MySQL SSL query params (e.g. Aiven/TiDB ?ssl-mode=REQUIRED)
    connect_args = {"connect_timeout": 5}
    parsed = urlparse(db_url)
    if parsed.query:
        query_params = dict(parse_qsl(parsed.query))
        ssl_mode = query_params.pop("ssl-mode", None) or query_params.pop("ssl_mode", None)
        if ssl_mode and ssl_mode.upper() != "DISABLED":
            connect_args["ssl"] = {"check_hostname": False}
        clean_query = urlencode(query_params)
        db_url = urlunparse(parsed._replace(query=clean_query))

    try:
        candidate_engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=1800,
            pool_size=10,
            max_overflow=20,
        )
        with candidate_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return candidate_engine
    except Exception:
        # Resilient fallback to local/temp SQLite so serverless deployments never crash with 500
        sqlite_path = os.path.join(tempfile.gettempdir(), "homeserve_fallback.db")
        return create_engine(
            f"sqlite:///{sqlite_path}",
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_db_initialized = False


def ensure_database_initialized() -> None:
    global _db_initialized
    if _db_initialized:
        return
    from app.database.base import Base
    from app.database.seed import run_startup_seed

    Base.metadata.create_all(bind=engine)
    run_startup_seed()
    _db_initialized = True


def get_db() -> Generator[Session, None, None]:
    ensure_database_initialized()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
