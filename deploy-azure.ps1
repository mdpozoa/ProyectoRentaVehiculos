$ErrorActionPreference = "Stop"

# Variables
$ACR_NAME = "zenithdrivemateo"
$RG_NAME = "zenithdrive-rg"
$ENV_NAME = "zenithdrive-env-v2"
$TAG = "v2.0"

$SERVICES = @(
    "auth-service",
    "inventario-service",
    "org-service",
    "operaciones-service",
    "financiero-service",
    "mantenimiento-service",
    "bus-service"
)

Write-Host "Iniciando sesión en Azure Container Registry: $ACR_NAME" -ForegroundColor Cyan
az acr login -n $ACR_NAME

foreach ($service in $SERVICES) {
    Write-Host "`n==========================================" -ForegroundColor Yellow
    Write-Host "Construyendo y subiendo: $service" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow

    $imageName = "$ACR_NAME.azurecr.io/$service`:$TAG"
    
    # Construir imagen Docker
    docker build -t $imageName "./services/$service"
    
    # Subir imagen al ACR
    docker push $imageName

    Write-Host "Actualizando Azure Container App: $service" -ForegroundColor Green
    # Actualizar la Container App con la nueva imagen
    az containerapp update -n $service -g $RG_NAME --image $imageName
}

# Construir el API Gateway (Nginx)
Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "Construyendo y subiendo: nginx-frontend" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$nginxImage = "$ACR_NAME.azurecr.io/nginx-frontend:$TAG"
docker build -f Dockerfile.nginx -t $nginxImage .
docker push $nginxImage

Write-Host "Actualizando Azure Container App: nginx-frontend" -ForegroundColor Green
az containerapp update -n nginx-frontend -g $RG_NAME --image $nginxImage

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "¡Despliegue v2.0 completado exitosamente!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
