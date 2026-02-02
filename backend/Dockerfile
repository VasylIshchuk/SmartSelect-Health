# syntax=docker/dockerfile:1

# Lightweight base image Python (Slim is lighter (Linux) than full but has the necessary libraries)
FROM python:3.11-slim

ENV PORT=8000

# Environment variables:
# PYTHONDONTWRITEBYTECODE - do not create .pyc files (unnecessary in the container)
# PYTHONUNBUFFERED - logs go directly to the console (crucial for Docker logs)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1


# Installing system libraries
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ libpq-dev && \
    rm -rf /var/lib/apt/lists/*


# Working Directory
WORKDIR /backend


# PIP UPDATE
RUN pip install --upgrade pip setuptools wheel

# Install Torch CPU is lighter
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Copying the dependency file and installing
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Uploading the application to Docker
COPY . .
# Create data directory explicitely
RUN mkdir -p /backend/data/knowledge_base 


# Build the index during image creation
RUN GROQ_API_KEY=build_placeholder python -m scripts.build_rag_index
# Running
CMD uvicorn main:app --host 0.0.0.0 --port $PORT