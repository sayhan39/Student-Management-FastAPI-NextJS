from sqlmodel import Session, select
from src.models.db_models import ClassLevel, Medium

class UtilService:
    
    def get_all_levels(self, session: Session) -> list[ClassLevel]:
        statement = select(ClassLevel).where(ClassLevel.status == "A")
        results = session.exec(statement).all()
        return results

    def get_all_mediums(self, session: Session) -> list[Medium]:
        statement = select(Medium).where(Medium.status == "A")
        results = session.exec(statement).all()
        return results
    
    def get_all_class_levels(self, session: Session) -> list[str]:
        statement = select(ClassLevel.value).where(ClassLevel.status == "A")
        results = session.exec(statement).all()
        return results

util_service = UtilService()
