#!/usr/bin/env bash
# Dump Postgres (custom format), keep local copies, optionally sync to R2.
# Usage (Compose backup service or the Oracle box):
#   DATABASE_URL=postgres://… ./ops/backups/backup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

DUMP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="${DUMP_DIR}/rajya_${STAMP}.dump"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

mkdir -p "$DUMP_DIR"
echo "Dumping $DATABASE_URL → $DUMP"
if pg_native_ok pg_dump; then
  pg_dump -Fc --no-owner "$DATABASE_URL" -f "$DUMP"
else
  PG_CLIENT_VOLUME="${DUMP_DIR}:/backups" pg_client pg_dump -Fc --no-owner "$(pg_docker_url "$DATABASE_URL")" -f "/backups/$(basename "$DUMP")"
fi
test -f "$DUMP"

if command -v rclone >/dev/null 2>&1 && [[ -n "${R2_ENDPOINT:-}" ]]; then
  DEST="${R2_BACKUP_REMOTE:-r2:rajya-backups}"
  echo "Syncing dumps to $DEST"
  rclone copy "$DUMP_DIR" "$DEST" --include "rajya_*.dump"
fi

if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && [[ "$RETENTION_DAYS" -gt 0 ]]; then
  find "$DUMP_DIR" -name 'rajya_*.dump' -type f -mtime "+${RETENTION_DAYS}" -delete
fi

echo "Backup written: $DUMP"
