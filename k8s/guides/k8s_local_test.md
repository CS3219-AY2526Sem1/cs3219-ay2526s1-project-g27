# Kubernetes Local Testing - Master Guide

This directory contains comprehensive guides for testing your microservices architecture locally using Kubernetes (Minikube).

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Available Resources](#available-resources)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Common Issues](#common-issues)
6. [Additional Resources](#additional-resources)

## 🚀 Quick Start

The fastest way to get started:

```bash
# 1. Make the script executable
chmod +x k8s-quick-start.sh

# 2. Run it!
./k8s-quick-start.sh

# 3. In a separate terminal, start the tunnel
minikube tunnel

# 4. Access your app
curl http://localhost/api/auth/health
```

## 📚 Available Resources

### Core Guides

1. **k8s-local-setup-guide.md** - Complete setup guide with prerequisites and detailed steps
2. **k8s-testing-checklist.md** - Comprehensive testing checklist and troubleshooting
3. **nginx-jwt-guide.md** - Nginx configuration and JWT authentication specifics
4. **k8s-quick-start.sh** - Automated setup script

### Configuration Templates

5. **k8s-templates-infrastructure.yaml** - All service deployments and infrastructure
6. **k8s-nginx-gateway.yaml** - Nginx ConfigMap and Deployment

## 🏗️ Architecture Overview

Your microservices architecture consists of:

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx Gateway                        │
│                    (Port 80, LoadBalancer)                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service  │    │   Question   │    │   Matching   │
│  (Port 8000)  │    │   Service    │    │   Service    │
│               │    │  (Port 3013) │    │  (Port 3001) │
└───────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────────────────────────────────────────────┐
│                     MongoDB (Port 27017)              │
└───────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┘
        │                     
        ▼                     
┌──────────────┐    ┌──────────────────────────────────┐
│    Collab    │    │       Redis (Port 6379)          │
│   Service    │    │                                  │
│ (Port 8081)  │    │                                  │
└──────────────┘    └──────────────────────────────────┘
```

### Service Details

| Service | Port | Purpose | Auth Required |
|---------|------|---------|---------------|
| **Nginx Gateway** | 80 | API Gateway, Frontend hosting | N/A |
| **Auth Service** | 8000 | User authentication, JWT issuance | No (public endpoints) |
| **Question Service** | 3013 | Question management | Yes (JWT) |
| **Matching Service** | 3001 | User matching, SSE events | Yes (JWT) |
| **Collab Service** | 8081 | Real-time collaboration, WebSocket | Yes (JWT in query) |
| **MongoDB** | 27017 | Primary database | N/A |
| **Redis** | 6379 | Caching, pub/sub | N/A |

### API Routes

- `/api/auth/*` → Auth Service (no JWT required)
- `/api/questions/*` → Question Service (JWT required)
- `/api/matching/*` → Matching Service (JWT required, supports SSE)
- `/api/collab/*` → Collab Service (JWT in query param, WebSocket)

## 📖 Step-by-Step Guide

### Prerequisites

1. **Docker** - For building images
2. **Minikube** - Local Kubernetes cluster
3. **kubectl** - Kubernetes CLI
4. **(Optional) wscat** - For testing WebSocket: `npm install -g wscat`

### Installation

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Verify installations
minikube version
kubectl version --client
```

### Setup Process

#### 1. Start Minikube
```bash
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
```

#### 2. Build Images
```bash
# Switch to Minikube's Docker daemon
eval $(minikube docker-env)

# Build all service images
docker build -t auth-service:latest ./auth-service
docker build -t question-service:latest ./question-service
docker build -t matching-service:latest ./matching-service
docker build -t collab-service:latest ./collab/server
docker build -t nginx-gateway:latest ./nginx-gateway
```

#### 3. Apply Kubernetes Configurations

```bash
# Create namespace and switch to it
kubectl apply -f k8s/namespace.yaml
kubectl config set-context --current --namespace=leetcode-collab

# Apply secrets (UPDATE THIS FILE FIRST!)
kubectl apply -f k8s/secrets.yaml

# Deploy infrastructure
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=mongo --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Deploy application services
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/question-service.yaml
kubectl apply -f k8s/matching-service.yaml
kubectl apply -f k8s/collab-service.yaml

# Deploy nginx gateway
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/nginx-deployment.yaml

# Optional: Apply ingress
kubectl apply -f k8s/ingress.yaml
```

#### 4. Verify Deployment

```bash
# Check all pods are running
kubectl get pods

# Check all services
kubectl get svc

# Check logs if needed
kubectl logs -f deployment/auth-service
```

#### 5. Access Your Application

**Option A: Minikube Tunnel (Recommended)**
```bash
# In a separate terminal
minikube tunnel

# Access at http://localhost
curl http://localhost/api/auth/health
```

**Option B: Port Forward**
```bash
kubectl port-forward svc/nginx-gateway 8080:80

# Access at http://localhost:8080
curl http://localhost:8080/api/auth/health
```

### Testing Your Setup

#### 1. Test Auth Service
```bash
# Register a user
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "username": "testuser"
  }'

# Login and get JWT
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Save the token from the response!
export JWT_TOKEN="eyJhbGc..."
```

#### 2. Test Protected Endpoints
```bash
# Test question service
curl http://localhost/api/questions/ \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test matching service
curl http://localhost/api/matching/status \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 3. Test WebSocket
```bash
# Install wscat if needed
npm install -g wscat

# Connect to collab service
wscat -c "ws://localhost/api/collab/room?token=$JWT_TOKEN"
```

## ⚠️ Common Issues

### Issue: ImagePullBackOff

**Cause:** Image not found in Minikube's Docker registry

**Solution:**
```bash
eval $(minikube docker-env)  # Switch to Minikube's Docker
docker build -t service-name:latest ./path
# Ensure imagePullPolicy: Never in deployment YAML
```

### Issue: CrashLoopBackOff

**Cause:** Application error or failed database connection

**Solution:**
```bash
kubectl logs <pod-name>  # Check the logs
kubectl describe pod <pod-name>  # Check events

# Common fixes:
# 1. Check MONGO_URI is correct: mongodb://mongo:27017/dbname
# 2. Verify mongo pod is running: kubectl get pods -l app=mongo
# 3. Check environment variables: kubectl describe pod <pod-name>
```

### Issue: 502 Bad Gateway

**Cause:** Service not reachable or not running

**Solution:**
```bash
# Check if backend service is running
kubectl get pods
kubectl get svc

# Check nginx logs
kubectl logs deployment/nginx-gateway

# Test connectivity from nginx pod
kubectl exec -it deployment/nginx-gateway -- /bin/sh
wget -O- http://auth-service:8000/health
```

### Issue: JWT Verification Failing

**Cause:** Auth verification endpoint not implemented or misconfigured

**Solution:**
```bash
# Test auth service directly
kubectl port-forward svc/auth-service 8000:8000
curl http://localhost:8000/api/jwt/verify-jwt \
  -H "Authorization: Bearer $JWT_TOKEN"

# Should return 200 OK if token is valid
# If 404, implement the endpoint in your auth service
# See nginx-jwt-guide.md for implementation details
```

### Issue: WebSocket Won't Connect

**Cause:** Missing WebSocket headers or token not in query param

**Solution:**
```bash
# Check nginx logs
kubectl logs deployment/nginx-gateway

# Check collab service logs
kubectl logs deployment/collab-service

# Ensure token is in query parameter
wscat -c "ws://localhost/api/collab/room?token=$JWT_TOKEN"
```

## 🔧 Useful Commands

```bash
# View all resources
kubectl get all

# Check pod logs
kubectl logs -f deployment/<service-name>

# Get a shell in a pod
kubectl exec -it deployment/<service-name> -- /bin/sh

# Restart a deployment
kubectl rollout restart deployment/<service-name>

# Watch pod status
watch kubectl get pods

# Check resource usage
kubectl top pods

# Delete everything
kubectl delete namespace leetcode-collab

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

## 📖 Additional Resources

### Detailed Guides
- **k8s-local-setup-guide.md** - Read this for complete setup instructions
- **k8s-testing-checklist.md** - Use this for systematic testing and troubleshooting
- **nginx-jwt-guide.md** - Reference this for JWT authentication flow and nginx specifics

### Key Configuration Files to Review

Before deploying, review these files:

1. **secrets.yaml** - Update with your actual secrets
2. **namespace.yaml** - Namespace configuration
3. **nginx-configmap.yaml** - Nginx configuration
4. **[service]-deployment.yaml** - Each service deployment

### Important Notes

1. **imagePullPolicy**: Must be `Never` or `IfNotPresent` for local images
2. **Service Names**: Must match those in nginx.conf
3. **Environment Variables**: Must match between services
4. **Auth Endpoint**: `/api/jwt/verify-jwt` must be implemented in auth service
5. **Token Format**: Must be `Bearer <token>` for headers, just token for query params

## 🎯 Success Checklist

- [ ] Minikube running and accessible
- [ ] All images built in Minikube's Docker
- [ ] All pods in Running state (1/1 Ready)
- [ ] All services have ClusterIP assigned
- [ ] Can register a user via auth service
- [ ] Can login and receive JWT token
- [ ] Protected endpoints reject requests without token
- [ ] Protected endpoints accept requests with valid token
- [ ] WebSocket connections work with token in query param
- [ ] No errors in service logs
- [ ] No errors in nginx logs

## 🔄 Development Workflow

When making code changes:

```bash
# 1. Edit your code

# 2. Rebuild image (make sure you're using Minikube's Docker)
eval $(minikube docker-env)
docker build -t service-name:latest ./service-path

# 3. Restart the deployment
kubectl rollout restart deployment/service-name

# 4. Watch the rollout status
kubectl rollout status deployment/service-name

# 5. Check the logs
kubectl logs -f deployment/service-name
```

## 📞 Need Help?

If you encounter issues not covered here:

1. Check the logs: `kubectl logs deployment/<service-name>`
2. Describe the pod: `kubectl describe pod <pod-name>`
3. Review the detailed guides in this directory
4. Test services individually before testing the full stack

## 🚀 Next Steps

After successful local testing:

1. **Production Readiness**
   - Replace `emptyDir` with proper PersistentVolumes
   - Set appropriate resource limits
   - Add proper health checks
   - Configure horizontal pod autoscaling

2. **Monitoring & Logging**
   - Set up Prometheus for metrics
   - Set up Grafana for visualization
   - Configure centralized logging (ELK stack)

3. **Security**
   - Use Sealed Secrets or External Secrets Operator
   - Implement Network Policies
   - Add pod security policies
   - Enable TLS/SSL

4. **Cloud Deployment**
   - Prepare for EKS/GKE/AKS deployment
   - Configure cloud-specific services (RDS, ElastiCache, etc.)
   - Set up CI/CD pipelines
   - Configure domain and SSL certificates

---

**Good luck with your deployment! 🎉**