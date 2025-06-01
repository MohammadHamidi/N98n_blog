# Stage 1 ─ build static folder
FROM node:18-alpine AS builder
WORKDIR /app

# Install minimal deps (http-server will be installed in the final image)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Prepare /app/public exactly like your dev script
RUN mkdir -p public \
 && cp -r pages/* public/ 2>/dev/null || true \
 && cp -r js public/ 2>/dev/null || true \
 && cp -r css public/ 2>/dev/null || true \
 && cp -r assets public/ 2>/dev/null || true \
 && echo '<!DOCTYPE html><html><head><title>Health</title></head><body>OK</body></html>' > public/health.html

# Stage 2 ─ lightweight runtime
FROM node:18-alpine
WORKDIR /app
RUN npm install -g http-server

# Copy only the static files
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["http-server", "public", "-p", "8080", "-c-1"]
