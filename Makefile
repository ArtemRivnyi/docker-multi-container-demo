# Docker Multi-Container Demo Makefile
# Cross-platform compatible commands

.PHONY: help up down build test clean logs

# Default target
help:
	@echo "Available commands:"
	@echo "  make up     - Start all services in detached mode"
	@echo "  make down   - Stop and remove all containers"
	@echo "  make build  - Build or rebuild services"
	@echo "  make test   - Run basic API tests"
	@echo "  make logs   - Follow service logs"
	@echo "  make clean  - Stop and remove containers, networks, and volumes"

# Start all services
up:
	docker-compose up -d

# Stop and remove containers
down:
	docker-compose down

# Build or rebuild services
build:
	docker-compose build --no-cache

# Run basic API tests
test:
	@echo "Testing API connectivity..."
	curl -f http://localhost:3000/health || echo "❌ API is not responding"
	@echo "✅ Basic test completed"

# Follow service logs
logs:
	docker-compose logs -f

# Clean up everything
clean:
	docker-compose down -v --remove-orphans

# Restart services
restart: down up

# Show running containers
ps:
	docker-compose ps

# Check service health
health:
	docker-compose ps