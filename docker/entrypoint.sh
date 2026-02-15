#!/bin/sh
set -eu

require_var() {
  name="$1"
  value="$(printenv "$name" || true)"
  if [ -z "$value" ]; then
    echo "[entrypoint] ERROR: $name is required but empty."
    exit 1
  fi
}

require_var NEXTAUTH_SECRET
require_var ENCRYPTION_KEY

if [ "${#NEXTAUTH_SECRET}" -lt 32 ]; then
  echo "[entrypoint] ERROR: NEXTAUTH_SECRET must be at least 32 characters."
  exit 1
fi

if [ "${#ENCRYPTION_KEY}" -ne 32 ]; then
  echo "[entrypoint] ERROR: ENCRYPTION_KEY must be exactly 32 characters."
  exit 1
fi

mkdir -p /data
mkdir -p /data/uploads

# Keep SQLite database on a persistent mounted volume.
if [ ! -f /data/dev.db ]; then
  touch /data/dev.db
fi

ln -sf /data/dev.db /app/dev.db

if [ ! -e /app/uploads ]; then
  ln -s /data/uploads /app/uploads
fi

# Non-destructive schema sync at startup.
echo "[entrypoint] Running prisma db push..."
npx prisma db push --skip-generate

echo "[entrypoint] Starting Next.js server on 0.0.0.0:${PORT:-3000}"
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
