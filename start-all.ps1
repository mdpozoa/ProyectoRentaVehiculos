# start-all.ps1
$root = $PSScriptRoot

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  URBANCAR - Microservicios" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: .NET SDK no encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "Compilando proyectos necesarios..." -ForegroundColor Cyan
$projects = @(
    "src\Servicios\CatalogoVehiculos\CatalogoVehiculos.csproj",
    "src\Servicios\GestionReservas\GestionReservas.csproj",
    "src\Servicios\Facturacion\Facturacion.csproj",
    "src\ApiGateway\ApiGateway.csproj"
)
foreach ($project in $projects) {
    dotnet build $project -c Debug
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: La compilación de $project falló." -ForegroundColor Red
        exit 1
    }
}


$jobs = @()

$jobs += Start-Job -Name "CatalogoVehiculos" -ScriptBlock {
    param($dir)
    Set-Location $dir
    dotnet run --project "src\Servicios\CatalogoVehiculos\CatalogoVehiculos.csproj" --no-build --urls "http://localhost:5001"
} -ArgumentList $root

Start-Sleep -Seconds 1

$jobs += Start-Job -Name "GestionReservas" -ScriptBlock {
    param($dir)
    Set-Location $dir
    dotnet run --project "src\Servicios\GestionReservas\GestionReservas.csproj" --no-build --urls "http://localhost:5002"
} -ArgumentList $root

Start-Sleep -Seconds 1

$jobs += Start-Job -Name "Facturacion" -ScriptBlock {
    param($dir)
    Set-Location $dir
    dotnet run --project "src\Servicios\Facturacion\Facturacion.csproj" --no-build --urls "http://localhost:5003"
} -ArgumentList $root

Start-Sleep -Seconds 1

$jobs += Start-Job -Name "ApiGateway" -ScriptBlock {
    param($dir)
    Set-Location $dir
    dotnet run --project "src\ApiGateway\ApiGateway.csproj" --no-build --urls "http://localhost:5000"
} -ArgumentList $root

Write-Host "Servicios iniciados en puertos 5000, 5001, 5002, 5003" -ForegroundColor Green
Write-Host "Presiona CTRL+C para detener." -ForegroundColor Yellow

try {
    while ($true) {
        foreach ($job in $jobs) {
            $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($output) {
                Write-Host "[$($job.Name)] $output"
            }
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "Deteniendo servicios..." -ForegroundColor Red
    $jobs | Stop-Job
    $jobs | Remove-Job
}
