# ---- Stage 1: build the Vite static bundle ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: serve with nginx (reverse-proxies /api/* to waitlist) ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# busybox wget (present in nginx:alpine) backs the compose healthcheck against /.
