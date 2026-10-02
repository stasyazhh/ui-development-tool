"""Base repository with shared DB helpers."""
from typing import Any, Dict

from server.projects_manager.connection import DatabaseConnection


class BaseRepository:
    def __init__(self, db: DatabaseConnection):
        self.db = db

    def _cursor(self):
        return self.db.cursor()

    def _commit(self) -> None:
        self.db.commit()

    def _rollback(self) -> None:
        self.db.rollback()
