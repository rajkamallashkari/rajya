#!/usr/bin/env bash
# Production loop for the Compose backup service. Interval is an ops concern
# (default 24h), not an app_settings value.
set -euo pipefail

INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"
while true; do
  /ops/backups/backup.sh || echo "backup failed" >&2
  sleep "$INTERVAL"
done
