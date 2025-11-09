# Kubernetes Local Testing Checklist

## Pre-Deployment Checklist

### 1. Review Your K8s Files
- [ ] **namespace.yaml** - Creates `leetcode-collab` namespace
- [ ] **secrets.yaml** - Contains all environment variables (MongoDB URI, Redis, JWT secrets)
- [ ] **mongo.yaml** - MongoDB deployment and service on port 27017
- [ ] **redis.yaml** - Redis deployment and service on port 6379
- [ ] **auth-service.yaml** - Auth service on port 8000
- [ ] **question-service.yaml** - Question service on port 3013
- [ ] **matching-service.yaml** - Matching service on port 3001
- [ ] **collab-service.yaml** - Collab service on port 8081
- [ ] **nginx-configmap.yaml** - Contains nginx.conf
- [ ] **nginx-deployment.yaml** - Nginx gateway on port 80
- [ ] **ingress.yaml** (optional) - Ingress rules

### 2. Key Configuration Points to Verify

#### Service Names Must Match Nginx Config
Your nginx.conf references these service names:
- `auth-service:8000` ✓
- `question-service:3013` ✓
- `matching-service:3001` ✓
- `collab-service:8081` ✓
- `mongo:27017` ✓
- `redis:6379` ✓

Make sure your K8s Service resources use these exact names.

#### Image Pull Policy
For local testing with Minikube, use:
```yaml
imagePullPolicy: Never  # or IfNotPresent
```

#### Environment Variables
Ensure all services have the correct environment variables:
- `MONGO_URI` - Should point to `mongodb://mongo:27017/your_db_name`
- `REDIS_HOST` - Should be `redis`
- `REDIS_PORT` - Should be `6379`
- `JWT_SECRET` - Same across all services
- `PORT` - Match the service's containerPort

#### Health Check Endpoints
Add health checks if your services support them:
- Auth service: `/health` or `/api/auth/health`
- Other services: Add appropriate endpoints

## Deployment Steps

### Step 1: Start Minikube
```bash
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
```

**Verify:**
```bash
kubectl cluster-info
minikube status
```

### Step 2: Build Images
```bash
eval $(minikube docker-env)

# Build all images
docker build -t auth-service:latest ./auth-service
docker build -t question-service:latest ./question-service
docker build -t matching-service:latest ./matching-service
docker build -t collab-service:latest ./collab/server
docker build -t nginx-gateway:latest ./nginx-gateway
```

**Verify:**
```bash
docker images | grep -E "auth-service|question-service|matching-service|collab-service|nginx-gateway"
```

### Step 3: Apply Configurations
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml
kubectl config set-context --current --namespace=leetcode-collab

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy infrastructure
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml

# Wait for infrastructure
kubectl wait --for=condition=ready pod -l app=mongo --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Deploy services
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/question-service.yaml
kubectl apply -f k8s/matching-service.yaml
kubectl apply -f k8s/collab-service.yaml

# Deploy gateway
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/nginx-deployment.yaml

# Optional: Apply ingress
kubectl apply -f k8s/ingress.yaml
```

**Verify:**
```bash
kubectl get all
kubectl get configmaps
kubectl get secrets
```

## Testing Checklist

### 1. Check Pod Status
```bash
# All pods should be Running
kubectl get pods

# Check specific pod details
kubectl describe pod <pod-name>
```

**Expected Status:** All pods in `Running` state with `1/1` ready

**Common Issues:**
- `ImagePullBackOff` → Image not found in Minikube's Docker
- `CrashLoopBackOff` → Application error (check logs)
- `Pending` → Resource constraints or PVC issues

### 2. Check Services
```bash
kubectl get services
```

**Verify:**
- All services have ClusterIP assigned
- Ports match your configuration
- Endpoints are available: `kubectl get endpoints`

### 3. Check Logs
```bash
# Check each service
kubectl logs -f deployment/auth-service
kubectl logs -f deployment/question-service
kubectl logs -f deployment/matching-service
kubectl logs -f deployment/collab-service
kubectl logs -f deployment/nginx-gateway

# Check for errors
kubectl logs deployment/auth-service | grep -i error
```

**Look for:**
- Successful database connections
- Service startup messages
- No connection errors
- Correct port bindings

### 4. Test Service Connectivity (Internal)
```bash
# Get a shell in a pod
kubectl exec -it deployment/auth-service -- /bin/sh

# Test internal connectivity
wget -O- http://mongo:27017
redis-cli -h redis ping
wget -O- http://auth-service:8000/health
```

### 5. Test External Access

**Option A: Using Minikube Tunnel (Recommended)**
```bash
# In a separate terminal
minikube tunnel

# In your main terminal
curl http://localhost/api/auth/health
```

**Option B: Using Port Forward**
```bash
kubectl port-forward svc/nginx-gateway 8080:80

# Test
curl http://localhost:8080/api/auth/health
```

**Option C: Using NodePort**
```bash
# Change service type to NodePort in nginx-deployment.yaml
kubectl get svc nginx-gateway
# Note the NodePort (e.g., 30123)

# Access using Minikube IP
curl http://$(minikube ip):30123/api/auth/health
```

### 6. API Endpoint Testing

#### Test Auth Service (No JWT required)
```bash
# Health check
curl http://localhost/api/auth/health

# Register user
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Save the JWT token from login response!**

#### Test Question Service (JWT required)
```bash
export JWT_TOKEN="your_token_here"

curl http://localhost/api/questions/ \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Test Matching Service (JWT required)
```bash
curl http://localhost/api/matching/status \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Test WebSocket (Collab Service)
```bash
# Install wscat if needed: npm install -g wscat
wscat -c "ws://localhost/api/collab/room?token=$JWT_TOKEN"
```

