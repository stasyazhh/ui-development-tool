import json
import psycopg2
from typing import List, Dict, Optional
from datetime import datetime


class Project:
    
    def __init__(self, id: int, name: str, created_at: datetime, updated_at: datetime):
        self.id = id
        self.name = name
        self.created_at = created_at
        self.updated_at = updated_at
    
    def __repr__(self):
        return f"Project(id={self.id}, name='{self.name}')"
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ProjectsManager:
    
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.connection = None
    
    def connect(self):
        if self.connection is None or self.connection.closed:
            self.connection = psycopg2.connect(**self.db_config)
    
    def disconnect(self):
        if self.connection and not self.connection.closed:
            self.connection.close()
    
    def _ensure_connection(self):
        if self.connection is None or self.connection.closed:
            self.connect()
    
    def get_all_projects(self) -> List[Project]:
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                SELECT id, name, created_at, updated_at 
                FROM projects 
                ORDER BY created_at DESC
            """)
            
            projects = []
            for row in cursor.fetchall():
                project = Project(
                    id=row[0],
                    name=row[1],
                    created_at=row[2],
                    updated_at=row[3]
                )
                projects.append(project)
            
            return projects
        finally:
            cursor.close()
    
    def get_project_by_id(self, project_id: int) -> Optional[Project]:
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                SELECT id, name, created_at, updated_at 
                FROM projects 
                WHERE id = %s
            """, (project_id,))
            
            row = cursor.fetchone()
            if row:
                return Project(
                    id=row[0],
                    name=row[1],
                    created_at=row[2],
                    updated_at=row[3]
                )
            return None
        finally:
            cursor.close()
    
    def create_project(self, name: str) -> Project:
        if not name or not name.strip():
            raise ValueError("Название проекта не может быть пустым")
        
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                INSERT INTO projects (name) 
                VALUES (%s) 
                RETURNING id, name, created_at, updated_at
            """, (name.strip(),))
            
            row = cursor.fetchone()
            self.connection.commit()
            
            return Project(
                id=row[0],
                name=row[1],
                created_at=row[2],
                updated_at=row[3]
            )
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def update_project(self, project_id: int, new_name: str) -> Optional[Project]:
        if not new_name or not new_name.strip():
            raise ValueError("Название проекта не может быть пустым")
        
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                UPDATE projects 
                SET name = %s 
                WHERE id = %s 
                RETURNING id, name, created_at, updated_at
            """, (new_name.strip(), project_id))
            
            row = cursor.fetchone()
            if row:
                self.connection.commit()
                return Project(
                    id=row[0],
                    name=row[1],
                    created_at=row[2],
                    updated_at=row[3]
                )
            
            self.connection.rollback()
            return None
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def get_project_ui_state(self, project_id: int) -> Optional:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                SELECT ui_state FROM projects WHERE id = %s
            """, (project_id,))
            row = cursor.fetchone()
            if row and row[0] is not None:
                return row[0]
            return None
        finally:
            cursor.close()
    
    def update_project_ui_state(self, project_id: int, ui_state) -> bool:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                UPDATE projects
                SET ui_state = %s::jsonb
                WHERE id = %s
                RETURNING id
            """, (json.dumps(ui_state), project_id))
            updated = cursor.rowcount > 0
            if updated:
                self.connection.commit()
            else:
                self.connection.rollback()
            return updated
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def delete_project(self, project_id: int) -> bool:
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                DELETE FROM projects 
                WHERE id = %s
            """, (project_id,))
            
            deleted = cursor.rowcount > 0
            self.connection.commit()
            return deleted
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def record_ui_change(self, project_id: int, html_code: str, ui_state=None) -> Dict:
        if not html_code or not html_code.strip():
            raise ValueError("HTML-код не может быть пустым")
        
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                INSERT INTO project_ui_changes (project_id, html_code, ui_state)
                VALUES (%s, %s, %s::jsonb)
                RETURNING id, project_id, html_code, ui_state, created_at
            """, (project_id, html_code.strip(), json.dumps(ui_state) if ui_state is not None else None))
            row = cursor.fetchone()
            self.connection.commit()
            return {
                'id': row[0],
                'project_id': row[1],
                'html_code': row[2],
                'ui_state': row[3],
                'created_at': row[4].isoformat(),
            }
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def get_ui_changes(self, project_id: int) -> List[Dict]:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                SELECT id, project_id, html_code, ui_state, created_at
                FROM project_ui_changes
                WHERE project_id = %s
                ORDER BY created_at DESC
            """, (project_id,))
            rows = cursor.fetchall()
            return [
                {
                    'id': row[0],
                    'project_id': row[1],
                    'html_code': row[2],
                    'ui_state': row[3],
                    'created_at': row[4].isoformat(),
                }
                for row in rows
            ]
        finally:
            cursor.close()
    
    def get_project_files(self, project_id: int) -> List[Dict]:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                SELECT id, parent_id, name, type, modified, sort_order
                FROM file_nodes
                WHERE project_id = %s
                ORDER BY sort_order ASC, id ASC
            """, (project_id,))
            rows = cursor.fetchall()
            return self._build_file_tree(rows)
        finally:
            cursor.close()
    
    def _build_file_tree(self, rows) -> List[Dict]:
        by_id: Dict[int, Dict] = {}
        roots: List[Dict] = []
        for row in rows:
            node = {
                'id': str(row[0]),
                'name': row[2],
                'type': row[3],
                'modified': row[4] or False,
                'children': [],
            }
            by_id[row[0]] = node
        for row in rows:
            node = by_id[row[0]]
            parent_id = row[1]
            if parent_id and parent_id in by_id:
                by_id[parent_id]['children'].append(node)
            else:
                roots.append(node)
        return roots
    
    def create_file_node(
        self,
        project_id: int,
        name: str,
        type: str,
        parent_id: Optional[int] = None,
        modified: bool = False,
        sort_order: int = 0,
    ) -> Dict:
        if not name or not name.strip():
            raise ValueError("Имя файла не может быть пустым")
        if type not in {'folder', 'model', 'ui', 'flow', 'test'}:
            raise ValueError(f"Недопустимый тип файла: {type}")
        
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                INSERT INTO file_nodes (project_id, parent_id, name, type, modified, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, parent_id, name, type, modified, sort_order
            """, (project_id, parent_id, name.strip(), type, modified, sort_order))
            row = cursor.fetchone()
            self.connection.commit()
            return {
                'id': str(row[0]),
                'parent_id': row[1],
                'name': row[2],
                'type': row[3],
                'modified': row[4] or False,
                'sort_order': row[5],
                'children': [],
            }
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def update_file_node(
        self,
        file_id: int,
        new_name: Optional[str] = None,
        modified: Optional[bool] = None,
        sort_order: Optional[int] = None,
    ) -> Optional[Dict]:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
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
            cursor.execute(f"""
                UPDATE file_nodes
                SET {', '.join(fields)}
                WHERE id = %s
                RETURNING id, parent_id, name, type, modified, sort_order
            """, tuple(values))
            row = cursor.fetchone()
            if row:
                self.connection.commit()
                return {
                    'id': str(row[0]),
                    'parent_id': row[1],
                    'name': row[2],
                    'type': row[3],
                    'modified': row[4] or False,
                    'sort_order': row[5],
                    'children': [],
                }
            self.connection.rollback()
            return None
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def delete_file_node(self, file_id: int) -> bool:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("""
                DELETE FROM file_nodes
                WHERE id = %s
            """, (file_id,))
            deleted = cursor.rowcount > 0
            self.connection.commit()
            return deleted
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def get_project_with_files(self, project_id: int) -> Optional[Dict]:
        project = self.get_project_by_id(project_id)
        if project is None:
            return None
        return {
            **project.to_dict(),
            'files': self.get_project_files(project_id),
        }
    
   
    def seed_default_project(self) -> Optional[Project]:
        self._ensure_connection()
        cursor = self.connection.cursor()
        try:
            cursor.execute("SELECT id FROM projects WHERE name = %s", ("EduAssistant",))
            row = cursor.fetchone()
            if row:
                return self.get_project_by_id(row[0])
            
            project = self.create_project("EduAssistant")
            default_tree = [
                ("models", "folder", [
                    ("student.model", "model", True),
                    ("curriculum.model", "model", False),
                    ("session.model", "model", False),
                ]),
                ("interfaces", "folder", [
                    ("chat-tutor.ui", "ui", False),
                    ("quiz-flow.ui", "ui", False),
                ]),
                ("tests", "folder", [
                    ("tutor-eval.test", "test", False),
                ]),
            ]
            for folder_name, folder_type, children in default_tree:
                folder = self.create_file_node(project.id, folder_name, folder_type)
                for child_name, child_type, modified in children:
                    self.create_file_node(
                        project.id,
                        child_name,
                        child_type,
                        parent_id=int(folder['id']),
                        modified=modified,
                    )
            return project
        finally:
            cursor.close()
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
