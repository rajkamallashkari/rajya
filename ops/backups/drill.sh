#!/usr/bin/env bash
# Dump the current database, restore into a scratch DB, and fail if schemas differ.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"
SCRATCH="${BACKUP_SCRATCH_DB:-rajya_scratch}"
mkdir -p "$ROOT/tmp"
WORKDIR="$(mktemp -d "$ROOT/tmp/rajya-backup-XXXXXX")"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

SOURCE_SCHEMA="${WORKDIR}/source.catalog"
SCRATCH_SCHEMA="${WORKDIR}/scratch.catalog"
export BACKUP_DIR="$WORKDIR"

"$SCRIPT_DIR/backup.sh"
NEWEST="$(ls -1t "$BACKUP_DIR"/rajya_*.dump | head -n 1)"
"$SCRIPT_DIR/restore.sh" "$NEWEST" "$SCRATCH"

scratch_url="${DATABASE_URL%/*}/${SCRATCH}"

schema_catalog() {
  local url="$1"
  local sql="SELECT 'c:' || table_name || '.' || column_name || ':' || data_type FROM information_schema.columns WHERE table_schema = 'public' UNION ALL SELECT 'i:' || indexname FROM pg_indexes WHERE schemaname = 'public' UNION ALL SELECT 'k:' || conname FROM pg_constraint JOIN pg_namespace ON pg_namespace.oid = pg_constraint.connamespace WHERE nspname = 'public' UNION ALL SELECT 'e:' || extname FROM pg_extension ORDER BY 1;"
  if pg_native_ok psql; then
    psql "$url" -Atq -c "$sql"
  else
    pg_client psql "$(pg_docker_url "$url")" -Atq -c "$sql"
  fi
}

schema_catalog "$DATABASE_URL" > "$SOURCE_SCHEMA"
schema_catalog "$scratch_url" > "$SCRATCH_SCHEMA"

if ! diff -u "$SOURCE_SCHEMA" "$SCRATCH_SCHEMA"; then
  echo "Schema mismatch after restore." >&2
  exit 1
fi

echo "Restore drill passed for $SCRATCH"
