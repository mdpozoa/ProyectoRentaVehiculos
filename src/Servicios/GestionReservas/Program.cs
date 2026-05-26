using Shared.DataManager;
using Shared.Helpers;
using Shared.Middleware;
using Serilog;
using GestionReservas.DataAccess;
using GestionReservas.Business;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "GestionReservas")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{Service}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/reservas-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.DefaultIgnoreCondition =
        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GestionReservas API", Version = "v1",
        Description = "Microservicio de Gestión de Reservas, Auth, Contratos y Siniestros" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Bearer Token", Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
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

// HTTP client para llamar a CatalogoVehiculos
builder.Services.AddHttpClient("CatalogoVehiculos", (sp, client) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    client.BaseAddress = new Uri(config["Services:CatalogoVehiculos"] ?? "http://localhost:5001");
});

// DataAccess
builder.Services.AddScoped<ReservaDA>();
builder.Services.AddScoped<PersonaDA>();
builder.Services.AddScoped<UsuarioDA>();
builder.Services.AddScoped<AuthDA>();
builder.Services.AddScoped<SiniestroDA>();

// Business
builder.Services.AddScoped<ReservaBusiness>();
builder.Services.AddScoped<AuthBusiness>();
builder.Services.AddScoped<PersonaBusiness>();
builder.Services.AddScoped<UsuarioBusiness>();

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors("AllowAll");
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "GestionReservas v1"); c.RoutePrefix = "swagger"; });
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
