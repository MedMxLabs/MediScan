import os
from datetime import timedelta

DEV_SECRET_KEY = "dev-change-me-medscan"


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", DEV_SECRET_KEY)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES", "15")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.environ.get("JWT_REFRESH_DAYS", "7")))
    MEDSCAN_UPLOAD_FOLDER = os.environ.get(
        "MEDSCAN_UPLOAD_FOLDER", os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    )
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    REDIS_URL = os.environ.get("REDIS_URL", "")
    # Supabase Auth (primary when all three are set)
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
    SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")


def _normalize_database_url(uri: str) -> str:
    if uri.startswith("postgres://"):
        return uri.replace("postgres://", "postgresql://", 1)
    return uri


class DevelopmentConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.environ.get("DATABASE_URL", "sqlite:///medscan.db"),
    )


class ProductionConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(os.environ.get("DATABASE_URL", "sqlite:///medscan_prod.db"))


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    env = os.environ.get("FLASK_ENV", "development")
    return config_by_name.get(env, DevelopmentConfig)
