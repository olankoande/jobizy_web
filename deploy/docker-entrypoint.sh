#!/bin/sh
set -e

if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL is not set."
  echo "Add it as an environment variable in Coolify: BACKEND_URL=https://your-backend-url"
  exit 1
fi

# Strip trailing slash so proxy_pass stays valid
BACKEND_URL="${BACKEND_URL%/}"
export BACKEND_URL

envsubst '${BACKEND_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
