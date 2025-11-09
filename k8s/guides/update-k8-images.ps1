# update-k8s-images.ps1

$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$AWS_REGION = "us-east-1"
$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

Write-Host "Updating Kubernetes manifests with ECR registry: $ECR_REGISTRY"

$services = @(
    "auth-service",
    "question-service",
    "matching-service",
    "collab-service"
)

foreach ($service in $services) {
    $file = "k8s/$service.yaml"
    $content = Get-Content $file -Raw
    $updated = $content -replace "PLACEHOLDER/$service", "$ECR_REGISTRY/leetcode-collab/$service"
    $updated | Set-Content $file
    Write-Host "✓ Updated $file"
}

# Update nginx
$file = "k8s/nginx-deployment.yaml"
$content = Get-Content $file -Raw
$updated = $content -replace "PLACEHOLDER/nginx-gateway", "$ECR_REGISTRY/leetcode-collab/nginx-gateway"
$updated | Set-Content $file
Write-Host "✓ Updated $file"

Write-Host "`nAll manifests updated!"