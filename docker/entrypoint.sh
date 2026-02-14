#!/bin/sh
set -eu

mkdir -p /data

# Keep SQLite database on a persistent mounted volume.
if [ ! -f /data/dev.db ]; then
  touch /data/dev.db
fi

ln -sf /data/dev.db /app/dev.db

# Non-destructive schema sync at startup.
npx prisma db push --skip-generate

exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
