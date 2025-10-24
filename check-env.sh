#!/bin/bash

# Environment Check Script for Docker Multi-Container Demo
# This script verifies all prerequisites are met

echo "🔍 Docker Multi-Container Demo - Environment Check"
echo "=================================================="

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed or not in PATH"
        echo "   Please install Docker from: https://docs.docker.com/get-docker/"
        return 1
    fi
    echo "✅ Docker is installed: $(docker --version)"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed or not in PATH"
        echo "   Please install Docker Compose from: https://docs.docker.com/compose/install/"
        return 1
    fi
    echo "✅ Docker Compose is installed: $(docker-compose --version)"
}

# Check if Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        echo "   Please start Docker Desktop or the Docker service"
        return 1
    fi
    echo "✅ Docker daemon is running"
}

# Get system information
get_system_info() {
    echo "💻 System Information:"
    echo "   OS: $(uname -s)"
    echo "   Architecture: $(uname -m)"
    echo "   Kernel: $(uname -r)"
}

# Check if containers are running
check_containers() {
    if docker-compose ps | grep -q "Up"; then
        echo "🚀 Application containers are running"
        echo ""
        docker-compose ps
    else
        echo "⏸️  Application containers are not running"
        echo "   Run 'make up' or 'docker-compose up -d' to start"
    fi
}

# Main check function
main() {
    echo ""
    check_docker
    check_docker_compose
    check_docker_daemon
    echo ""
    get_system_info
    echo ""
    check_containers
    echo ""
    echo "🎉 Environment check completed!"
}

# Run main function
main