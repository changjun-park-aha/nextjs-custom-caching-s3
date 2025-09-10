#!/bin/bash

# Deployment script for EC2
# Usage: ./deploy.sh <branch_name> <image_url>

set -e

BRANCH_NAME=$1
IMAGE_URL=$2
CONTAINER_NAME="nextjs-custom-caching-s3"
PORT=3000

echo "Starting deployment for branch: $BRANCH_NAME"
echo "Image: $IMAGE_URL"

# Log in to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo $GITHUB_TOKEN | sudo docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull the latest image
echo "Pulling latest image..."
sudo docker pull $IMAGE_URL

# Stop and remove existing container if it exists
echo "Stopping existing container..."
sudo docker stop $CONTAINER_NAME 2>/dev/null || true
sudo docker rm $CONTAINER_NAME 2>/dev/null || true

# Run the new container
echo "Starting new container..."
sudo docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://postgres:your-secure-postgres-password@localhost:5432/nextjs_prod \
  -e JWT_SECRET=your-super-secret-jwt-key-change-this-in-production \
  $IMAGE_URL

# Clean up old images
echo "Cleaning up old images..."
sudo docker image prune -af

# Health check
echo "Waiting for application to start..."
sleep 10

if curl -f http://localhost:$PORT/api/health 2>/dev/null; then
  echo "Deployment successful! Application is running on port $PORT"
else
  echo "Warning: Health check failed, but container is running"
  echo "Container logs:"
  sudo docker logs --tail 50 $CONTAINER_NAME
fi

echo "Deployment complete!"