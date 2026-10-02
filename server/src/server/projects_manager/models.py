"""Data models for the projects manager."""
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass
class Project:
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    def __repr__(self) -> str:
        return f"Project(id={self.id}, name='{self.name}')"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
