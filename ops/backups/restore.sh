# Restore Postgres from an R2-synced dump into a scratch database.
# Full automation (cron → pg_dump → rclone → R2) is documented in README.
# This script is the restore half of the P0 backup DoD once dumps exist.
#
# Usage (on the Oracle box, with Compose Postgres running):
#   ./ops/backups/restore.sh /backups/rajya_YYYYMMDD.dump rajya_scratch

set -euo pipefail

DUMP="${1:?dump path required}"
TARGET_DB="${2:-rajya_scratch}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

echo "Restoring $DUMP → $TARGET_DB"
psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $TARGET_DB;"
psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $TARGET_DB;"
pg_restore -U "$POSTGRES_USER" -d "$TARGET_DB" --no-owner --role="$POSTGRES_USER" "$DUMP"
echo "Done. Diff schema against production before promoting."
