"""PostgreSQL connection helper."""
from typing import Any, Dict

import psycopg2


class DatabaseConnection:
    """Manages a single psycopg2 connection for a database config."""

    def __init__(self, db_config: Dict[str, Any]):
        self.db_config = db_config
        self.connection = None

    def connect(self) -> None:
        if self.connection is None or self.connection.closed:
            self.connection = psycopg2.connect(**self.db_config)

    def disconnect(self) -> None:
        if self.connection and not self.connection.closed:
            self.connection.close()

    def ensure_connected(self) -> None:
        if self.connection is None or self.connection.closed:
            self.connect()

    def cursor(self):
        self.ensure_connected()
        return self.connection.cursor()

    def commit(self) -> None:
        self.connection.commit()

    def rollback(self) -> None:
        self.connection.rollback()
