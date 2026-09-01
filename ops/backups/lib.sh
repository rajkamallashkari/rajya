# Shared Postgres 17 client helpers. Sourced by backup/restore/drill.
# Native binaries are used when they already match the server major;
# otherwise the same image as Compose postgres (pgvector/pgvector:pg17).
PG_CLIENT_IMAGE="${PG_CLIENT_IMAGE:-pgvector/pgvector:pg17}"
PG_MAJOR="${PG_MAJOR:-17}"

pg_major_of() {
  "$1" --version 2>/dev/null | grep -oE '[0-9]+' | head -n1
}

pg_native_ok() {
  command -v "$1" >/dev/null 2>&1 && [[ "$(pg_major_of "$1")" == "$PG_MAJOR" ]]
}

pg_docker_url() {
  local url="$1"
  url="${url//127.0.0.1/host.docker.internal}"
  url="${url//localhost/host.docker.internal}"
  printf '%s' "$url"
}

# Run pg_dump / psql / pg_restore. Extra docker volume: host_dir:container_dir
pg_client() {
  local bin="$1"
  shift
  if pg_native_ok "$bin"; then
    "$bin" "$@"
    return
  fi
  if ! command -v docker >/dev/null 2>&1; then
    echo "$bin must be Postgres $PG_MAJOR (server is $PG_MAJOR). Install matching client tools or Docker." >&2
    exit 1
  fi
  local url
  url="$(pg_docker_url "${DATABASE_URL:?DATABASE_URL is required}")"
  if [[ -n "${PG_CLIENT_VOLUME:-}" ]]; then
    docker run --rm \
      --entrypoint "$bin" \
      --add-host=host.docker.internal:host-gateway \
      -e DATABASE_URL="$url" \
      -v "$PG_CLIENT_VOLUME" \
      "$PG_CLIENT_IMAGE" \
      "$@"
  else
    docker run --rm \
      --entrypoint "$bin" \
      --add-host=host.docker.internal:host-gateway \
      -e DATABASE_URL="$url" \
      "$PG_CLIENT_IMAGE" \
      "$@"
  fi
}
