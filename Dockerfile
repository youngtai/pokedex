# Dockerfile
# Build stage for frontend
FROM node:lts-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Build stage for backend services
FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app

# Install dependencies using uv
COPY backend/pyproject.toml backend/README.md ./
RUN uv pip install --system .

# Copy application code
COPY backend/ ./backend/

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1

# We now only need to run the web service, which will manage the MCP server internally
CMD ["python", "-m", "backend.web-service.app.service"]
