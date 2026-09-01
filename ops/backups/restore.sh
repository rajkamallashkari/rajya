#!/usr/bin/env bash
# Restore Postgres from a custom-format dump into a scratch database.
#
# Usage:
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/rajya_production \
#     ./ops/backups/restore.sh /backups/rajya_YYYYMMDD.dump rajya_scratch
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

DUMP="${1:?dump path required}"
TARGET_DB="${2:-rajya_scratch}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

dump_dir="$(cd "$(dirname "$DUMP")" && pwd)"
dump_base="$(basename "$DUMP")"
admin_url="${DATABASE_URL%/*}/postgres"
target_url="${DATABASE_URL%/*}/${TARGET_DB}"

echo "Restoring $DUMP → $TARGET_DB"
if pg_native_ok psql && pg_native_ok pg_restore; then
  psql "$admin_url" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();" >/dev/null
  psql "$admin_url" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
  psql "$admin_url" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${TARGET_DB};"
  pg_restore --no-owner --dbname="$target_url" "$DUMP"
else
  docker_admin="$(pg_docker_url "$admin_url")"
  docker_target="$(pg_docker_url "$target_url")"
  PG_CLIENT_VOLUME="${dump_dir}:/backups" pg_client psql "$docker_admin" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();" >/dev/null
  PG_CLIENT_VOLUME="${dump_dir}:/backups" pg_client psql "$docker_admin" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
  PG_CLIENT_VOLUME="${dump_dir}:/backups" pg_client psql "$docker_admin" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${TARGET_DB};"
  PG_CLIENT_VOLUME="${dump_dir}:/backups" pg_client pg_restore --no-owner --dbname="$docker_target" "/backups/${dump_base}"
fi
echo "Done. Diff schema against production before promoting."
