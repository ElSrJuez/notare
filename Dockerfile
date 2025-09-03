# Build frontend
FROM node:20 AS ui-build
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json ./
# Install all deps (need devDeps for Vite build)
RUN npm ci
COPY frontend/ .
# Include shared assets referenced by frontend
COPY assets ./assets
RUN npm run build

# ---- Base image ----
FROM python:3.13-slim AS base

ENV PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# ---- Install system deps ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Python deps ----
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# ---- Copy source ----
COPY backend ./backend
COPY assets ./assets
# Copy built frontend
COPY --from=ui-build /ui/dist ./frontend/dist

# ---- Runtime ----
EXPOSE 8080
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
