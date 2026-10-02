"""File node tree operations."""
from typing import Any, Dict, List, Optional

from server.projects_manager.base import BaseRepository


VALID_FILE_TYPES = {"folder", "model", "ui", "flow", "test"}


class FilesRepository(BaseRepository):
    def get_tree(self, project_id: int) -> List[Dict[str, Any]]:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT id, parent_id, name, type, modified, sort_order
                FROM file_nodes
                WHERE project_id = %s
                ORDER BY sort_order ASC, id ASC
                """,
                (project_id,),
            )
            rows = cursor.fetchall()
            return self._build_tree(rows)

    def _build_tree(self, rows) -> List[Dict[str, Any]]:
        by_id: Dict[int, Dict[str, Any]] = {}
        roots: List[Dict[str, Any]] = []
        for row in rows:
            node = {
                "id": str(row[0]),
                "name": row[2],
                "type": row[3],
                "modified": row[4] or False,
                "children": [],
            }
            by_id[row[0]] = node
        for row in rows:
            node = by_id[row[0]]
            parent_id = row[1]
            if parent_id and parent_id in by_id:
                by_id[parent_id]["children"].append(node)
            else:
                roots.append(node)
        return roots

    def create(
        self,
        project_id: int,
        name: str,
        type: str,
        parent_id: Optional[int] = None,
        modified: bool = False,
        sort_order: int = 0,
    ) -> Dict[str, Any]:
        if not name or not name.strip():
            raise ValueError("Имя файла не может быть пустым")
        if type not in VALID_FILE_TYPES:
            raise ValueError(f"Недопустимый тип файла: {type}")

        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO file_nodes (project_id, parent_id, name, type, modified, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, parent_id, name, type, modified, sort_order
                    """,
                    (project_id, parent_id, name.strip(), type, modified, sort_order),
                )
                row = cursor.fetchone()
                self._commit()
                return {
                    "id": str(row[0]),
                    "parent_id": row[1],
                    "name": row[2],
                    "type": row[3],
                    "modified": row[4] or False,
                    "sort_order": row[5],
                    "children": [],
                }
            except Exception as e:
                self._rollback()
                raise e

    def update(
        self,
        file_id: int,
        new_name: Optional[str] = None,
        modified: Optional[bool] = None,
        sort_order: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        fields = []
        values = []
        if new_name is not None:
            if not new_name.strip():
                raise ValueError("Имя файла не может быть пустым")
            fields.append("name = %s")
            values.append(new_name.strip())
        if modified is not None:
            fields.append("modified = %s")
            values.append(modified)
        if sort_order is not None:
            fields.append("sort_order = %s")
            values.append(sort_order)
        if not fields:
            return None

        values.append(file_id)
        with self._cursor() as cursor:
            try:
                cursor.execute(
                    f"""
                    UPDATE file_nodes
                    SET {', '.join(fields)}
                    WHERE id = %s
                    RETURNING id, parent_id, name, type, modified, sort_order
                    """,
                    tuple(values),
                )
                row = cursor.fetchone()
                if row is None:
                    self._rollback()
                    return None
                self._commit()
                return {
                    "id": str(row[0]),
                    "parent_id": row[1],
                    "name": row[2],
                    "type": row[3],
                    "modified": row[4] or False,
                    "sort_order": row[5],
                    "children": [],
                }
            except Exception as e:
                self._rollback()
                raise e

    def delete(self, file_id: int) -> bool:
        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    DELETE FROM file_nodes
                    WHERE id = %s
                    """,
                    (file_id,),
                )
                deleted = cursor.rowcount > 0
                self._commit()
                return deleted
            except Exception as e:
                self._rollback()
                raise e
