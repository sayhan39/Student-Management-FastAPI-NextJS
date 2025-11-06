import os
import shutil
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, delete, select
from starlette import status

from src.models.request_response_models import AddContentRequest, AddContentResponse, ContentMetadataResponse, TextContentResponse
from src.models.db_models import ClassContent, Content, Course, CourseContent, Performance, Student, User


UPLOADS_DIR = "src/content_files"

class ContentService:
    def __init__(self):
        os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    def add_content(self, session: Session, current_user: User, title: str, author: str, 
                    file: UploadFile, class_level: Optional[str] = None, course_code: Optional[str] = None) -> AddContentResponse:        
        try:
            file_bytes = file.file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save file: {e}"
            )
        finally:
            file.file.close()
        
        new_content = Content(
            title = title,
            file_type = file.content_type,
            author = author,
            file_data = file_bytes,
            created_by = "raihan",
            updated_by = "raihan",
            status = "A"
        )
        
        session.add(new_content)
        session.commit()
        session.refresh(new_content)
        
        class_link_obj = None
        course_link_obj = None
        
        if class_level:
            class_link_obj = ClassContent(
                class_level=class_level,
                content_id=new_content.id
            )
            session.add(class_link_obj)
        
        if course_code:
            course_link_obj = CourseContent(
                course_code=course_code,
                content_id=new_content.id
            )
            session.add(course_link_obj)
        
        if class_link_obj or course_link_obj:
            session.commit()
            if class_link_obj:
                session.refresh(class_link_obj)
            if course_link_obj:
                session.refresh(course_link_obj)

        content_metadata = ContentMetadataResponse(
            id=new_content.id,
            title=new_content.title,
            file_type=new_content.file_type,
            author=new_content.author,
            created_at=new_content.created_at,
            created_by=new_content.created_by
        )

        return AddContentResponse(
            content = content_metadata,
            class_link = class_link_obj,
            course_link = course_link_obj
        )

    def get_content_by_id(self, session: Session, content_id: int) -> Content:
        statement = select(Content).where(Content.id == content_id)
        content = session.exec(statement).first()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found."
            )
        return content

    @staticmethod
    def create_content_links(
        session: Session,
        content_id: int,
        class_levels: Optional[list[str]],
        course_codes: Optional[list[str]],
    ) -> tuple[Optional[list[str]], Optional[list[str]]]:
        class_link_objs = []
        if class_levels:
            for class_level in class_levels:
                class_link_obj = ClassContent(
                    class_level=class_level, content_id=content_id
                )
                session.add(class_link_obj)
                class_link_objs.append(class_link_obj)

        course_link_objs = []
        if course_codes:
            for course_code in course_codes:
                course_link_obj = CourseContent(
                    course_code=course_code, content_id=content_id
                )
                session.add(course_link_obj)
                course_link_objs.append(course_link_obj)

        return [class_link.class_level for class_link in class_link_objs], [course_link.course_code for course_link in course_link_objs]

    @staticmethod
    def add_text_content(
        session: Session, request: AddContentRequest, username: str
    ) -> AddContentResponse:
        if not request.text_content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="text_content field is required for this endpoint",
            )

        try:
            text_bytes = request.text_content.encode("utf-8")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Error encoding text: {e}",
            )

        new_content = Content(
            title=request.title,
            file_data=text_bytes,
            file_type="text/plain",
            author=username,
            created_by=username,
            updated_by=username,
        )

        session.add(new_content)
        session.flush()

        content_metadata = ContentMetadataResponse(
            id=new_content.id,
            title=new_content.title,
            file_type=new_content.file_type,
            author=new_content.author,
            created_at=new_content.created_at,
            created_by=new_content.created_by,
            message="Content created successfully"
        )
        
        class_levels, course_codes = content_service.create_content_links(
            session=session,
            content_id=new_content.id,
            class_levels=request.class_levels,
            course_codes=request.course_codes,
        )

        session.commit()

        return AddContentResponse(
            content=content_metadata,
            class_levels=class_levels,
            course_codes=course_codes,
            message="Content created and linked successfully"
        )

    @staticmethod
    def get_all_content_metadata(session: Session) -> list[ContentMetadataResponse]:

        statement = select(
            Content.id,
            Content.title,
            Content.file_type,
            Content.author,
            Content.created_at,
            Content.created_by,
        )
        results = session.exec(statement).all()

        return [
            ContentMetadataResponse(
                id=c.id,
                title=c.title,
                file_type=c.file_type,
                author=c.author,
                created_at=c.created_at,
                created_by=c.created_by,
            )
            for c in results
        ]

    @staticmethod
    def update_class_and_course_constraints(
        session: Session,
        current_content_id: int,
        class_levels: Optional[list[str]],
        course_codes: Optional[list[str]]
    ):
        course_delete_statement = delete(CourseContent).where(CourseContent.content_id == current_content_id)
        session.exec(course_delete_statement)

        class_delete_statement = delete(ClassContent).where(ClassContent.content_id == current_content_id)
        session.exec(class_delete_statement)

        for course_code in course_codes:
            session.add(CourseContent(course_code=course_code, content_id=current_content_id))

        for class_level in class_levels:
            session.add(ClassContent(class_level=class_level, content_id=current_content_id))
        session.commit()

    @staticmethod
    def get_class_and_course_constraints(session: Session, current_content_id: int):
        class_statement = select(ClassContent.class_level).where(ClassContent.content_id == current_content_id)
        class_levels = session.exec(class_statement).all()
        course_statement = select(CourseContent.course_code).where(CourseContent.content_id == current_content_id)
        course_codes = session.exec(course_statement).all()
        return class_levels, course_codes

    @staticmethod
    def update_text_content(
        session: Session,
        content_id: int,
        request: AddContentRequest,
        username: str,
    ) -> AddContentResponse:
        content = session.get(Content, content_id)
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
            )

        if content.file_type != "text/plain":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only simple text content can be updated via this endpoint.",
            )

        if request.text_content is None:
             raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="text_content field is required for update",
            )

        try:
            text_bytes = request.text_content.encode("utf-8")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Error encoding text: {e}",
            )

        content.title = request.title
        content.file_data = text_bytes
        content.updated_by = username

        session.add(content)
        session.commit()
        session.refresh(content)
        
        content_service.update_class_and_course_constraints(session, content.id, request.class_levels, request.course_codes)
        class_levels, course_codes = content_service.get_class_and_course_constraints(session, content.id)

        return AddContentResponse(
            content=ContentMetadataResponse(
                id=content.id,
                title=content.title,
                file_type=content.file_type,
                author=content.author,
                created_at=content.created_at,
                created_by=content.created_by,
                message="Content updated successfully"
            ),
            class_levels=class_levels,
            course_codes=course_codes
        )

    @staticmethod
    def get_text_content_by_id(session: Session, content_id: int) -> TextContentResponse:
        content = session.get(Content, content_id)
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
            )

        if content.file_type != "text/plain" or not content.file_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This content item is not simple text or is empty.",
            )

        try:
            text_content = content.file_data.decode("utf-8")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error decoding text: {e}",
            )
        
        class_levels, course_codes = content_service.get_class_and_course_constraints(session, content.id)

        return TextContentResponse(
            id=content.id,
            title=content.title,
            file_type=content.file_type,
            author=content.author,
            created_at=content.created_at,
            created_by=content.created_by,
            text_content=text_content,
            class_levels=class_levels,
            course_codes=course_codes
        )

    @staticmethod
    def get_accessible_content_ids_for_student(session: Session, user_id: int) -> set:
        if not user_id:
            return set()

        student = session.exec(select(Student).filter(Student.user_id == user_id, Student.status == "A")).first()
        if not student or not student.level:
            student_level = None
        else:
            student_level = student.level

        enrolled_course_codes_query = (
            select(Course.course_code)
            .join(Performance, Performance.course_id == Course.id)
            .filter(Performance.student_id == student.id)
            .distinct()
        )
        enrolled_course_codes = session.exec(enrolled_course_codes_query).all()

        accessible_content_ids = set()

        if student_level:
            class_content_ids_query = (
                select(ClassContent.content_id)
                .filter(ClassContent.class_level == student_level)
                .distinct()
            )
            class_content_ids = session.exec(class_content_ids_query).all()
            accessible_content_ids.update(class_content_ids)

        if enrolled_course_codes:
            course_content_ids_query = (
                select(CourseContent.content_id)
                .filter(CourseContent.course_code.in_(enrolled_course_codes))
                .distinct()
            )
            course_content_ids = session.exec(course_content_ids_query).all()
            accessible_content_ids.update(course_content_ids)

        return accessible_content_ids

    @staticmethod
    def get_content_metadata_for_user(session: Session, user: User):
        if user.role == "A":
            content_list = session.exec(statement = select(
                Content.id,
                Content.title,
                Content.file_type,
                Content.author,
                Content.created_at,
                Content.created_by,
            ).filter(Content.status == 'A')).all()

            return [
                ContentMetadataResponse(
                    id=c.id,
                    title=c.title,
                    file_type=c.file_type,
                    author=c.author,
                    created_at=c.created_at,
                    created_by=c.created_by,
                )
                for c in content_list
            ]

        elif user.role == "S":

            accessible_ids = content_service.get_accessible_content_ids_for_student(session, user.id)

            if not accessible_ids:
                return []

            content_list = session.exec(select(
                Content.id,
                Content.title,
                Content.file_type,
                Content.author,
                Content.created_at,
                Content.created_by,
            ).where(
                Content.id.in_(accessible_ids),
                Content.status == 'A'
            )).all()

            return [
                ContentMetadataResponse(
                    id=c.id,
                    title=c.title,
                    file_type=c.file_type,
                    author=c.author,
                    created_at=c.created_at,
                    created_by=c.created_by,
                )
                for c in content_list
            ]

        else:
            return []


content_service = ContentService()
