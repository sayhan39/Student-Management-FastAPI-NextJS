import os
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import Session

from src.service.content_service import content_service
from src.models.db_models import User
from src.db_init import get_session
from src.models.request_response_models import AddContentResponse
from src.utils.base_utils import Role
from src.utils.user_utils import role_checker
from src.routes.base_routes import get_router


router: APIRouter = get_router()
admin_dependency = Depends(role_checker([Role.ADMIN]))

@router.post("/upload-content/", response_model=AddContentResponse)
def upload_content(*, session: Session = Depends(get_session), current_user = Annotated[User, admin_dependency],
    title: Annotated[str, Form()],
    author: Annotated[str, Form()],
    class_level: Annotated[Optional[str], Form()] = None,
    course_code: Annotated[Optional[str], Form()] = None,
    file: Annotated[UploadFile, File()]
):
    return content_service.add_content(
        session=session,
        current_user=current_user,
        title=title,
        author=author,
        file=file,
        class_level=class_level,
        course_code=course_code
    )

@router.get("/content/{content_id}")
def download_content(*, session: Session = Depends(get_session), current_user = Annotated[User, admin_dependency], content_id: int
):

    content = content_service.get_content_by_id(session, content_id)

    return Response(content=content.file_data, media_type=content.file_type)