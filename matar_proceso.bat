@echo off
echo ==============================================
echo Cerrando procesos de ProyectoRentaVehiculos...
echo ==============================================
taskkill /F /IM ProyectoRentaVehiculos.exe
taskkill /F /IM dotnet.exe
echo.
echo ==============================================
echo Procesos cerrados. Ya puedes volver a compilar (dotnet run / dotnet build).
echo ==============================================
pause
