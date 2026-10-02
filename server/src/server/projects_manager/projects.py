"""Project CRUD operations."""
from typing import List, Optional

from server.projects_manager.base import BaseRepository
from server.projects_manager.models import Project


class ProjectRepository(BaseRepository):
    def get_all(self) -> List[Project]:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, created_at, updated_at
                FROM projects
                ORDER BY created_at DESC
                """
            )
            return [
                Project(id=row[0], name=row[1], created_at=row[2], updated_at=row[3])
                for row in cursor.fetchall()
            ]

    def get_by_id(self, project_id: int) -> Optional[Project]:
        with self._cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, created_at, updated_at
                FROM projects
                WHERE id = %s
                """,
                (project_id,),
            )
            row = cursor.fetchone()
            if row is None:
                return None
            return Project(id=row[0], name=row[1], created_at=row[2], updated_at=row[3])

    def create(self, name: str) -> Project:
        if not name or not name.strip():
            raise ValueError("Название проекта не может быть пустым")

        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO projects (name)
                    VALUES (%s)
                    RETURNING id, name, created_at, updated_at
                    """,
                    (name.strip(),),
                )
                row = cursor.fetchone()
                self._commit()
                return Project(
                    id=row[0], name=row[1], created_at=row[2], updated_at=row[3]
                )
            except Exception as e:
                self._rollback()
                raise e

    def update(self, project_id: int, new_name: str) -> Optional[Project]:
        if not new_name or not new_name.strip():
            raise ValueError("Название проекта не может быть пустым")

        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    UPDATE projects
                    SET name = %s
                    WHERE id = %s
                    RETURNING id, name, created_at, updated_at
                    """,
                    (new_name.strip(), project_id),
                )
                row = cursor.fetchone()
                if row is None:
                    self._rollback()
                    return None
                self._commit()
                return Project(
                    id=row[0], name=row[1], created_at=row[2], updated_at=row[3]
                )
            except Exception as e:
                self._rollback()
                raise e

    def delete(self, project_id: int) -> bool:
        with self._cursor() as cursor:
            try:
                cursor.execute(
                    """
                    DELETE FROM projects
                    WHERE id = %s
                    """,
                    (project_id,),
                )
                deleted = cursor.rowcount > 0
                self._commit()
                return deleted
            except Exception as e:
                self._rollback()
                raise e
