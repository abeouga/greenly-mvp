from alembic import context
from greenly_api.models import Base

connection = context.config.attributes.get("connection")
if connection is None:
    raise RuntimeError("Use python -m greenly_api migrate: schema checks and backup must precede migration.")
context.configure(connection=connection, target_metadata=Base.metadata, transaction_per_migration=True)
with context.begin_transaction():
    context.run_migrations()
