import json
from typing import Any, List, Optional

from sqlalchemy.orm import Mapped
from sqlmodel import BLOB, Column, Field, Relationship, SQLModel

from src.models.audit_model import AuditModel
from src.models.user import UserBase
from src.models.course import CourseBase
from src.models.student import StudentBase

class Performance(AuditModel, table=True):
    student_id: int = Field(default = None, primary_key = True, foreign_key = "student.id")
    course_id: int = Field(default = None, primary_key = True, foreign_key = "course.id")
    attendance: float = Field(default = 0.0)
    semester: int = Field(default = 0)
    practical: int = Field(default = 0)
    in_course: int = Field(default = 0)

class Student(StudentBase, table=True):
    id: int = Field(None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="student")
    courses: Mapped[List["Course"]] = Relationship(
        back_populates="students",
        link_model=Performance
    )

    def __str__(self):
        temp_str = json.dumps(dict(self))
        return temp_str

class Course(CourseBase, table=True):
    id: Optional[int] = Field(None, primary_key=True)
    students: Mapped[List["Student"]] = Relationship(
        back_populates="courses",
        link_model=Performance
    )

class User(UserBase, table=True):
    id: int = Field(None, primary_key=True)
    student: Optional["Student"] = Relationship(back_populates="user")

    def __init__(self, **data: Any):
        super().__init__(**data)

    def __str__(self):
        return json.dumps(dict(self))

class ClassLevel(AuditModel, table=True):
    id: Optional[int] = Field(None, primary_key=True)
    name: str = Field(unique=True, index=True)
    value: str = Field(index=True)

class Medium(AuditModel, table=True):
    id: Optional[int] = Field(None, primary_key=True)
    name: str = Field(unique=True, index=True)
    value: str = Field(unique=True, index=True)

class Content(AuditModel, table=True):
    id: Optional[int] = Field(None, primary_key=True)
    title: Optional[str] = Field("<UNKNOWN>")
    file_type: Optional[str] = Field("<UNKNOWN>")
    author: Optional[str] = Field()
    file_data: bytes = Field(default=None, sa_column=Column(BLOB))

class ClassContent(SQLModel, table=True):
    class_level: Optional[str] = Field(default = None, primary_key = True, foreign_key = "classlevel.value")
    content_id: Optional[int] = Field(default = None, primary_key = True, foreign_key = "content.id")

class CourseContent(SQLModel, table=True):
    course_code: Optional[str] = Field(default = None, primary_key = True, foreign_key = "course.course_code")
    content_id: Optional[int] = Field(default = None, primary_key = True, foreign_key = "content.id")

