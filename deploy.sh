#!/bin/bash

# Deployment script for remote server
# Usage: ./deploy.sh <branch_name> <image_url>

set -e

BRANCH_NAME=$1
IMAGE_URL=$2
CONTAINER_NAME="nextjs-custom-caching-s3"
POSTGRES_CONTAINER="nextjs-postgres-prod"
PORT=3000
POSTGRES_PORT=5432

echo "============================================="
echo "Starting deployment for branch: $BRANCH_NAME"
echo "Image: $IMAGE_URL"
echo "============================================="

# Set up environment variables for production database
export POSTGRES_DB=${POSTGRES_DB:-"nextjs_prod"}
export POSTGRES_USER=${POSTGRES_USER:-"postgres"}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"postgres"}
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

echo "Database URL: postgresql://${POSTGRES_USER}:***@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

# =======================
# PostgreSQL Setup
# =======================
echo "Setting up PostgreSQL database..."

# Stop and remove existing PostgreSQL container if it exists
echo "Stopping existing PostgreSQL container..."
sudo docker stop $POSTGRES_CONTAINER 2>/dev/null || true
sudo docker rm $POSTGRES_CONTAINER 2>/dev/null || true

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
sudo docker run -d \
  --name $POSTGRES_CONTAINER \
  --restart unless-stopped \
  -p $POSTGRES_PORT:5432 \
  -e POSTGRES_DB=$POSTGRES_DB \
  -e POSTGRES_USER=$POSTGRES_USER \
  -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  -v postgres_prod_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0
while ! sudo docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "ERROR: PostgreSQL failed to start within 30 seconds"
    sudo docker logs --tail 20 $POSTGRES_CONTAINER
    exit 1
  fi
  echo "PostgreSQL not ready yet... waiting (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "PostgreSQL is ready!"

# =======================
# Database Migration
# =======================
echo "Running database migrations..."

# Log in to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo $GITHUB_TOKEN | sudo docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull the latest image for migration
echo "Pulling latest image for database migration..."
sudo docker pull $IMAGE_URL

# Run database migrations using the application image
echo "Generating and applying database migrations..."
sudo docker run --rm \
  --network host \
  -e DATABASE_URL=$DATABASE_URL \
  -e NODE_ENV=production \
  --entrypoint sh \
  $IMAGE_URL -c "cd /app/apps/web && npm run db:generate && npm run db:push"

echo "Database migration completed!"

# =======================
# Application Deployment
# =======================
echo "Deploying application..."

# Stop and remove existing application container if it exists
echo "Stopping existing application container..."
sudo docker stop $CONTAINER_NAME 2>/dev/null || true
sudo docker rm $CONTAINER_NAME 2>/dev/null || true

# Run the new application container
echo "Starting new application container..."
sudo docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --network host \
  -p $PORT:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=$DATABASE_URL \
  -e JWT_SECRET=${JWT_SECRET:-"your-super-secret-jwt-key-change-this-in-production"} \
  $IMAGE_URL

# Clean up old images
echo "Cleaning up old Docker images..."
sudo docker image prune -af

# =======================
# Health Checks
# =======================
echo "Performing health checks..."

# Wait for application to start
echo "Waiting for application to start..."
sleep 15

# Check PostgreSQL health
if sudo docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; then
  echo "✅ PostgreSQL health check: PASSED"
else
  echo "❌ PostgreSQL health check: FAILED"
  sudo docker logs --tail 10 $POSTGRES_CONTAINER
fi

# Check application health
if curl -f http://localhost:$PORT/api/auth/session 2>/dev/null; then
  echo "✅ Application health check: PASSED"
  echo "🚀 Deployment successful! Application is running on port $PORT"
else
  echo "❌ Application health check: FAILED"
  echo "Application logs:"
  sudo docker logs --tail 50 $CONTAINER_NAME
  echo ""
  echo "PostgreSQL logs:"
  sudo docker logs --tail 20 $POSTGRES_CONTAINER
fi

echo ""
echo "============================================="
echo "Deployment Summary:"
echo "- PostgreSQL: Running on port $POSTGRES_PORT"
echo "- Application: Running on port $PORT"
echo "- Database: $POSTGRES_DB"
echo "============================================="
echo "Deployment complete!"