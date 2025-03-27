import datetime

from sqlalchemy import Column, DateTime, Integer, String, func
from backend.db.database import Base
from sqlalchemy.dialects.postgresql import JSONB


class PokemonCache(Base):
    """Model to store cached Pokemon data from PokeAPI."""

    __tablename__ = "pokemon_cache"

    id = Column(Integer, primary_key=True)
    pokemon_id = Column(Integer, nullable=False, index=True)
    pokemon_name = Column(String(255), nullable=False, unique=True, index=True)
    data = Column(JSONB, nullable=False)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<PokemonCache(id={self.id}, pokemon_name='{self.pokemon_name}')>"

    def is_expired(self):
        """Check if the cache entry is older than 7 days."""
        if not self.last_updated:
            return True
        expiration_time = datetime.timedelta(days=7)
        return (datetime.datetime.now() - self.last_updated) > expiration_time
