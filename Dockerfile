# ==========================================
# Stage 1: Build Frontend using Vite & pnpm
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Install pnpm globally
RUN npm install -g pnpm

# Copy package configuration and lockfile
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# Install dependencies and build
RUN pnpm install
COPY frontend/ ./
RUN pnpm build

# ==========================================
# Stage 2: Build Python Backend & Package app
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to leverage Docker cache
COPY backend/requirements.txt /app/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application directories
COPY backend/ /app/backend/
COPY data/ /app/data/

# Copy frontend source and the compiled production build from Stage 1
COPY frontend/ /app/frontend/
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy environment template or .env file (if present)
COPY backend/.env* /app/backend/

# Expose port 8000
EXPOSE 8000

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Run the backend
WORKDIR /app/backend
CMD ["python", "main.py"]
