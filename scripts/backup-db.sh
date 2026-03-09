#! /usr/bin/env sh

# Exit in case of error
set -e

# Load env file (default: .env, override with ENV_FILE variable)
ENV_FILE="${ENV_FILE:-.env}"
if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

POSTGRES_DB="${POSTGRES_DB:-app}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changethis}"
POSTGRES_SERVER="${POSTGRES_SERVER:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up database '$POSTGRES_DB' to $BACKUP_FILE..."

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_SERVER" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

echo "Backup complete: $BACKUP_FILE"
