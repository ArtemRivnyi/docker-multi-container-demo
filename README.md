# 🐋 Docker Multi-Container Demo: Node.js + Redis

A professional multi-container Docker Compose setup demonstrating container orchestration, inter-service communication, and Redis caching in a cross-platform environment.

[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/) [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/) [![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Table of Contents

* [✨ Overview](#-overview)
* [🎯 What You'll Learn](#-what-youll-learn)
* [🚀 Quick Start](#-quick-start)
* [🏗️ Architecture & Data Flow](#%EF%B8%8F-architecture--data-flow)

* [🔧 How It Works](#-how-it-works)
  * [Docker Compose Orchestration](#docker-compose-orchestration)
  * [Service Dependencies & Health Checks](#service-dependencies--health-checks)
  * [Networking & Communication](#networking--communication)
  * [Data Persistence](#data-persistence)

* [📌 API Endpoints](#-api-endpoints)
* [🛠️ Installation & Usage](#%EF%B8%8F-installation--usage)
  * [Prerequisites](#prerequisites)
  * [Initial Setup](#initial-setup)
  * [Running the Application](#running-the-application)
  * [Using Makefile Commands](#using-makefile-commands)

* [🧪 Testing](#-testing)
* [🌐 Cross-Platform Compatibility](#-cross-platform-compatibility)
* [📊 Monitoring & Logs](#-monitoring--logs)
* [🔐 Security Best Practices](#-security-best-practices)
* [🚨 Troubleshooting](#-troubleshooting)
* [🚀 Deployment Considerations](#-deployment-considerations)
* [📄 License](#-license)
* [🧰 Maintainer](#-maintainer)

---

## ✨ Overview

This repository provides a **production-ready template** for building and running multi-service applications using **Docker Compose**. It features a modern **Node.js (Express)** API server that uses **Redis** as an in-memory data store for caching and key-value operations.

**Key Highlights:**

- 🐳 **Multi-container orchestration** with Docker Compose

- 🔄 **Service health monitoring** with automatic restart policies

- 🌐 **Cross-platform compatibility** (Linux, macOS, Windows)

- 💾 **Data persistence** with Docker volumes

- 🔒 **Security best practices** (non-root user, minimal image)

- 📊 **Comprehensive logging** and error handling

---

## 🎯 What You'll Learn

By exploring this project, you'll understand:

| Concept | Implementation in This Project |
| --- | --- |
| **Container Orchestration** | Docker Compose coordinates API and Redis services |
| **Service Discovery** | Containers communicate using service names (`redis`, `api`) |
| **Health Checks** | Ensures services are ready before accepting connections |
| **Volume Management** | Redis data persists across container restarts |
| **Network Isolation** | Services communicate via dedicated Docker bridge network |
| **Environment Configuration** | Uses `.env` file for flexible deployment |
| **Graceful Shutdowns** | Services handle SIGTERM signals properly |

---

## 🚀 Quick Start

### One-Line Start (After Prerequisites)

```bash
# Clone, configure, and launch
git clone <your-repo-url> && cd docker-multi-container-demo && \
cp .env.example .env && docker-compose up --build
```

### Test the API

```bash
# Check if API is responding
curl http://localhost:3000

# Store data in Redis
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"greeting","value":"Hello Docker!"}' \
  http://localhost:3000/set

# Retrieve data from Redis
curl http://localhost:3000/get/greeting
```

---

### File Descriptions

| File | Purpose | Key Features |
| --- | --- | --- |
| `docker-compose.yml` | Orchestrates both services | Defines networks, volumes, health checks, dependencies |
| `.env.example` | Configuration template | Documents all available environment variables |
| `.env` | Active configuration | **You create this** - actual values used by Docker Compose |
| `api/Dockerfile` | API container blueprint | Single-stage build (Node.js 18), security hardening, health checks |
| `api/server.js` | API business logic | Express routes, comprehensive error handling, request logging |
| `api/redis-client.js` | Redis abstraction | Connection pooling, robust reconnection logic with exponential backoff, event handling |
| `Makefile` | Development shortcuts | Cross-platform commands for common tasks, including `test` and `clean` |
| `check-env.sh` | System validation | Verifies Docker, Docker Compose, daemon status, and system info |

---

## 🏗️ Architecture & Data Flow

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Docker Host                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            Docker Compose (app-network)                │  │
│  │                                                        │  │
│  │  ┌─────────────────┐         ┌──────────────────┐      │  │
│  │  │   Node.js API   │◄────────┤  Redis Cache     │      │  │
│  │  │   (Express)     │  Redis  │  (In-Memory DB)  │      │  │
│  │  │   Port: 3000    │ Client  │                  │      │  │
│  │  └────────┬────────┘         └────────┬─────────┘      │  │
│  │           │                           │                │  │
│  │           │                           │                │  │
│  │    Health Check                Volume Mount            │  │
│  │    (HTTP /health)            (redis_data:/data)        │  │
│  └────────────────────────────────────────────────────────┘  │
│           │                                                  │
│      Port Mapping                                            │
│      3000:3000                                               │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │    Client     │
    │  (Your App)   │
    └───────────────┘
```

### Request Flow Example

```
1. Client → POST /set {"key":"user:1","value":"John"}
   │
   ├─→ 2. Express receives request
   │      ├─→ Validates JSON body
   │      └─→ Logs request
   │
   ├─→ 3. Redis client.set('user:1', 'John')
   │      ├─→ Sends command over TCP (app-network)
   │      └─→ Redis stores in memory
   │
   └─→ 4. Response {"status":"Key set successfully!"}

5. Container restart → Redis loads data from /data (AOF persistence)
```

---

## 🔧 How It Works

### Docker Compose Orchestration

The `docker-compose.yml` file defines two services that work together:

```yaml
services:
  api:
    build: ./api                    # Build from local Dockerfile
    depends_on:
      redis:
        condition: service_healthy  # Wait for Redis to be ready
    ports:
      - "${API_PORT}:3000"         # Expose API to host
    networks:
      - app-network                # Connect to shared network
    restart: unless-stopped        # Auto-restart on failure

  redis:
    image: "redis:7-bullseye"        # Pre-built Redis image (Debian-based)
    platform: linux/amd64      # Explicitly set architecture for Apple Silicon compatibility
    volumes:
      - redis_data:/data           # Persist data (AOF file)
    networks:
      - app-network                # Same network as API
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]  # Verify Redis is responsive
```

**Key Points:**

- **Build vs Image**: API is built from source, Redis uses official image

- **Dependency Order**: API waits for Redis health check before starting

- **Restart Policy**: `unless-stopped` ensures services auto-recover from crashes

### Service Dependencies & Health Checks

#### Why Health Checks Matter

Without health checks, Docker Compose might start the API before Redis is ready, causing connection errors. Our configuration prevents this:

**Redis Health Check:**

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]  # Returns PONG when ready
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Fail if no response in 10s
  retries: 3         # Mark unhealthy after 3 failures
  start_period: 20s  # Grace period during startup
```

**API Health Check:**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s  # Longer grace period (needs Redis + app init)
```

**Health Check Flow:**

```
1. Docker starts Redis container
2. Health check runs: redis-cli ping → PONG ✓
3. Redis marked as "healthy"
4. Docker starts API container (depends_on condition met)
5. API health check runs: curl /health → 200 OK ✓
6. Both services ready for traffic
```

### Networking & Communication

#### Docker Bridge Network

Docker Compose creates an isolated network (`app-network`) where containers can communicate using **service names as hostnames**:

```javascript
// In api/redis-client.js
const client = redis.createClient({
  socket: {
    host: 'redis',  // ← Service name from docker-compose.yml
    port: 6379
  }
});
```

**How DNS Resolution Works:**

1. API container looks up hostname `redis`

1. Docker's embedded DNS resolves `redis` → `172.18.0.3` (internal IP)

1. Connection established over private bridge network

1. **External clients cannot access Redis directly** (no port mapping)

#### Port Mapping

```yaml
ports:
  - "3000:3000"  # HOST_PORT:CONTAINER_PORT
```

- **Left side (3000)**: Port on your machine

- **Right side (3000)**: Port inside container

- Only the API is exposed to the host; Redis remains internal

### Data Persistence

#### Redis AOF (Append-Only File)

Redis is configured with `--appendonly yes` to persist data:

```yaml
  redis:
    image: "redis:7-bullseye"
    command: redis-server --appendonly yes  # Enable AOF
    platform: linux/amd64
    volumes:
      - redis_data:/data  # Mount volume to /data (AOF file)
```

**How It Works:**

1. Every write operation (SET, DEL, etc.) is logged to `appendonly.aof`

1. File is synced to disk (fsync) periodically

1. On restart, Redis replays the AOF to restore data

1. **Volume ****`redis_data`** survives container destruction

**Testing Persistence:**

```bash
# Set a key
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"persistent","value":"test"}' http://localhost:3000/set

# Stop containers
docker-compose down

# Start again (data should persist)
docker-compose up -d

# Verify data survived
curl http://localhost:3000/get/persistent  # → {"key":"persistent","value":"test"}
```

**⚠️ Volume Deletion:**

```bash
# This DELETES all Redis data permanently
docker-compose down -v  # -v flag removes volumes
```

---

## 📌 API Endpoints

| Method | Endpoint | Description | Request Body | Response Example |
| --- | --- | --- | --- | --- |
| `GET` | `/` | API information and available endpoints | - | `{"message": "Hello from Dockerized Node.js API...", "endpoints": {...}}` |
| `GET` | `/health` | Service health check (used by Docker) | - | `{"status": "OK", "timestamp": "2025-10-24T...", "service": "Node.js API"}` |
| `POST` | `/set` | Store key-value pair in Redis | `{"key": "string", "value": "string"}` | `{"status": "Key \"username\" set successfully!"}` |
| `GET` | `/get/:key` | Retrieve value by key from Redis | - | `{"key": "username", "value": "john_doe"}` or `404` if not found |

### Detailed Examples

#### 1. Store Data (POST /set)

```bash
curl -X POST http://localhost:3000/set \
  -H "Content-Type: application/json" \
  -d '{"key":"user:1001","value":"Alice"}'
```

**Success Response (200):**

```json
{
  "status": "Key \"user:1001\" set successfully!"
}
```

**Error Response (400 - Missing Key/Value):**

```json
{
  "error": "Please provide both \"key\" and \"value\" in the JSON body."
}
```

**Error Response (500 - Redis Unavailable):**

```json
{
  "error": "Failed to set key in Redis",
  "details": "Connection to Redis failed"
}
```

#### 2. Retrieve Data (GET /get/:key)

```bash
curl http://localhost:3000/get/user:1001
```

**Success Response (200):**

```json
{
  "key": "user:1001",
  "value": "Alice"
}
```

**Error Response (404 - Key Not Found):**

```json
{
  "error": "Key \"user:1001\" not found."
}
```

#### 3. Health Check (GET /health)

#### 4. Error Handling (404 Not Found)

#### 5. Global Error Handler (500 Internal Server Error)

```bash
curl http://localhost:3000/health
```

**Response (200):**

```json
{
  "status": "OK",
  "timestamp": "2025-10-24T14:30:00.123Z",
  "service": "Node.js API",
  "version": "1.0.0"
}
```

#### 4. Error Handling (404 Not Found)

If you try to access an undefined route:

```bash
curl http://localhost:3000/nonexistent/route
```

**Response (404):**

```json
{
  "error": "Endpoint not found",
  "message": "Route GET /nonexistent/route does not exist"
}
```

#### 5. Global Error Handler (500 Internal Server Error)

The API includes a global error handler for unhandled exceptions:

**Response (500):**

```json
{
  "error": "Internal server error",
  "message": "Something went wrong on our side. Please try again later."
}
```

---

## 🛠️ Installation & Usage

### Prerequisites

Before starting, ensure you have:

| Software | Minimum Version | Installation Guide |
| --- | --- | --- |
| **Docker** | 20.10+ | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 1.29+ (or Docker Desktop) | [docs.docker.com/compose/install](https://docs.docker.com/compose/install/) |
| **Git** | 2.0+ | [git-scm.com/downloads](https://git-scm.com/downloads) |
| **curl** | Any version | Pre-installed on most systems |

**Verify Installation:**

```bash
docker --version          # Should show: Docker version 24.x.x
docker-compose --version  # Should show: Docker Compose version 2.x.x
```

### Initial Setup

#### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/docker-multi-container-demo.git
cd docker-multi-container-demo
```

#### Step 2: Create Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# (Optional) Edit .env to customize ports or project name
nano .env  # or use your preferred editor
```

**Default ****`.env`**** Configuration:**

```
# API Service Configuration
API_PORT=3000

# Project Configuration
COMPOSE_PROJECT_NAME=redis-demo

# Redis Configuration
REDIS_PORT=6379

# Node.js Environment
NODE_ENV=production
```

**⚠️ Important:** Do NOT commit `.env` to version control (it's already in `.gitignore`)

#### Step 3: Verify Environment

Run the environment check script to ensure everything is ready:

```bash
# Make script executable (Linux/macOS)
chmod +x check-env.sh

# Run the check
./check-env.sh
```

**Expected Output:**

```
🔍 Docker Multi-Container Demo - Environment Check
==================================================

✅ Docker is installed: Docker version 24.0.6
✅ Docker Compose is installed: Docker Compose version v2.23.0
✅ Docker daemon is running
✅ .env file exists and is configured

💻 System Information:
   OS: Linux
   Architecture: x86_64
   Kernel: 5.15.0-91-generic

⏸️  Application containers are not running
   Run 'make up' or 'docker-compose up -d' to start

🎉 Environment check completed!
```

### Running the Application

#### Method 1: Docker Compose Commands (Recommended)

| Command | Description | When to Use |
| --- | --- | --- |
| `docker-compose up --build` | Build images and start services (foreground) | First run or after code changes |
| `docker-compose up -d` | Start services in detached mode | Production-like running |
| `docker-compose down` | Stop and remove containers | When done testing |
| `docker-compose down -v` | Stop and **delete all data** | Complete cleanup |
| `docker-compose logs -f` | Follow real-time logs | Debugging |
| `docker-compose ps` | Show container status | Health monitoring |
| `docker-compose restart` | Restart all services | After config changes |

**First-Time Startup:**

```bash
docker-compose up --build
```

**Watch the logs:** You should see:

```
redis_cache  | ✅ Ready to accept connections
node_app     | 🔗 Connecting to Redis...
node_app     | ✅ Connected to Redis successfully!
node_app     | ✅ API server is running on port 3000
```

**Stop with:** `Ctrl+C` (or `docker-compose down` if running in detached mode)

#### Method 2: Using Makefile Commands

The `Makefile` provides convenient shortcuts:

```bash
# Start services in background
make up

# View logs in real-time
make logs

# Run API tests
make test

# Stop services
make down

# Complete cleanup (removes volumes!)
make clean

# Show available commands
make help
```

**Makefile Command Reference:**

| Command | Equivalent Docker Compose Command | Description |
| --- | --- | --- |
| `make up` | `docker-compose up -d` | Start in detached mode |
| `make down` | `docker-compose down` | Stop and remove containers |
| `make build` | `docker-compose build --no-cache` | Rebuild images from scratch |
| `make test` | (custom script) | Run API connectivity tests |
| `make logs` | `docker-compose logs -f` | Follow service logs |
| `make clean` | `docker-compose down -v --remove-orphans` | Full cleanup |
| `make ps` | `docker-compose ps` | Show running containers |
| `make restart` | `docker-compose down && docker-compose up -d` | Restart services |

---

## 🧪 Testing

### Automated Tests (Makefile)

```bash
make test
```

**What It Tests:**

- ✅ API is accessible on `http://localhost:3000`

- ✅ Health endpoint returns 200 OK

- ✅ Basic HTTP connectivity

### Manual Testing Suite

#### Test 1: API Connectivity

```bash
curl http://localhost:3000
```

**Expected:**

```json
{
  "message": "Hello from Dockerized Node.js API with Redis!",
  "timestamp": "2025-10-24T14:30:00.000Z",
  "endpoints": {
    "set": "POST /set - Set key-value pair in Redis",
    "get": "GET /get/:key - Get value by key from Redis",
    "health": "GET /health - Service health check"
  }
}
```

#### Test 2: Redis Integration (Write)

```bash
curl -X POST http://localhost:3000/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test_user","value":"John Doe"}'
```

**Expected:**

```json
{
  "status": "Key \"test_user\" set successfully!"
}
```

#### Test 3: Redis Integration (Read)

```bash
curl http://localhost:3000/get/test_user
```

**Expected:**

```json
{
  "key": "test_user",
  "value": "John Doe"
}
```

#### Test 4: Error Handling (Missing Key)

```bash
curl http://localhost:3000/get/nonexistent_key
```

**Expected (404):**

```json
{
  "error": "Key \"nonexistent_key\" not found."
}
```

#### Test 5: Data Persistence

```bash
# 1. Set a key
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"persistent","value":"data"}' http://localhost:3000/set

# 2. Stop containers
docker-compose down

# 3. Restart
docker-compose up -d

# 4. Wait for services to be ready
sleep 10

# 5. Verify data survived
curl http://localhost:3000/get/persistent
# Should return: {"key":"persistent","value":"data"}
```

### Load Testing (Optional)

```bash
# Install Apache Bench (ab)
sudo apt-get install apache2-utils  # Ubuntu/Debian
brew install ab  # macOS

# Test with 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:3000/health
```

---

## 🌐 Cross-Platform Compatibility

This project is tested and works on:

| OS | Status | Notes |
| --- | --- | --- |
| **Windows 10/11** | ✅ Fully Compatible | Requires Docker Desktop with WSL2 backend |
| **macOS (Intel)** | ✅ Fully Compatible | Docker Desktop recommended |
| **macOS (Apple Silicon)** | ✅ Fully Compatible | Uses `platform: linux/amd64` for Redis (explicitly set in `docker-compose.yml`) |
| **Linux (Ubuntu/Debian)** | ✅ Fully Compatible | Native Docker Engine or Docker Desktop |
| **Linux (RHEL/CentOS)** | ✅ Compatible | May need SELinux configuration |

### Platform-Specific Notes

#### Windows (WSL2)

**Recommended Setup:**

1. Install Docker Desktop for Windows

1. Enable WSL2 integration

1. Clone repo inside WSL2 filesystem (not `/mnt/c/`)

**Why:** WSL2 provides native Linux performance for containers

#### macOS (Apple Silicon M1/M2/M3)

The `docker-compose.yml` explicitly sets the platform for the Redis service:

```yaml
redis:
  platform: linux/amd64  # Ensures compatibility on Apple Silicon (M1/M2/M3)
```

**Why:** Redis official images are optimized for x86_64. Docker handles emulation transparently.

---

## 📊 Monitoring & Logs

### View Real-Time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f redis

# Last 50 lines
docker-compose logs --tail=50
```

### Check Container Health

```bash
# Show service status
docker-compose ps

# Detailed health info
docker inspect --format='{{.State.Health.Status}}' node_app
# Output: healthy | unhealthy | starting
```

### Log Format Examples

**API Logs:**

```
node_app     | 2025-10-24T14:30:00.123Z - POST /set
node_app     | ✅ Key "user:1001" set with value "Alice"
```

**Redis Logs:**

```
redis_cache  | 1:M 24 Oct 2025 14:30:00.456 * Ready to accept connections
redis_cache  | 1:M 24 Oct 2025 14:30:05.789 * Background saving started
```

### Export Logs to File

```bash
docker-compose logs > application.log
```

---

## 🔐 Security Best Practices

This project implements several security measures:

### 1. Non-Root User

```
# api/Dockerfile
USER node  # Run as unprivileged user
```

**Why:** Limits damage if container is compromised

### 2. Read-Only Volumes (Where Possible)

```yaml
# Future enhancement
volumes:
  - redis_data:/data:ro  # Read-only for backups
```

### 3. Network Isolation

```yaml
networks:
  app-network:
    driver: bridge  # Isolated from other Docker networks
```

**Why:** Services can't access containers in other projects

### 4. Environment Variables

**Don't hardcode secrets:**

```yaml
# BAD
environment:
  - REDIS_PASSWORD=mypassword123

# GOOD
environment:
  - REDIS_PASSWORD=${REDIS_PASSWORD}  # From .env
```

### 5. Regular Image Updates

```bash
# Update base images
docker-compose pull
docker-compose up -d --build
```

**Why:** Patches security vulnerabilities

---

## 🚨 Troubleshooting

### Problem: "Cannot connect to Redis"

**Symptoms:**

```
node_app | ❌ Redis Client Error: connect ECONNREFUSED
node_app | ❌ Redis set error: { message: 'The client is not connected' }
```

This indicates the Node.js API failed to establish or maintain a connection with the Redis service.

**Solutions:**

1. **Check Redis health:**

1. **View Redis logs:**

1. **Restart services:**

1. **Check Node.js Redis client logs** (from `api/redis-client.js`): The client includes a robust reconnection strategy with event logging:

1. **Check network:**

---

### Problem: "Port 3000 already in use"

**Symptoms:**

```
Error: bind: address already in use
```

**Solutions:**

**Option 1: Find and kill the process**

```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Option 2: Change the port**

```bash
# Edit .env
API_PORT=3001

# Restart
docker-compose up -d
```

---

### Problem: "Docker daemon not running"

**Symptoms:**

```
Cannot connect to the Docker daemon
```

**Solutions:**

**Linux:**

```bash
sudo systemctl start docker
```

**macOS/Windows:**

- Start Docker Desktop application

---

### Problem: "Volume data persists after `docker-compose down`"

**Explanation:** This is **expected behavior**. Volumes persist by design.

**To delete data:**

```bash
docker-compose down -v  # -v flag removes volumes
```

**To backup before deletion:**

```bash
docker run --rm -v redis-demo_redis_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

### Problem: "Health check failing"

**Symptoms:**

```
node_app | Health check failed
```

**Debug Steps:**

1. **Check health endpoint manually:**

1. **Check if curl is installed:**

1. **View detailed health logs:**

---

### Problem: "Permission denied on check-env.sh"

**Solution:**

```bash
chmod +x check-env.sh
```

---

## 🚀 Deployment Considerations

### Production Checklist

- [ ] **Use production-grade image tags**

- [ ] **Configure resource limits**

- [ ] **Set up log rotation**

- [ ] **Use Docker Secrets for sensitive data**

- [ ] **Implement monitoring** (Prometheus, Grafana)

- [ ] **Set up automated backups**
  ```bash
  # Cron job example: Daily backup of Redis volume at 02:00 AM
  # This command runs a temporary container to archive the volume data.
  0 2 * * * docker run --rm -v redis-demo_redis_data:/data -v /path/to/backup/dir:/backup alpine tar czf /backup/redis-backup-$(date +\%Y\%m\%d).tar.gz -C /data .
  ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🧰 Maintainer

**Artem Rivnyi** — Junior Technical Support / DevOps Enthusiast

- 📧 [artemrivnyi@outlook.com](mailto:artemrivnyi@outlook.com)

- 🔗 [LinkedIn](https://www.linkedin.com/in/artem-rivnyi/)

- 🌐 [Personal Projects](https://personal-page-devops.onrender.com/)

- 💻 [GitHub](https://github.com/ArtemRivnyi)
