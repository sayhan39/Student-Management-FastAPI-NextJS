from typing import Dict
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.db_init import get_session
from src.service.util_service import util_service
from src.routes.base_routes import get_router
from src.utils.base_utils import Field

router: APIRouter = get_router()

@router.get("/get-utils")
def get_levels(*, session: Session = Depends(get_session)) -> list[list[Dict[str, str]]]:
    db_levels = util_service.get_all_levels(session)
    db_mediums = util_service.get_all_mediums(session)

    # Format the data to match the original response structure
    fields_list = [{field.name: field.value} for field in Field]
    levels_list = [{level.name: level.value} for level in db_levels]
    mediums_list = [{medium.name: medium.value} for medium in db_mediums]

    return [
        fields_list,
        levels_list,
        mediums_list,
    ]

@router.get("/get-all-classes")
def get_class_levels(*, session: Session = Depends(get_session)) -> list[str]:
    return util_service.get_all_class_levels(session)

