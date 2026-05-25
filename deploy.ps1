$ErrorActionPreference = "Stop"

$RESOURCE_GROUP = "zenithdrive-rg"
$LOCATION = "eastus"
$ACR_NAME = "zenithdrivemateo"
$ENVIRONMENT_NAME = "zenithdrive-env-v2"

# -- Cargar variables de entorno --
$envFile = ""
if (Test-Path ".env.microservices") {
    $envFile = ".env.microservices"
} elseif (Test-Path ".env") {
    $envFile = ".env"
}

if ($envFile) {
    Write-Host "Cargando variables de entorno desde $envFile..." -ForegroundColor Cyan
    Get-Content $envFile | Where-Object { $_ -match "^[^#\s]+=" } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
    }
} else {
    Write-Host "Advertencia: No se encontro archivo .env.microservices" -ForegroundColor Yellow
}

Write-Host "`n=========================================="
Write-Host "   Zenith Drive - Deploy en Azure Container   "
Write-Host "==========================================`n"

# -- PASO 1: Azure Container Registry --
Write-Host "▶ [1/5] Creando Azure Container Registry..." -ForegroundColor Cyan
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true --output none

$ACR_SERVER = (az acr show --name $ACR_NAME --query loginServer --output tsv).Trim()
$ACR_PASSWORD = (az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv).Trim()
Write-Host "    ACR: $ACR_SERVER OK" -ForegroundColor Green

# -- PASO 2: Build de imagenes localmente y push a ACR --
Write-Host "`n▶ [2/5] Construyendo imagenes Docker localmente y subiendo a ACR..." -ForegroundColor Cyan
Write-Host "    (requiere Docker Desktop corriendo)" -ForegroundColor Yellow

az acr login --name $ACR_NAME

function Build-And-Push($Image, $Context, $Dockerfile) {
    if (-not $Dockerfile) { $Dockerfile = "$Context\Dockerfile" }
    docker build -t "$ACR_SERVER/$Image" -f $Dockerfile $Context
    docker push "$ACR_SERVER/$Image"
    Write-Host "    $Image OK" -ForegroundColor Green
}

Build-And-Push "auth-service:latest" ".\services\auth-service" ""
Build-And-Push "inventario-service:latest" ".\services\inventario-service" ""
Build-And-Push "org-service:latest" ".\services\org-service" ""
Build-And-Push "operaciones-service:latest" ".\services\operaciones-service" ""
Build-And-Push "financiero-service:latest" ".\services\financiero-service" ""
Build-And-Push "mantenimiento-service:latest" ".\services\mantenimiento-service" ""
Build-And-Push "bus-service:latest" ".\services\bus-service" ""
Build-And-Push "nginx-frontend:latest" "." ".\Dockerfile.nginx.containerapp"
Write-Host "    nginx-frontend OK" -ForegroundColor Green

# -- PASO 3: Container Apps Environment --
Write-Host "`n▶ [3/5] Creando Container Apps Environment..." -ForegroundColor Cyan
az containerapp env create --name $ENVIRONMENT_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --output none
Write-Host "    Environment '$ENVIRONMENT_NAME' OK" -ForegroundColor Green

# -- PASO 4: Deploy de microservicios (ingress interno) --
Write-Host "`n▶ [4/5] Desplegando microservicios..." -ForegroundColor Cyan

function Deploy-Service($Name, $Image, $Port, $EnvVars) {
    $azArgs = @(
        "containerapp", "create",
        "--name", $Name,
        "--resource-group", $RESOURCE_GROUP,
        "--environment", $ENVIRONMENT_NAME,
        "--image", "$ACR_SERVER/$Image",
        "--registry-server", $ACR_SERVER,
        "--registry-username", $ACR_NAME,
        "--registry-password", $ACR_PASSWORD,
        "--ingress", "internal",
        "--target-port", $Port,
        "--min-replicas", "0",
        "--max-replicas", "2",
        "--output", "none"
    )

    if ($EnvVars -and $EnvVars.Count -gt 0) {
        $azArgs += "--env-vars"
        $azArgs += $EnvVars
    }

    & az $azArgs
    Write-Host "    $Name OK" -ForegroundColor Green
}

# Leer las variables cargadas
$AUTH_DATABASE_URL = [Environment]::GetEnvironmentVariable("AUTH_DATABASE_URL")
$AUTH_DIRECT_URL = [Environment]::GetEnvironmentVariable("AUTH_DIRECT_URL")
$JWT_SECRET = [Environment]::GetEnvironmentVariable("JWT_SECRET")
$JWT_EXPIRES_IN = [Environment]::GetEnvironmentVariable("JWT_EXPIRES_IN"); if (-not $JWT_EXPIRES_IN) { $JWT_EXPIRES_IN = "7d" }
$INVENTARIO_DATABASE_URL = [Environment]::GetEnvironmentVariable("INVENTARIO_DATABASE_URL")
$INVENTARIO_DIRECT_URL = [Environment]::GetEnvironmentVariable("INVENTARIO_DIRECT_URL")
$ORG_DATABASE_URL = [Environment]::GetEnvironmentVariable("ORG_DATABASE_URL")
$ORG_DIRECT_URL = [Environment]::GetEnvironmentVariable("ORG_DIRECT_URL")
$OPERACIONES_DATABASE_URL = [Environment]::GetEnvironmentVariable("OPERACIONES_DATABASE_URL")
$OPERACIONES_DIRECT_URL = [Environment]::GetEnvironmentVariable("OPERACIONES_DIRECT_URL")
$FINANCIERO_DATABASE_URL = [Environment]::GetEnvironmentVariable("FINANCIERO_DATABASE_URL")
$FINANCIERO_DIRECT_URL = [Environment]::GetEnvironmentVariable("FINANCIERO_DIRECT_URL")
$MANTENIMIENTO_DATABASE_URL = [Environment]::GetEnvironmentVariable("MANTENIMIENTO_DATABASE_URL")
$MANTENIMIENTO_DIRECT_URL = [Environment]::GetEnvironmentVariable("MANTENIMIENTO_DIRECT_URL")
$AZURE_SERVICEBUS_CONNECTION_STRING = [Environment]::GetEnvironmentVariable("AZURE_SERVICEBUS_CONNECTION_STRING")
$AZURE_SERVICEBUS_TOPIC = [Environment]::GetEnvironmentVariable("AZURE_SERVICEBUS_TOPIC"); if (-not $AZURE_SERVICEBUS_TOPIC) { $AZURE_SERVICEBUS_TOPIC = "zenithdrive-eventos" }

