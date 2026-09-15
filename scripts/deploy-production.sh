#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/VerifySertifikat}"
EXPECTED_SHA="${1:-}"
BACKUP_DIR="${BACKUP_DIR:-/root/verify-backups}"
ROLLBACK_READY=0

cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Server repository has uncommitted changes; deploy stopped."
  exit 1
fi

git fetch origin main
git merge --ff-only origin/main

CURRENT_SHA="$(git rev-parse HEAD)"
if [[ -n "$EXPECTED_SHA" && "$CURRENT_SHA" != "$EXPECTED_SHA" ]]; then
  echo "Expected $EXPECTED_SHA but checked out $CURRENT_SHA."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
printf '%s\n' "$CURRENT_SHA" > "$BACKUP_DIR/last-deployed-commit"
docker compose exec -T postgres sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"

BACKEND_IMAGE="$(docker compose images -q backend 2>/dev/null || true)"
FRONTEND_IMAGE="$(docker compose images -q frontend 2>/dev/null || true)"
if [[ -n "$BACKEND_IMAGE" && -n "$FRONTEND_IMAGE" ]]; then
  docker image tag "$BACKEND_IMAGE" verifysertifikat-backend:rollback
  docker image tag "$FRONTEND_IMAGE" verifysertifikat-frontend:rollback
  ROLLBACK_READY=1
fi

rollback() {
  status=$?
  if [[ $status -ne 0 && $ROLLBACK_READY -eq 1 ]]; then
    echo "Deploy failed; restoring the previous application images."
    docker image tag verifysertifikat-backend:rollback verifysertifikat-backend:latest
    docker image tag verifysertifikat-frontend:rollback verifysertifikat-frontend:latest
    docker compose up -d --no-build --force-recreate postgres backend frontend nginx || true
  fi
  exit "$status"
}
trap rollback EXIT

docker compose build backend frontend
docker compose run --rm backend npx prisma migrate deploy
docker compose up -d --remove-orphans postgres backend frontend nginx

for attempt in {1..30}; do
  if docker compose exec -T backend wget -qO- http://127.0.0.1:4000/health >/dev/null \
    && curl -fsS -H 'Host: career.itlive.uz' http://127.0.0.1:8085/career/candidates >/dev/null \
    && curl -fsS -H 'Host: career.itlive.uz' http://127.0.0.1:8085/api/career/v1/summary >/dev/null; then
    trap - EXIT
    echo "Deploy completed: $CURRENT_SHA"
    exit 0
  fi
  sleep 2
done

echo "Application did not pass health checks."
exit 1
