# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --force
COPY frontend .
RUN npm run build

# Main stage
FROM python:3.11-alpine

# Install system dependencies
RUN apk add --no-cache gcc musl-dev linux-headers rust cargo

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set up backend
WORKDIR /app
COPY backend/pyproject.toml backend/poetry.lock backend/
RUN pip3 install poetry && \
    cd backend && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev

# Copy application code
COPY backend backend/
COPY --from=frontend-builder /app/frontend/build frontend/build

# Create start script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'cd backend && python3 -m app & cd /app/frontend && npm start' >> start.sh && \
    chmod +x start.sh

EXPOSE 1905

CMD ["./start.sh"] 