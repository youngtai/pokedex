from backend.db.database import Base


class SearchHistory(Base):
    """Model to store user search history."""

    from sqlalchemy import Column, DateTime, Integer, String, Text, func

    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True)
    query = Column(String(255), nullable=False)
    response_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    def __repr__(self):
        return f"<SearchHistory(id={self.id}, query='{self.query}')>"
