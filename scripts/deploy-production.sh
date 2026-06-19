#!/usr/bin/env bash

set -Eeuo pipefail

readonly EXPECTED_USER="deploy"
readonly MIN_FREE_KB=$((5 * 1024 * 1024))
readonly HEALTH_ATTEMPTS=60
readonly HEALTH_DELAY_SECONDS=5

operation=""
target_sha=""
backend_image=""
frontend_image=""
app_dir=""
domain=""
replacement_started=0
previous_sha=""
fallback_backend_image=""
fallback_frontend_image=""

usage() {
  cat <<'EOF'
Usage:
  deploy-production.sh \
    --operation deploy|rollback \
    --target-sha <40-character-sha> \
    --backend-image <image-ref> \
    --frontend-image <image-ref> \
    --app-dir <absolute-path> \
    --domain <hostname>
EOF
}

log() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

while (($# > 0)); do
  case "$1" in
    --operation)
      operation="${2:-}"
      shift 2
      ;;
    --target-sha)
      target_sha="${2:-}"
      shift 2
      ;;
    --backend-image)
      backend_image="${2:-}"
      shift 2
      ;;
    --frontend-image)
      frontend_image="${2:-}"
      shift 2
      ;;
    --app-dir)
      app_dir="${2:-}"
      shift 2
      ;;
    --domain)
      domain="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage >&2
      die "Unknown argument: $1"
      ;;
  esac
done

[[ "$operation" == "deploy" || "$operation" == "rollback" ]] ||
  die "Operation must be deploy or rollback"
