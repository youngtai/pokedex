# Build stage for frontend
FROM node:lts-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Build stage for backend
FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app/backend
COPY backend/README.md ./
COPY backend/pyproject.toml ./
COPY backend/app ./app
RUN uv pip install --system -e .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
