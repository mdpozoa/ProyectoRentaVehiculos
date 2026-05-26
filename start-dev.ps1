# URBANCAR - API C# (puerto 5191) + frontend Vue (puerto 5173)
# Uso: .\start-dev.ps1   (desde ProyectoRentaVehiculos)

$root = $PSScriptRoot
$frontDir = Join-Path $root 'frontend'
$csproj = Join-Path $root 'ProyectoRentaVehiculos.csproj'

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host 'ERROR: Instala .NET SDK desde https://dotnet.microsoft.com/download' -ForegroundColor Red
    exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'ERROR: Instala Node.js 20+ desde https://nodejs.org' -ForegroundColor Red
    exit 1
}

Write-Host 'URBANCAR - Compilando API C#...' -ForegroundColor Cyan
Push-Location $root
dotnet build $csproj -c Debug --no-restore 2>$null
if ($LASTEXITCODE -ne 0) {
    dotnet restore $csproj
    dotnet build $csproj -c Debug
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'ERROR: No se pudo compilar la API.' -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Pop-Location

if (-not (Test-Path (Join-Path $frontDir 'node_modules'))) {
    Write-Host 'Instalando dependencias del frontend Vue...' -ForegroundColor Yellow
    Push-Location $frontDir
    npm install
    Pop-Location
}

$apiScript = 'Write-Host "API C#: http://localhost:5191" -ForegroundColor Green; Write-Host "Swagger: http://localhost:5191/swagger" -ForegroundColor Green; dotnet run --project ProyectoRentaVehiculos.csproj --no-build --launch-profile http'
$frontScript = 'Write-Host "Frontend Vue: http://localhost:5173" -ForegroundColor Green; npm run dev'

Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit', '-NoProfile', '-Command', $apiScript
Start-Sleep -Seconds 2
Start-Process powershell -WorkingDirectory $frontDir -ArgumentList '-NoExit', '-NoProfile', '-Command', $frontScript

Write-Host ''
Write-Host 'Listo. Abre en el navegador:' -ForegroundColor Cyan
Write-Host '  http://localhost:5173' -ForegroundColor Green
Write-Host ''
Write-Host 'API del frontend Vue: http://localhost:5191/api' -ForegroundColor Yellow
Write-Host '(No necesitas Docker ni microservicios Node para este frontend.)' -ForegroundColor DarkGray
