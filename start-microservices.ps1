# Levanta los 7 microservicios Node sin Docker (una ventana por servicio).
# Uso: .\start-microservices.ps1

$root = $PSScriptRoot
$services = @(
    @{ Name = "auth-service";          Port = 3001 },
    @{ Name = "inventario-service";    Port = 3002 },
    @{ Name = "org-service";           Port = 3003 },
    @{ Name = "operaciones-service";   Port = 3004 },
    @{ Name = "financiero-service";    Port = 3005 },
    @{ Name = "mantenimiento-service"; Port = 3006 },
    @{ Name = "bus-service";           Port = 3007 }
)

Write-Host "URBANCAR - Iniciando microservicios (sin Docker)..." -ForegroundColor Cyan
Write-Host "Cada servicio se abrira en una nueva ventana de terminal." -ForegroundColor Yellow
Write-Host ""

foreach ($svc in $services) {
    $dir = "$root\services\$($svc.Name)"
    if (Test-Path $dir) {
        $nodeModules = "$dir\node_modules"
        if (-not (Test-Path $nodeModules)) {
            Write-Host "  Instalando dependencias en $($svc.Name)..." -ForegroundColor Yellow
            $installCmd = 'cd /d "' + $dir + '" && npm install'
            Start-Process cmd -ArgumentList "/c", $installCmd -Wait
        }
        
        # Ejecuta a traves de CMD usando concatenacion simple para evitar conflictos de parseo de comillas/&& en PowerShell 5.1
        $devCmd = 'cd /d "' + $dir + '" && title ' + $svc.Name + ' && npm run dev'
        Start-Process cmd -ArgumentList "/k", $devCmd
        Write-Host "  [OK] $($svc.Name) iniciado en puerto $($svc.Port)" -ForegroundColor Green
        Start-Sleep -Milliseconds 300
    } else {
        Write-Host "  [SKIP] $($svc.Name) - carpeta no encontrada" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Listo. Microservicios inicializados." -ForegroundColor Green
