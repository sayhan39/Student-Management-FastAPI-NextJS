import os
import shutil
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select
from starlette import status

from src.models.request_response_models import AddContentResponse, ContentMetadataResponse
from src.models.db_models import ClassContent, Content, CourseContent, User


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
        """
        Fetches a single Content object by its ID, including the blob.
        """
        statement = select(Content).where(Content.id == content_id)
        content = session.exec(statement).first()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found."
            )
        return content


content_service = ContentService()
