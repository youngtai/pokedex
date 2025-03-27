"""Create Pokemon cache table

Revision ID: pokemon_cache_table
Revises:
Create Date: 2023-07-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = "pokemon_cache_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create pokemon_cache table."""
    op.create_table(
        "pokemon_cache",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pokemon_id", sa.Integer(), nullable=False, index=True),
        sa.Column(
            "pokemon_name", sa.String(255), nullable=False, unique=True, index=True
        ),
        sa.Column("data", JSONB, nullable=False),
        sa.Column(
            "last_updated",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Drop pokemon_cache table."""
    op.drop_table("pokemon_cache")
