# Use node as base image for frontend build
FROM node:18.18-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install --force

# Copy frontend source code
COPY frontend/ .

# Build frontend
RUN npm run build

# Use Python for final image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry

# Copy backend pyproject.toml and poetry.lock
ADD backend/ ./backend/

# Configure poetry to create virtualenv in project directory
WORKDIR /app/backend
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --no-dev --no-interaction --no-ansi

# Copy backend source code
COPY backend/ .

# Copy built frontend from previous stage
WORKDIR /app
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=1905

# Expose frontend port
EXPOSE 1905

# Create start script
RUN echo '#!/bin/bash\n\
cd /app/backend && poetry install && poetry run start &\
cd /app/frontend && npm start' > /app/start.sh && \
chmod +x /app/start.sh

# Set working directory
WORKDIR /app

# Start both services
CMD ["/app/start.sh"] 