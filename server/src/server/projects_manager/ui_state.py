"""Project UI state operations."""
import json
from typing import Any, Optional

from server.projects_manager.base import BaseRepository


class UIStateRepository(BaseRepository):
    def get(self, project_id: int) -> Optional[Any]:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT ui_state
                FROM projects
                WHERE id = %s
                """,
                (project_id,),
            )
            row = cursor.fetchone()
            if row is None or row[0] is None:
                return None
            return row[0]

    def update(self, project_id: int, ui_state: Any) -> bool:
        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    UPDATE projects
                    SET ui_state = %s::jsonb
                    WHERE id = %s
                    RETURNING id
                    """,
                    (json.dumps(ui_state), project_id),
                )
                updated = cursor.rowcount > 0
                if updated:
                    self._commit()
                else:
                    self._rollback()
                return updated
            except Exception as e:
                self._rollback()
                raise e
