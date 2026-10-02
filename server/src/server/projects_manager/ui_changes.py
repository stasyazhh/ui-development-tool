"""UI changes history operations."""
import json
from datetime import datetime
from typing import Any, Dict, List

from server.projects_manager.base import BaseRepository


class UIChangesRepository(BaseRepository):
    def record(
        self, project_id: int, html_code: str = "", ui_state: Any = None
    ) -> Dict[str, Any]:
        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO project_ui_changes (project_id, html_code, ui_state)
                    VALUES (%s, %s, %s::jsonb)
                    RETURNING id, project_id, html_code, ui_state, created_at
                    """,
                    (
                        project_id,
                        html_code.strip() if html_code else "",
                        json.dumps(ui_state) if ui_state is not None else None,
                    ),
                )
                row = cursor.fetchone()
                self._commit()
                return {
                    "id": row[0],
                    "project_id": row[1],
                    "html_code": row[2],
                    "ui_state": row[3],
                    "created_at": row[4].isoformat(),
                }
            except Exception as e:
                self._rollback()
                raise e

    def list(self, project_id: int) -> List[Dict[str, Any]]:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT id, project_id, html_code, ui_state, created_at
                FROM project_ui_changes
                WHERE project_id = %s
                ORDER BY created_at DESC
                """,
                (project_id,),
            )
            rows = cursor.fetchall()
            return [
                {
                    "id": row[0],
                    "project_id": row[1],
                    "html_code": row[2],
                    "ui_state": row[3],
                    "created_at": row[4].isoformat(),
                }
                for row in rows
            ]
