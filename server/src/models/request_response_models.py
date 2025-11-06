
from datetime import datetime
from pydantic import BaseModel
from sqlmodel import SQLModel
from typing import Dict, List, Optional

from src.models.token import Token
from src.models.db_models import ClassContent, Content, Course, CourseContent, Performance, Student

class BaseRequestResponse(SQLModel):
    message: str = ""

class GetCoursesAndPerformanceRequest(BaseRequestResponse):
    student_id: int = -1

class GetCoursesAndPerformanceResponse(BaseRequestResponse):
    courses: List["Course"]
    performances: List["Performance"]

class DeletePerformanceRequest(BaseRequestResponse):
    student_id: int = -1
    course_id: int = -1

class DashboardRequestResponse(BaseRequestResponse):
    role: str

class AdminDashboardResponse(DashboardRequestResponse):
    students_per_class: Dict[str, int]
    students_per_course: Dict[str, int]

class StudentDashboardResponse(DashboardRequestResponse):
    student: Student
    performances: list[Performance]
    courses: List[Course]

class StudentDetailsParams(SQLModel):
    id: str = None

class StudentDeleteParams(SQLModel):
    id: str = None

class StudentUpdateResponseParams(SQLModel):
    is_updated: bool = False
    updated_student: str = None
    response_message: str = ""

class LoginResponse(BaseModel):
    token: Token
    student: Optional[Student] = None
    role: str

class AddUserRequest(BaseModel):
    username: str
    password: str
    student_id: int
    role: str
    full_name: Optional[str] = None

class GetUserByIdRequest(BaseModel):
    user_id: int

class StudentListResponse(BaseRequestResponse):
    page_count: Optional[int]
    students: Optional[list[Student]]

class StudentListDetail(BaseModel):
    id: int
    name: Optional[str] = None
    roll: Optional[int] = None
    level: Optional[str] = None
    section: Optional[str] = None
    medium: Optional[str] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    user_id: Optional[int] = None

class StudentListResponse(BaseRequestResponse):
    page_count: Optional[int]
    students: Optional[list[StudentListDetail]]

class ContentMetadataResponse(BaseRequestResponse):
    id: int
    title: Optional[str]
    file_type: Optional[str]
    author: Optional[str]
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None

class AddContentRequest(BaseRequestResponse):
    title: Optional[str]
    file_type: Optional[str]
    author: Optional[str]
    class_levels: Optional[list[str]]
    course_codes: Optional[list[str]]
    text_content: Optional[str] = None

class AddContentResponse(BaseRequestResponse):
    content: ContentMetadataResponse
    class_levels: Optional[list[str]]
    course_codes: Optional[list[str]]

class TextContentResponse(ContentMetadataResponse):
    text_content: str
    class_levels: Optional[list[str]]
    course_codes: Optional[list[str]]

class CourseConstraintGetRequest(BaseRequestResponse):
    content_id: Optional[int]

class ContentConstraint:
    class_levels: Optional[list[str]]
    course_codes: Optional[list[str]]

