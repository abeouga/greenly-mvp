from pathlib import Path

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    sql = (Path(__file__).resolve().parents[1] / "sql" / "V2__garden_photo.sql").read_text(encoding="utf-8-sig")
    op.execute(sql.strip().rstrip(";"))


def downgrade() -> None:
    raise RuntimeError("Dropping saved photos is disabled; restore the verified database backup.")
