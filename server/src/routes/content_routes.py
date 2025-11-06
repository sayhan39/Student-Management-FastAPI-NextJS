import os
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import Session

from src.service.content_service import content_service
from src.models.db_models import User
from src.db_init import get_session
from src.models.request_response_models import AddContentRequest, AddContentResponse, ContentConstraint, ContentMetadataResponse, TextContentResponse
from src.utils.base_utils import Role
from src.utils.user_utils import get_current_active_user, role_checker
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

@router.post("/contents/text", response_model=AddContentResponse)
def create_text_content(
    *,
    session: Session = Depends(get_session),
    request: AddContentRequest,
    current_user: Annotated[User, admin_dependency],
):
    if current_user.role != "A":
        raise HTTPException(status_code=403, detail="Not authorized to create content")
    return content_service.add_text_content(session, request, current_user.username)

@router.get("/contents/metadata", response_model=list[ContentMetadataResponse])
def get_content_list(
    *,
    session: Session = Depends(get_session),
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return content_service.get_content_metadata_for_user(session, current_user)

@router.get("/contents/text/{content_id}", response_model=TextContentResponse)
def get_text_content(
    *,
    session: Session = Depends(get_session),
    content_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return content_service.get_text_content_by_id(session, content_id)


@router.put("/contents/text/{content_id}", response_model=AddContentResponse)
def update_text_content(
    *,
    session: Session = Depends(get_session),
    content_id: int,
    request: AddContentRequest,
    current_user: Annotated[User, admin_dependency],
):
    return content_service.update_text_content(
        session, content_id, request, current_user.username
    )


