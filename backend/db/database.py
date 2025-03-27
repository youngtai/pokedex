import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")


DATABASE_URL = os.environ.get("DATABASE_URL")

Base = declarative_base()

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True to see SQL queries
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)

async_session_maker = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

# Maximum number of connection attempts
MAX_ATTEMPTS = 5
RETRY_DELAY = 2  # seconds


async def init_db() -> None:
    """Initialize the database connection."""
    attempts = 0
    while attempts < MAX_ATTEMPTS:
        try:
            async with engine.begin() as conn:
                logger.info("Connected to the database")
                # Uncomment the line below if you want to create all tables at startup
                # await conn.run_sync(Base.metadata.create_all)
                break
        except Exception as e:
            attempts += 1
            logger.error(f"Database connection attempt {attempts} failed: {str(e)}")
            if attempts < MAX_ATTEMPTS:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                await asyncio.sleep(RETRY_DELAY)
            else:
                logger.error(
                    "Failed to connect to the database after multiple attempts"
                )
                raise


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session context manager."""
    session = async_session_maker()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_session() -> AsyncSession:
    """Get a database session - use this as a dependency in your endpoints."""
    async with get_db_session() as session:
        return session
