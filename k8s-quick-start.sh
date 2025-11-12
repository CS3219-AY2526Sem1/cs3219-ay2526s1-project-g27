#!/bin/bash

# Quick Start Script for Local Kubernetes Testing
# This script automates the setup of your microservices on Minikube

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo_error "minikube is not installed. Please install it first."
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Project root: $PROJECT_ROOT"

echo "Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm install
npm run build

echo "Frontend built successfully! Output: frontend/dist"

echo ""
echo "Building nginx-gateway image..."
cd "$PROJECT_ROOT"



# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo_error "kubectl is not installed. Please install it first."
    exit 1
fi

echo_info "Starting Minikube cluster..."
minikube start --cpus=4 --memory=8192 --driver=docker || {
    echo_error "Failed to start Minikube"
    exit 1
}

echo_info "Enabling Ingress addon..."
minikube addons enable ingress
minikube addons enable storage-provisioner

echo_info "Switching to Minikube Docker daemon..."
eval $(minikube docker-env)


echo_info "Building Docker images..."
# Update these paths based on your project structure
docker build -t auth-service:latest -f auth-service/Dockerfile.dev ./auth-service || echo_warn "Failed to build auth-service"
docker build -t question-service:latest ./question-service || echo_warn "Failed to build question-service"
docker build -t matching-service:latest ./matching-service || echo_warn "Failed to build matching-service"
docker build -t collab-service:latest ./collab/server || echo_warn "Failed to build collab-service"
docker build -f nginx-gateway/Dockerfile.simple -t nginx-gateway:latest "$PROJECT_ROOT"

echo_info "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo_info "Setting default namespace..."
kubectl config set-context --current --namespace=leetcode-collab

echo_info "Applying secrets..."
kubectl apply -f k8s/secrets.yaml

echo_info "Deploying infrastructure services..."
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml

echo_info "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=mongo --timeout=300s || echo_warn "Mongo pod not ready"
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s || echo_warn "Redis pod not ready"

echo_info "Deploying application services..."
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/question-service.yaml
kubectl apply -f k8s/matching-service.yaml
kubectl apply -f k8s/collab-service.yaml

echo_info "Deploying Nginx gateway..."
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/nginx-deployment.yaml

echo_info "Waiting for all services to be ready..."
sleep 10
kubectl wait --for=condition=ready pod --all --timeout=300s || echo_warn "Some pods not ready"

echo_info "Applying ingress configuration..."
kubectl apply -f k8s/ingress.yaml || echo_warn "No ingress file found"

echo ""
echo_info "================================"
echo_info "Deployment Complete!"
echo_info "================================"
echo ""

# Display cluster status
echo_info "Cluster Status:"
kubectl get pods
echo ""
kubectl get services
echo ""

# Get Minikube IP
MINIKUBE_IP=$(minikube ip)
echo_info "Minikube IP: $MINIKUBE_IP"
echo ""

echo_info "To access your application:"
echo "  1. Run: minikube tunnel (in a separate terminal)"
echo "  2. Access at: http://localhost"
echo ""
echo "  OR"
echo ""
echo "  1. Port forward: kubectl port-forward svc/nginx-gateway 8080:80"
echo "  2. Access at: http://localhost:8080"
echo ""

echo_info "Useful commands:"
echo "  - View logs: kubectl logs -f deployment/<service-name>"
echo "  - Get shell: kubectl exec -it <pod-name> -- /bin/sh"
echo "  - Restart: kubectl rollout restart deployment/<service-name>"
echo "  - Check status: kubectl get all"
echo ""

echo_info "To clean up:"
echo "  kubectl delete namespace leetcode-collab"
echo "  minikube stop"
echo "  minikube delete"