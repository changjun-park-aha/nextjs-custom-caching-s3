# Docker Compose Deployment Guide

This document explains how to deploy the application using Docker Compose on a remote server.

## Overview

The deployment uses Docker Compose to manage both the PostgreSQL database and the Next.js application as services, providing:

- **Networked containers**: Application and database communicate via Docker network
- **Persistent data storage**: PostgreSQL data survives container restarts
- **Automated service management**: Services start/stop together
- **Health checks**: Built-in database readiness checks
- **Zero-downtime deployments**: Smooth container replacement

## Files Structure

```
├── docker-compose.prod.yml    # Production Docker Compose configuration
├── deploy.sh                  # Deployment script
├── .env.production.example    # Environment variables template
└── apps/web/
    ├── Dockerfile            # Application container definition
    └── scripts/start.sh      # Container startup script with migrations
```

## Configuration

### 1. Environment Variables

Create a `.env.production` file on the remote server:

```bash
# Database Configuration
POSTGRES_DB=nextjs_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-postgres-password

# Application Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production

# GitHub Container Registry (for deployment)
GITHUB_TOKEN=your-github-token
GITHUB_USERNAME=your-github-username
```

### 2. Docker Compose Services

#### PostgreSQL Service

- **Container**: `nextjs-postgres-prod`
- **Port**: `5432:5432`
- **Volume**: `postgres_prod_data` (persistent storage)
- **Network**: `app-network`
- **Health Check**: Built-in PostgreSQL readiness check

#### Web Application Service

- **Container**: `nextjs-custom-caching-s3`
- **Port**: `3000:3000`
- **Dependencies**: Waits for PostgreSQL to be healthy
- **Database URL**: `postgresql://postgres:password@postgres:5432/nextjs_prod`
- **Network**: `app-network`

## Deployment Process

### 1. Usage

```bash
# Make script executable
chmod +x deploy.sh

# Deploy with branch and image URL
./deploy.sh <branch_name> <docker_image_url>
```

### 2. Deployment Steps

The deployment script automatically:

1. **Environment Setup**: Configures production environment variables
2. **Registry Login**: Authenticates with GitHub Container Registry
3. **Image Pull**: Downloads the latest application image
4. **Service Management**:
   - Stops existing services (`docker-compose down`)
   - Removes orphaned containers
   - Starts services with new image (`docker-compose up -d`)
5. **Health Checks**:
   - Waits for PostgreSQL to be ready (30 attempts)
   - Checks application API endpoint
6. **Cleanup**: Removes unused Docker images
7. **Status Report**: Shows service status and deployment summary

### 3. Migration Handling

Migrations are automatically handled during container startup:

1. **Build Time**: SQL migration files are generated during Docker build
2. **Runtime**: Container startup script applies migrations before starting the app
3. **Database Connection**: Application connects to PostgreSQL via Docker network

## Network Architecture

```
┌─────────────────────────────────────────┐
│ Docker Host (Remote Server)            │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ app-network (bridge)                ││
│  │                                     ││
│  │  ┌──────────────┐  ┌──────────────┐ ││
│  │  │ postgres     │  │ web          │ ││
│  │  │ :5432        │  │ :3000        │ ││
│  │  │ (internal)   │  │ (exposed)    │ ││
│  │  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Host Network                        ││
│  │ :3000 → web:3000                    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Benefits

### 1. **Service Orchestration**

- Both services start/stop together
- Dependency management (web waits for database)
- Automatic restart policies

### 2. **Network Isolation**

- Services communicate via internal Docker network
- Database not exposed to host network
- Secure inter-service communication

### 3. **Data Persistence**

- PostgreSQL data stored in named volume
- Survives container recreation and updates
- Easy backup and restore capabilities

### 4. **Zero-Downtime Deployment**

- Graceful service replacement
- Health checks ensure readiness before traffic
- Rollback capability with previous images

## Management Commands

### Service Management

```bash
# Start services
sudo docker-compose -f docker-compose.prod.yml up -d

# Stop services
sudo docker-compose -f docker-compose.prod.yml down

# View logs
sudo docker-compose -f docker-compose.prod.yml logs
sudo docker-compose -f docker-compose.prod.yml logs postgres
sudo docker-compose -f docker-compose.prod.yml logs web

# View service status
sudo docker-compose -f docker-compose.prod.yml ps

# Scale services (if needed)
sudo docker-compose -f docker-compose.prod.yml up -d --scale web=2
```

### Database Management

```bash
# Access PostgreSQL
sudo docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nextjs_prod

# Database backup
sudo docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres nextjs_prod > backup.sql

# Database restore
cat backup.sql | sudo docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d nextjs_prod
```

## Troubleshooting

### Service Issues

- **Check logs**: `sudo docker-compose -f docker-compose.prod.yml logs <service>`
- **Restart services**: `sudo docker-compose -f docker-compose.prod.yml restart`
- **Check network**: `sudo docker network ls` and `sudo docker network inspect <network>`

### Database Connection Issues

- Verify PostgreSQL health: `sudo docker-compose -f docker-compose.prod.yml exec postgres pg_isready`
- Check environment variables in containers
- Verify network connectivity between services

### Migration Issues

- Check application startup logs for migration errors
- Verify migration files exist in container: `sudo docker-compose -f docker-compose.prod.yml exec web ls -la /app/apps/web/drizzle/`
- Manually run migrations if needed: `sudo docker-compose -f docker-compose.prod.yml exec web npx drizzle-kit migrate`

## Security Considerations

1. **Environment Variables**: Store sensitive data in `.env.production` file
2. **Network Security**: Database only accessible within Docker network
3. **Container Security**: Use non-root user in containers
4. **Image Security**: Regularly update base images and dependencies
5. **Access Control**: Limit SSH access and use proper firewall rules

This Docker Compose setup provides a robust, scalable, and maintainable deployment solution for the Next.js application with PostgreSQL database.
