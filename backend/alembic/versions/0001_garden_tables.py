from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    sql = (Path(__file__).resolve().parents[1] / "sql" / "V1__create_garden_tables_and_seed_assets.sql") \
        .read_text(encoding="utf-8-sig")
    for statement in sql.split(";"):
        if statement.strip():
            op.execute(statement.strip())


def downgrade() -> None:
    raise RuntimeError("Automatic destructive downgrade is disabled; restore the verified database backup.")
