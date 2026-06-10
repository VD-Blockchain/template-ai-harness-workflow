FROM node:24-alpine
WORKDIR /app

# Install production deps first for layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# App source.
COPY src ./src

EXPOSE 8080
# busybox wget (present in alpine) backs the compose healthcheck against /health.
CMD ["node", "src/server.js"]
