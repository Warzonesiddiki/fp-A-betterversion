---
name: docker-best-practices
description: Containerization best practices including multi-stage builds, layer caching, security scanning, minimal images, and production-ready Dockerfile patterns.
origin: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
---

# Docker Best Practices

## Dockerfile Optimization

### Multi-Stage Builds
Reduce final image size by using build stages:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

### Layer Caching
- Order instructions from least to most frequently changing
- Copy dependency files first, then source code

```dockerfile
# Good: Dependencies change less frequently
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Bad: Invalidates cache on any code change
COPY . .
RUN npm ci && npm run build
```

## Security Best Practices

### Run as Non-Root
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### Scan Images
```bash
docker scout cves myapp:latest
trivy image myapp:latest
```

### Minimal Base Images
```dockerfile
# Prefer Alpine for size
FROM alpine:3.19

# Or distroless for minimal attack surface
FROM gcr.io/distroless/static-debian12
```

## Production Patterns

### Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

### Signal Handling
```dockerfile
# Use exec form to get proper signal handling
CMD ["node", "server.js"]
# NOT: CMD node server.js
```

## Common Commands

```bash
# Build with no cache
docker build --no-cache .

# Interactive debugging
docker run -it --rm --entrypoint /bin/sh myapp

# View layers
docker history myapp:latest

# Prune unused resources
docker system prune -af
docker image prune -a
```

## Best Practices

1. **Use .dockerignore**: Exclude build artifacts, node_modules, git
2. **Pin versions**: Don't use `:latest` in production
3. **Multi-stage builds**: Keep production images minimal
4. **Single process per container**: Use docker-compose for multi-process apps
5. **Set explicit ports**: Use `EXPOSE` in Dockerfile, `-p` at runtime
6. **Don't leak secrets**: Use build args for build-time, secrets for runtime
