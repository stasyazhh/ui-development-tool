"""ProjectsManager facade combining all project-related repositories."""
from typing import Any, Dict, List, Optional

from server.projects_manager.connection import DatabaseConnection
from server.projects_manager.files import FilesRepository
from server.projects_manager.models import Project
from server.projects_manager.projects import ProjectRepository
from server.projects_manager.seed import seed_default_project
from server.projects_manager.ui_changes import UIChangesRepository
from server.projects_manager.ui_state import UIStateRepository


class ProjectsManager:
    def __init__(self, db_config: Dict[str, Any]):
        self.db = DatabaseConnection(db_config)
        self.projects = ProjectRepository(self.db)
        self.files = FilesRepository(self.db)
        self.ui_state = UIStateRepository(self.db)
        self.ui_changes = UIChangesRepository(self.db)

    def connect(self) -> None:
        self.db.connect()

    def disconnect(self) -> None:
        self.db.disconnect()

    def seed_default_project(self) -> Optional[Project]:
        return seed_default_project(self.projects, self.files)

    # Project shortcuts
    def get_all_projects(self) -> List[Project]:
        return self.projects.get_all()

    def get_project_by_id(self, project_id: int) -> Optional[Project]:
        return self.projects.get_by_id(project_id)

    def create_project(self, name: str) -> Project:
        return self.projects.create(name)

    def update_project(self, project_id: int, new_name: str) -> Optional[Project]:
        return self.projects.update(project_id, new_name)

    def delete_project(self, project_id: int) -> bool:
        return self.projects.delete(project_id)

    def get_project_with_files(self, project_id: int) -> Optional[Dict[str, Any]]:
        project = self.projects.get_by_id(project_id)
        if project is None:
            return None
        return {**project.to_dict(), "files": self.files.get_tree(project_id)}

    # UI state shortcuts
    def get_project_ui_state(self, project_id: int) -> Optional[Any]:
        return self.ui_state.get(project_id)

    def update_project_ui_state(self, project_id: int, ui_state: Any) -> bool:
        return self.ui_state.update(project_id, ui_state)

    # UI changes shortcuts
    def record_ui_change(
        self, project_id: int, html_code: str = "", ui_state: Any = None
    ) -> Dict[str, Any]:
        return self.ui_changes.record(project_id, html_code, ui_state)

    def get_ui_changes(self, project_id: int) -> List[Dict[str, Any]]:
        return self.ui_changes.list(project_id)

    # File node shortcuts
    def get_project_files(self, project_id: int) -> List[Dict[str, Any]]:
        return self.files.get_tree(project_id)

    def create_file_node(
        self,
        project_id: int,
        name: str,
        type: str,
        parent_id: Optional[int] = None,
        modified: bool = False,
        sort_order: int = 0,
    ) -> Dict[str, Any]:
        return self.files.create(
            project_id, name, type, parent_id, modified, sort_order
        )

    def update_file_node(
        self,
        file_id: int,
        new_name: Optional[str] = None,
        modified: Optional[bool] = None,
        sort_order: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        return self.files.update(file_id, new_name, modified, sort_order)

    def delete_file_node(self, file_id: int) -> bool:
        return self.files.delete(file_id)

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
