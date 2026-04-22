#!/bin/sh
set -e

# Inject BACKEND_URL into nginx config at container start.
# Single-quoted variable list ensures envsubst only replaces ${BACKEND_URL}
# and leaves nginx variables like $host, $uri, $remote_addr untouched.
envsubst '${BACKEND_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
