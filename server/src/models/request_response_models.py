
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

'''
class Content(AuditModel, table=True):
    id: Optional[int] = Field(None, primary_key=True)
    title: Optional[str] = Field("<UNKNOWN>")
    file_type: Optional[str] = Field("<UNKNOWN>")
    author: Optional[str] = Field()
    file_path: Optional[str] = Field(nullable=False)

class ClassContent(SQLModel, table=True):
    class_level: Optional[str] = Field(default = None, primary_key = True, foreign_key = "classlevel.value")
    content_id: Optional[int] = Field(default = None, primary_key = True, foreign_key = "course.id")

class CourseContent(SQLModel, table=True):
    course_code: Optional[str] = Field(default = None, primary_key = True, foreign_key = "course.course_code")
    content_id: Optional[int] = Field(default = None, primary_key = True, foreign_key = "content.id")
'''

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
    class_level: Optional[str]
    course_code: Optional[str]

class AddContentResponse(BaseRequestResponse):
    content: ContentMetadataResponse
    class_link: Optional[ClassContent] = None
    course_link: Optional[CourseContent] = None

