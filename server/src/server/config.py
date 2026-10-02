"""Application configuration loaded from environment variables."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "ui_projects_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
}

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://opencode.ai/zen/go/v1")
AI_MODEL = os.getenv("AI_MODEL", "kimi-k2.7-code")
AI_API_KEY = os.getenv("AI_API_KEY")

SCHEMA_PATH = Path(__file__).parent / "projects_manager" / "schema.sql"
