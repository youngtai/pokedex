# web-service/Dockerfile
# Build stage for frontend
FROM node:lts-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Build stage for backend web-service
FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app/backend
COPY backend/pyproject.toml ./
COPY backend/README.md ./
COPY backend/web-service/app ./app
RUN uv pip install --system .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
CMD ["uvicorn", "app.service:app", "--host", "0.0.0.0", "--port", "8080"]

# mcp-server/Dockerfile
FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app/backend
COPY backend/pyproject.toml ./
COPY backend/README.md ./
COPY backend/mcp-server/app ./mcp-server
RUN uv pip install --system .

EXPOSE 8000
CMD ["python", "-m", "mcp-server.mcp-service"]
