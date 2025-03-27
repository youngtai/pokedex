import asyncio
import os
from logging.config import fileConfig

from alembic import context
from backend.db.models.pokemon_cache import Base
from sqlalchemy.ext.asyncio import create_async_engine

config = context.config

if "DATABASE_URL" in os.environ:
    config.set_main_option(
        "sqlalchemy.url",
        os.environ["DATABASE_URL"],
    )

fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    config_section = config.get_section(config.config_ini_section)
    url = config_section.get("sqlalchemy.url")

    engine = create_async_engine(url)

    async def run_async_migrations():
        async with engine.begin() as conn:
            await conn.run_sync(do_run_migrations)

    asyncio.run(run_async_migrations())


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
