# Dockerfile
# Build stage for frontend
FROM --platform=$BUILDPLATFORM node:23-alpine AS frontend-builder
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Copy pnpm-lock.yaml in addition to package.json
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

COPY frontend .
RUN pnpm run build

# Build stage for backend services
FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app

# Install PostgreSQL client libraries
RUN apk add --no-cache postgresql-libs && \
  apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev

# Copy backend code first, including setup.py
COPY backend/ ./backend/

# Install dependencies using uv
RUN uv pip install --system "asyncpg" "sqlalchemy[asyncio]" "alembic"
RUN uv pip install --system -e ./backend

# Remove build dependencies
RUN apk --purge del .build-deps

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1

CMD ["python", "-m", "backend.web_service.app.service"]