Deploy-Service -Name "auth-service" -Image "auth-service:latest" -Port 3001 -EnvVars @(
  "DATABASE_URL=$AUTH_DATABASE_URL",
  "DIRECT_URL=$AUTH_DIRECT_URL",
  "JWT_SECRET=$JWT_SECRET",
  "JWT_EXPIRES_IN=$JWT_EXPIRES_IN",
  "PORT=3001",
  "NODE_ENV=production",
  "CORS_ORIGIN=*"
)

Deploy-Service -Name "inventario-service" -Image "inventario-service:latest" -Port 3002 -EnvVars @(
  "DATABASE_URL=$INVENTARIO_DATABASE_URL",
  "DIRECT_URL=$INVENTARIO_DIRECT_URL",
  "JWT_SECRET=$JWT_SECRET",
  "PORT=3002",
  "NODE_ENV=production",
  "CORS_ORIGIN=*"
)

Deploy-Service -Name "org-service" -Image "org-service:latest" -Port 3003 -EnvVars @(
  "DATABASE_URL=$ORG_DATABASE_URL",
  "DIRECT_URL=$ORG_DIRECT_URL",
  "JWT_SECRET=$JWT_SECRET",
  "PORT=3003",
  "NODE_ENV=production",
  "CORS_ORIGIN=*"
)

Deploy-Service -Name "operaciones-service" -Image "operaciones-service:latest" -Port 3004 -EnvVars @(
  "DATABASE_URL=$OPERACIONES_DATABASE_URL",
  "DIRECT_URL=$OPERACIONES_DIRECT_URL",
  "JWT_SECRET=$JWT_SECRET",
  "PORT=3004",
  "NODE_ENV=production",
  "CORS_ORIGIN=*",
  "INVENTARIO_SERVICE_URL=http://inventario-service"
)

Deploy-Service -Name "financiero-service" -Image "financiero-service:latest" -Port 3005 -EnvVars @(
  "DATABASE_URL=$FINANCIERO_DATABASE_URL",
  "DIRECT_URL=$FINANCIERO_DIRECT_URL",
  "JWT_SECRET=$JWT_SECRET",
  "PORT=3005",
  "NODE_ENV=production",
  "CORS_ORIGIN=*"
)

Deploy-Service -Name "mantenimiento-service" -Image "mantenimiento-service:latest" -Port 3006 -EnvVars @(
  "DATABASE_URL=$MANTENIMIENTO_DATABASE_URL",
  "DIRECT_URL=$MANTENIMIENTO_DIRECT_URL",
  "JWT_SECRET=$JWT_SECRET",
  "PORT=3006",
  "NODE_ENV=production",
  "CORS_ORIGIN=*"
)

Deploy-Service -Name "bus-service" -Image "bus-service:latest" -Port 3007 -EnvVars @(
  "JWT_SECRET=$JWT_SECRET",
  "PORT=3007",
  "NODE_ENV=production",
  "CORS_ORIGIN=*",
  "AZURE_SERVICEBUS_CONNECTION_STRING=$AZURE_SERVICEBUS_CONNECTION_STRING",
  "AZURE_SERVICEBUS_TOPIC=$AZURE_SERVICEBUS_TOPIC",
  "OPERACIONES_SERVICE_URL=http://operaciones-service",
  "INVENTARIO_SERVICE_URL=http://inventario-service",
  "FINANCIERO_SERVICE_URL=http://financiero-service"
)

# -- PASO 5: Deploy nginx + frontend (ingress externo) --
Write-Host "`n▶ [5/5] Desplegando frontend + API Gateway (Nginx)..." -ForegroundColor Cyan

$APP_URL = (az containerapp create `
  --name "nginx-frontend" `
  --resource-group $RESOURCE_GROUP `
  --environment $ENVIRONMENT_NAME `
  --image "$ACR_SERVER/nginx-frontend:latest" `
  --registry-server $ACR_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --ingress external `
  --target-port 80 `
  --min-replicas 1 `
  --max-replicas 3 `
  --query properties.configuration.ingress.fqdn `
  --output tsv).Trim()

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   OK - DEPLOY COMPLETO                                   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   URL: https://$APP_URL" -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Green
