using Shared.DataManager;
using Shared.Helpers;
using Shared.Middleware;
using Serilog;
using CatalogoVehiculos.DataAccess;
using CatalogoVehiculos.Business;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "CatalogoVehiculos")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{Service}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/catalogo-.log", rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] [{Service}] [{CorrelationId}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CatalogoVehiculos API", Version = "v1",
        Description = "Microservicio de Catálogo de Vehículos — OpenAPI v1.0" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Bearer Token",
        Name = "Authorization", In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http, Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddSupabaseConnection(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

// DataAccess
builder.Services.AddScoped<VehiculoDA>();
builder.Services.AddScoped<CatalogoDA>();

// Business
builder.Services.AddScoped<VehiculoBusiness>();
builder.Services.AddScoped<CatalogoBusiness>();

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors("AllowAll");
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "CatalogoVehiculos v1"); c.RoutePrefix = "swagger"; });
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
