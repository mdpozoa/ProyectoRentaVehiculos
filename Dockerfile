# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["ProyectoRentaVehiculos.csproj", "./"]
RUN dotnet restore "ProyectoRentaVehiculos.csproj"
COPY . .
RUN dotnet publish "ProyectoRentaVehiculos.csproj" -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ProyectoRentaVehiculos.dll"]