### 7. Check Nginx Configuration
```bash
# View nginx config
kubectl exec deployment/nginx-gateway -- cat /etc/nginx/nginx.conf

# Check nginx error logs
kubectl logs deployment/nginx-gateway | grep error

# Test nginx config syntax
kubectl exec deployment/nginx-gateway -- nginx -t
```

### 8. Test JWT Verification Flow
```bash
# This should fail without token
curl -v http://localhost/api/questions/

# This should succeed with valid token
curl -v http://localhost/api/questions/ \
  -H "Authorization: Bearer $JWT_TOKEN"

# Check auth verification logs
kubectl logs deployment/nginx-gateway | grep auth_verify
```

## Troubleshooting Guide

### Issue: Pods in CrashLoopBackOff

**Diagnosis:**
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
```

**Common Causes:**
1. **Database connection failed**
   - Check MONGO_URI format: `mongodb://mongo:27017/dbname`
   - Verify mongo pod is running: `kubectl get pods -l app=mongo`
   - Test connection: `kubectl exec -it <app-pod> -- wget -O- http://mongo:27017`

2. **Missing environment variables**
   - Check secrets: `kubectl get secret app-secrets -o yaml`
   - Verify env vars in deployment: `kubectl describe pod <pod-name>`

3. **Application error**
   - Check application logs for stack traces
   - Verify code works in Docker Compose first

### Issue: ImagePullBackOff

**Diagnosis:**
```bash
kubectl describe pod <pod-name>
```

**Solution:**
```bash
# Make sure you're using Minikube's Docker daemon
eval $(minikube docker-env)

# Rebuild the image
docker build -t service-name:latest ./path

# Verify image exists
docker images | grep service-name

# Ensure imagePullPolicy is Never or IfNotPresent in deployment
```

### Issue: Service Not Accessible

**Diagnosis:**
```bash
kubectl get svc
kubectl get endpoints
curl -v http://localhost/api/service-name/
```

**Solutions:**
1. **Check if minikube tunnel is running**
   ```bash
   # Start tunnel in separate terminal
   minikube tunnel
   ```

2. **Verify service ports**
   ```bash
   kubectl get svc nginx-gateway
   # Port 80 should map to container port 80
   ```

3. **Check nginx logs**
   ```bash
   kubectl logs deployment/nginx-gateway
   ```

### Issue: JWT Verification Failing

**Diagnosis:**
```bash
kubectl logs deployment/nginx-gateway | grep auth_verify
kubectl logs deployment/auth-service
```

**Check:**
1. Auth service endpoint `/api/jwt/verify-jwt` exists
2. JWT_SECRET matches between services
3. Token format is correct: `Bearer <token>`
4. Token hasn't expired

**Test auth service directly:**
```bash
kubectl port-forward svc/auth-service 8000:8000

curl http://localhost:8000/api/jwt/verify-jwt \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Issue: WebSocket Connection Failing

**Check:**
1. Nginx WebSocket configuration
   ```nginx
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection $connection_upgrade;
   ```

2. Collab service logs
   ```bash
   kubectl logs deployment/collab-service
   ```

3. Token passing
   ```bash
   # Token should be in query parameter
   wscat -c "ws://localhost/api/collab/room?token=$JWT_TOKEN"
   ```

### Issue: MongoDB Connection Failed

**Diagnosis:**
```bash
kubectl logs deployment/mongo
kubectl get pod -l app=mongo
```

**Test connectivity:**
```bash
# From another pod
kubectl exec -it deployment/auth-service -- /bin/sh
wget -O- http://mongo:27017
```

**Check MONGO_URI:**
```bash
kubectl get secret app-secrets -o jsonpath='{.data.MONGO_URI}' | base64 -d
```

### Issue: Redis Connection Failed

**Diagnosis:**
```bash
kubectl logs deployment/redis
kubectl get pod -l app=redis
```

**Test connectivity:**
```bash
kubectl exec -it deployment/redis -- redis-cli ping
# Should return: PONG

# From another pod
kubectl exec -it deployment/matching-service -- /bin/sh
redis-cli -h redis ping
```

## Performance Monitoring

```bash
# Resource usage
kubectl top pods
kubectl top nodes

# Describe resources
kubectl describe deployment auth-service

# Watch pod status
watch kubectl get pods
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace leetcode-collab

# Or delete individual resources
kubectl delete -f k8s/ --all

# Stop Minikube
minikube stop

# Delete Minikube cluster (fresh start)
minikube delete
```

## Development Workflow

When making code changes:

```bash
# 1. Make your code changes

# 2. Rebuild the image (with Minikube Docker)
eval $(minikube docker-env)
docker build -t service-name:latest ./service-path

# 3. Restart the deployment
kubectl rollout restart deployment/service-name

# 4. Watch the rollout
kubectl rollout status deployment/service-name

# 5. Check logs
kubectl logs -f deployment/service-name
```

## Success Criteria

✅ All pods in `Running` state
✅ All services have endpoints
✅ Auth endpoints respond (register/login)
✅ JWT authentication works
✅ Protected endpoints require valid JWT
✅ WebSocket connections establish
✅ MongoDB connections successful
✅ Redis connections successful
✅ No errors in logs
✅ Frontend loads properly

## Next Steps After Local Testing

1. Set up proper persistent volumes (not emptyDir)
2. Configure resource limits appropriately
3. Add proper health and readiness probes
4. Set up monitoring and logging (Prometheus, Grafana)
5. Configure horizontal pod autoscaling
6. Set up proper secrets management (Sealed Secrets, External Secrets)
7. Prepare for cloud deployment (EKS, GKE, AKS)