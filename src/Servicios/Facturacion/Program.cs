using Shared.DataManager;
using Shared.Helpers;
using Shared.Middleware;
using Serilog;
using Facturacion.DataAccess;
using Facturacion.Business;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "Facturacion")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{Service}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/facturacion-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.DefaultIgnoreCondition =
        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Facturacion API", Version = "v1",
        Description = "Microservicio de Facturación, Pagos, Detalle y Auditoría" });
    c.AddSecurityDefinition("Bearer", new() { Description = "JWT Bearer", Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header, Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http, Scheme = "Bearer" });
    c.AddSecurityRequirement(new()
    {
        { new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

builder.Services.AddSupabaseConnection(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddScoped<FacturacionDA>();
builder.Services.AddScoped<AuditoriaDA>();
builder.Services.AddScoped<FacturacionBusiness>();
builder.Services.AddScoped<AuditoriaBusiness>();

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();
app.UseCors("AllowAll");
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Facturacion v1"); c.RoutePrefix = "swagger"; });
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
