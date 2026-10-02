"""Default project seeding."""
from typing import Optional

from server.projects_manager.models import Project
from server.projects_manager.projects import ProjectRepository
from server.projects_manager.files import FilesRepository


DEFAULT_TREE = [
    (
        "models",
        "folder",
        [
            ("student.model", "model", True),
            ("curriculum.model", "model", False),
            ("session.model", "model", False),
        ],
    ),
    (
        "interfaces",
        "folder",
        [
            ("chat-tutor.ui", "ui", False),
            ("quiz-flow.ui", "ui", False),
        ],
    ),
    (
        "tests",
        "folder",
        [
            ("tutor-eval.test", "test", False),
        ],
    ),
]


def seed_default_project(
    projects: ProjectRepository, files: FilesRepository
) -> Optional[Project]:
    for project in projects.get_all():
        if project.name == "EduAssistant":
            return project

    project = projects.create("EduAssistant")
    for folder_name, folder_type, children in DEFAULT_TREE:
        folder = files.create(project.id, folder_name, folder_type)
        for child_name, child_type, modified in children:
            files.create(
                project.id,
                child_name,
                child_type,
                parent_id=int(folder["id"]),
                modified=modified,
            )
    return project
