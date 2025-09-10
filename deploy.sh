#!/bin/bash

# Deployment script for remote server with Docker Compose
# Usage: ./deploy.sh <branch_name> <image_url>

set -e

BRANCH_NAME=$1
IMAGE_URL=$2
COMPOSE_FILE="docker-compose.prod.yml"
PORT=3000

echo "============================================="
echo "Starting deployment for branch: $BRANCH_NAME"
echo "Image: $IMAGE_URL"
echo "============================================="

export IMAGE_URL=$IMAGE_URL

echo "Environment Configuration:"
echo "- Database: $POSTGRES_DB"
echo "- PostgreSQL User: $POSTGRES_USER"
echo "- Image: $IMAGE_URL"
echo "JWT_SECRET=$JWT_SECRET" > .env

# =======================
# Docker Registry Login
# =======================
echo "Logging in to GitHub Container Registry..."
echo $GITHUB_TOKEN | sudo docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull the latest image
echo "Pulling latest image..."
sudo docker pull $IMAGE_URL

# =======================
# Docker Compose Deployment
# =======================
echo "Managing services with Docker Compose..."
# Remove existing nextjs-postgres-prod container if it exists
sudo docker rm -f nextjs-postgres-prod 2>/dev/null || true

# Stop existing services
echo "Stopping existing services..."
sudo docker-compose -f $COMPOSE_FILE down || true

# Remove any orphaned containers
echo "Cleaning up orphaned containers..."
sudo docker-compose -f $COMPOSE_FILE down --remove-orphans || true

# Start services with the new image
echo "Starting services with Docker Compose..."
sudo docker-compose -f $COMPOSE_FILE up -d

# =======================
# Health Checks
# =======================
echo "Performing health checks..."

# Wait for services to start
echo "Waiting for services to start..."
sleep 20

# Check PostgreSQL health
echo "Checking PostgreSQL health..."
max_attempts=30
attempt=0
while ! sudo docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ ERROR: PostgreSQL failed to start within 60 seconds"
    sudo docker-compose -f $COMPOSE_FILE logs postgres
    exit 1
  fi
  echo "🔄 PostgreSQL not ready yet... waiting (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ PostgreSQL health check: PASSED"

# Check application health
echo "Checking application health..."
sleep 5

if curl -f http://localhost:$PORT/api/auth/session 2>/dev/null; then
  echo "✅ Application health check: PASSED"
  echo "🚀 Deployment successful! Application is running on port $PORT"
else
  echo "❌ Application health check: FAILED"
  echo "Application logs:"
  sudo docker-compose -f $COMPOSE_FILE logs web
  echo ""
  echo "PostgreSQL logs:"
  sudo docker-compose -f $COMPOSE_FILE logs postgres
fi

# Clean up old images
echo "Cleaning up old Docker images..."
sudo docker image prune -af

echo ""
echo "============================================="
echo "Deployment Summary:"
echo "- Services: Started with Docker Compose"
echo "- PostgreSQL: Running with persistent volume"
echo "- Application: Running on port $PORT"
echo "- Database: $POSTGRES_DB"
echo "- Network: app-network (bridge)"
echo "============================================="
echo ""
echo "Service Status:"
sudo docker-compose -f $COMPOSE_FILE ps
echo ""
echo "Deployment complete!"