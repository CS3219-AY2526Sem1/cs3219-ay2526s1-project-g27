# Local Kubernetes Testing Guide

This guide will help you test your Kubernetes configuration locally using Minikube.

## Prerequisites

1. **Install Required Tools**
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   
   # Install minikube
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   
   # Install Docker (if not already installed)
   # Minikube can use Docker as a driver
   ```

## Step 1: Start Minikube

```bash
# Start minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable ingress addon (for ingress controller)
minikube addons enable ingress

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

## Step 2: Set Up Docker Environment

```bash
# Point your terminal to use minikube's Docker daemon
eval $(minikube docker-env)

# Now build your Docker images (they'll be available in minikube)
cd /path/to/your/project

# Build each service image
docker build -t auth-service:latest ./auth-service
docker build -t question-service:latest ./question-service
docker build -t matching-service:latest ./matching-service
docker build -t collab-service:latest ./collab/server
docker build -t nginx-gateway:latest ./nginx-gateway

# Verify images are built
docker images
```

## Step 3: Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
kubectl config set-context --current --namespace=leetcode-collab
```

## Step 4: Apply Secrets

```bash
# Create your secrets file first (secrets.yaml)
# Make sure it contains all necessary environment variables
kubectl apply -f k8s/secrets.yaml

# Verify secrets
kubectl get secrets
```

## Step 5: Deploy Infrastructure Services

```bash
# Deploy MongoDB
kubectl apply -f k8s/mongo.yaml

# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Wait for them to be ready
kubectl wait --for=condition=ready pod -l app=mongo --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Verify they're running
kubectl get pods
```

## Step 6: Deploy Application Services

```bash
# Deploy services in order
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/question-service.yaml
kubectl apply -f k8s/matching-service.yaml
kubectl apply -f k8s/collab-service.yaml

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all --timeout=300s

# Check status
kubectl get pods
kubectl get services
```

## Step 7: Deploy Nginx Gateway

```bash
# Apply nginx configmap (contains your nginx.conf)
kubectl apply -f k8s/nginx-configmap.yaml

# Deploy nginx
kubectl apply -f k8s/nginx-deployment.yaml

# Verify
kubectl get pods -l app=nginx-gateway
kubectl get svc nginx-gateway
```

## Step 8: Set Up Ingress

```bash
# Apply ingress configuration
kubectl apply -f k8s/ingress.yaml

# Get ingress details
kubectl get ingress

# Get minikube IP
minikube ip
```

## Step 9: Test Your Setup

```bash
# Option 1: Use minikube tunnel (recommended)
# Open a new terminal and run:
minikube tunnel
# This will expose your ingress on localhost

# Option 2: Use minikube service
minikube service nginx-gateway -n leetcode-collab

# Option 3: Port forward
kubectl port-forward svc/nginx-gateway 8080:80 -n leetcode-collab
```

## Step 10: Verify Services

```bash
# Check all resources
kubectl get all -n leetcode-collab

# Check logs for any service
kubectl logs -f deployment/auth-service
kubectl logs -f deployment/question-service
kubectl logs -f deployment/matching-service
kubectl logs -f deployment/collab-service
kubectl logs -f deployment/nginx-gateway

# Describe pods to see events/errors
kubectl describe pod <pod-name>

# Check service endpoints
kubectl get endpoints
```

## Testing API Endpoints

Once your cluster is running and tunnel is active:

```bash
# Test auth service
curl http://localhost/api/auth/health

# Test question service (with JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost/api/questions/

# Test matching service
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost/api/matching/status

# Test collab service WebSocket (use a WebSocket client)
wscat -c "ws://localhost/api/collab/room?token=YOUR_JWT_TOKEN"
```

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n leetcode-collab
kubectl describe pod <pod-name> -n leetcode-collab
```

### View Logs
```bash
# Real-time logs
kubectl logs -f <pod-name> -n leetcode-collab

# Previous logs (if pod crashed)
kubectl logs <pod-name> --previous -n leetcode-collab
```

### Check Service Connectivity
```bash
# Get a shell in a pod
kubectl exec -it <pod-name> -n leetcode-collab -- /bin/sh

# Test connectivity to other services
wget -O- http://auth-service:8000/health
wget -O- http://mongo:27017
redis-cli -h redis ping
```

### Common Issues

1. **ImagePullBackOff**: Make sure you're using minikube's Docker daemon
   ```bash
   eval $(minikube docker-env)
   # Rebuild images
   ```

2. **CrashLoopBackOff**: Check logs for application errors
   ```bash
   kubectl logs <pod-name>
   ```

3. **Services can't connect**: Verify service names and ports match your K8s configs

4. **Ingress not working**: Make sure ingress addon is enabled
   ```bash
   minikube addons enable ingress
   kubectl get pods -n ingress-nginx
   ```

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/ --all

# Or delete the entire namespace
kubectl delete namespace leetcode-collab

# Stop minikube
minikube stop

# Delete minikube cluster
minikube delete
```

## Development Workflow

For iterative development:

```bash
# Make code changes
# Rebuild the image
docker build -t service-name:latest ./service-directory

# Restart the deployment
kubectl rollout restart deployment/service-name

# Watch the rollout
kubectl rollout status deployment/service-name

# Check new logs
kubectl logs -f deployment/service-name
```

## Next Steps

1. Review each K8s YAML file for correct configuration
2. Ensure environment variables match between docker-compose and K8s secrets
3. Update image pull policies (use `imagePullPolicy: Never` for local images)
4. Test each service individually before testing the full stack
5. Set up proper health checks and resource limits