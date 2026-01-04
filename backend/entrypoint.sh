#!/bin/sh
set -e

echo "Running entrypoint: migrations, populate_db, then start server"

# Wait for possible DB service (if using a separate DB) - simple loop with timeout
# If using sqlite this will just proceed immediately.
TRIES=0
MAX_TRIES=5
until python manage.py migrate --noinput 2>/dev/null || [ "$TRIES" -ge "$MAX_TRIES" ]; do
  TRIES=$((TRIES+1))
  echo "Waiting for DB to be ready... try $TRIES/$MAX_TRIES"
  sleep 1
done

echo "Collecting static files (if configured)"
python manage.py collectstatic --no-input || true

echo "Populating DB (manage.py populate_db)"
# If the command fails, we still want to continue to start the server.
python manage.py populate_db || echo "populate_db failed or not present"

exec "$@"
