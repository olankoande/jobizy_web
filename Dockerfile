FROM node:22-alpine3.21 AS build
RUN apk upgrade --no-cache
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Relative URL — nginx proxies /api/ to BACKEND_URL (no CORS, no URL baked in JS bundle)
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_GOOGLE_CLIENT_ID=365362032694-r5v94iu8d8h7vagb9ag9595c1hh4ksmn.apps.googleusercontent.com
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npx tsc -p tsconfig.app.json --pretty false && npx vite build

FROM nginx:1.28-alpine
RUN apk upgrade --no-cache
# Template processed at container start (envsubst injects BACKEND_URL)
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