[[ "$target_sha" =~ ^[0-9a-f]{40}$ ]] || die "Target SHA must contain 40 lowercase hexadecimal characters"
[[ "$backend_image" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || die "Invalid backend image reference"
[[ "$frontend_image" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || die "Invalid frontend image reference"
[[ "$app_dir" == /* ]] || die "Application directory must be absolute"
[[ "$domain" =~ ^[a-zA-Z0-9.-]+$ ]] || die "Invalid production domain"
[[ "$(id -un)" == "$EXPECTED_USER" ]] || die "Deployment must run as $EXPECTED_USER"

cd "$app_dir"

readonly compose_file="$app_dir/docker-compose.prod.yml"
readonly env_file="$app_dir/.env.prod"
readonly state_dir="$app_dir/.deploy"
readonly override_file="$state_dir/compose.images.yml"
readonly backups_dir="$HOME/backups"

[[ -f "$compose_file" ]] || die "Missing $compose_file"
[[ -f "$env_file" ]] || die "Missing $env_file"
[[ "$(stat -c '%a' "$env_file")" == "600" ]] || die "$env_file must have mode 600"
[[ -z "$(git status --porcelain)" ]] || die "Production Git worktree is not clean"

mkdir -p "$state_dir" "$backups_dir"
chmod 700 "$state_dir" "$backups_dir"
umask 077

exec 9>"$HOME/.woodauction-production-deploy.lock"
flock -n 9 || die "Another production deployment is already running"

base_compose() {
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

compose() {
  docker compose --env-file "$env_file" -f "$compose_file" -f "$override_file" "$@"
}

write_override() {
  local selected_backend="$1"
  local selected_frontend="$2"
  local temporary_file="$override_file.tmp"

  [[ "$selected_backend" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || die "Invalid selected backend image"
  [[ "$selected_frontend" =~ ^[a-zA-Z0-9./:@_-]+$ ]] || die "Invalid selected frontend image"

  cat > "$temporary_file" <<EOF
services:
  backend:
    image: $selected_backend
  frontend:
    image: $selected_frontend
EOF
  mv "$temporary_file" "$override_file"
  chmod 600 "$override_file"
}

service_health() {
  local service="$1"
  local container_id
  container_id="$(compose ps -q "$service")"
  [[ -n "$container_id" ]] || return 1
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id"
}

wait_for_stack() {
  local attempt
  local service
  local status
  local all_healthy

  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
    all_healthy=1
    for service in mysql-db redis-cache backend frontend; do
      status="$(service_health "$service" 2>/dev/null || true)"
      if [[ "$status" != "healthy" ]]; then
        all_healthy=0
      fi
    done

    if ((all_healthy == 1)); then
      return 0
    fi
    sleep "$HEALTH_DELAY_SECONDS"
  done
  return 1
}

retry_curl() {
  curl --fail --show-error --silent \
    --retry 6 --retry-delay 5 --retry-all-errors \
    "$@"
}

verify_runtime() {
  local failed_migrations
  local missing_shipment_deadlines

  wait_for_stack || return 1
  retry_curl http://127.0.0.1:8080/actuator/health/readiness >/dev/null || return 1
  retry_curl http://127.0.0.1:3000/ >/dev/null || return 1
  retry_curl "https://${domain}/actuator/health/readiness" >/dev/null || return 1
  retry_curl "https://${domain}/" >/dev/null || return 1

  failed_migrations="$(
    # Variables are intentionally expanded by the shell inside the MySQL container.
    # shellcheck disable=SC2016
    base_compose exec -T mysql-db sh -lc \
      'exec mysql --batch --skip-column-names -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0;"' \
      2>/dev/null
  )"
  [[ "$failed_migrations" == "0" ]] || return 1

  missing_shipment_deadlines="$(
    # Variables are intentionally expanded by the shell inside the MySQL container.
    # shellcheck disable=SC2016
    base_compose exec -T mysql-db sh -lc \
      'exec mysql --batch --skip-column-names -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM order_fulfillments f JOIN orders o ON o.id = f.order_id WHERE f.status = '\''PENDING_SHIPMENT'\'' AND o.status = '\''PAID'\'' AND f.shipment_deadline IS NULL;"' \
      2>/dev/null
  )"
  [[ "$missing_shipment_deadlines" == "0" ]]
}

print_diagnostics() {
  log "Container status:"
  compose ps || true
  log "Backend logs:"
  compose logs --tail=200 --no-color backend || true
  log "Frontend logs:"
  compose logs --tail=200 --no-color frontend || true
}

rollback_application() {
  log "Rolling application containers back to $previous_sha"
  write_override "$fallback_backend_image" "$fallback_frontend_image"
  compose up -d --no-build backend frontend

  if verify_runtime; then
    printf '%s\n' "$previous_sha" > "$state_dir/running-sha"
    printf '%s rollback-after-failed-deploy target=%s restored=%s\n' \
      "$(date --iso-8601=seconds)" "$target_sha" "$previous_sha" >> "$state_dir/deployment-history.log"
    log "Rollback completed successfully"
    return 0
  fi

  print_diagnostics
  log "CRITICAL: rollback did not restore a healthy stack"
  return 1
}

pull_and_verify_image() {
  local requested_image="$1"
  local local_fallback="$2"
  local selected_image="$requested_image"
  local revision

  if ! docker pull "$requested_image" >&2; then
    if [[ "$operation" == "rollback" ]] && docker image inspect "$local_fallback" >/dev/null 2>&1; then
      log "Using local fallback image $local_fallback" >&2
      selected_image="$local_fallback"
    else
      return 1
    fi
  fi

  revision="$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$selected_image" 2>/dev/null || true)"
  if [[ "$selected_image" == "$requested_image" && "$revision" != "$target_sha" ]]; then
    die "Image revision label does not match target SHA: $selected_image"
  fi

  printf '%s\n' "$selected_image"
}

log "Fetching repository state"
git fetch --quiet origin main
git cat-file -e "${target_sha}^{commit}"
git merge-base --is-ancestor "$target_sha" origin/main ||
  die "Target SHA is not part of origin/main history"

remote_main="$(git rev-parse origin/main)"
if [[ "$operation" == "deploy" && "$target_sha" != "$remote_main" ]]; then
  die "Normal deployment target is no longer the current origin/main HEAD"
fi

available_kb="$(df -Pk "$app_dir" | awk 'NR == 2 {print $4}')"
((available_kb >= MIN_FREE_KB)) || die "Less than 5 GiB of disk space is available"

previous_sha="$(cat "$state_dir/running-sha" 2>/dev/null || git rev-parse HEAD)"
[[ "$previous_sha" =~ ^[0-9a-f]{40}$ ]] || die "Invalid previously running SHA"
fallback_backend_image="woodauction-local/backend:${previous_sha}"
fallback_frontend_image="woodauction-local/frontend:${previous_sha}"

backend_container="$(base_compose ps -q backend)"
frontend_container="$(base_compose ps -q frontend)"
[[ -n "$backend_container" && -n "$frontend_container" ]] || die "Current application containers are not running"
docker tag "$(docker inspect --format '{{.Image}}' "$backend_container")" "$fallback_backend_image"
docker tag "$(docker inspect --format '{{.Image}}' "$frontend_container")" "$fallback_frontend_image"

log "Pulling target images before changing production"
selected_backend_image="$(pull_and_verify_image "$backend_image" "woodauction-local/backend:${target_sha}")" ||
  die "Unable to pull or locate backend image"
selected_frontend_image="$(pull_and_verify_image "$frontend_image" "woodauction-local/frontend:${target_sha}")" ||
  die "Unable to pull or locate frontend image"

if [[ "$operation" == "deploy" ]]; then
  active_auctions="$(
    # Variables are intentionally expanded by the shell inside the MySQL container.
    # shellcheck disable=SC2016
    base_compose exec -T mysql-db sh -lc \
      'exec mysql --batch --skip-column-names -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM auction_sessions WHERE status = 0x414354495645;"' \
      2>/dev/null
  )"
  [[ "$active_auctions" == "0" ]] ||
    die "Deployment is blocked while $active_auctions auction session(s) are ACTIVE"

  backup_file="$backups_dir/ci-woodauction-$(date +%F-%H%M%S)-${target_sha:0:12}.sql.gz"
  log "Creating MySQL backup at $backup_file"
  # Variables are intentionally expanded by the shell inside the MySQL container.
  # shellcheck disable=SC2016
  base_compose exec -T mysql-db sh -lc \
    'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' \
    2>/dev/null | gzip -9 > "$backup_file"
  [[ -s "$backup_file" ]] || die "MySQL backup is empty"
  gzip -t "$backup_file"
  gzip -dc "$backup_file" | tail -n 20 | grep -q 'Dump completed on' ||
    die "MySQL backup completion marker was not found"
  chmod 600 "$backup_file"
fi

if [[ "$operation" == "deploy" && "$(git rev-parse HEAD)" != "$target_sha" ]]; then
  git merge --ff-only "$target_sha"
fi

write_override "$selected_backend_image" "$selected_frontend_image"
replacement_started=1

log "Updating application containers to $target_sha"
if compose up -d --no-build; then
  if verify_runtime; then
    printf '%s\n' "$previous_sha" > "$state_dir/previous-successful-sha"
    printf '%s\n' "$target_sha" > "$state_dir/running-sha"
    printf '%s\n' "$target_sha" > "$state_dir/last-successful-sha"
    printf '%s operation=%s previous=%s target=%s\n' \
      "$(date --iso-8601=seconds)" "$operation" "$previous_sha" "$target_sha" >> "$state_dir/deployment-history.log"
    find "$backups_dir" -maxdepth 1 -type f -name 'ci-woodauction-*.sql.gz' -mtime +30 -delete
    log "Production is healthy on $target_sha"
    exit 0
  fi
fi

print_diagnostics
if ((replacement_started == 1)); then
  rollback_application || exit 2
fi
exit 1
