using System;
using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using ProyectoRentaVehiculos.DataManager;
using ProyectoRentaVehiculos.Middleware;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver
        {
            Modifiers = { (typeInfo) => 
            {
                if (typeInfo.Type.IsSubclassOf(typeof(Supabase.Postgrest.Models.BaseModel)))
                {
                    foreach (var property in typeInfo.Properties)
                    {
                        if (property.AttributeProvider != null && 
                            property.AttributeProvider.GetCustomAttributes(typeof(System.Text.Json.Serialization.JsonPropertyNameAttribute), true).Length == 0)
                        {
                            property.ShouldSerialize = (_, _) => false;
                        }
                        
                        if (property.Name is "BaseUri" or "ClientOptions" or "PrimaryKeys" or "TableName" or "PrimaryKey")
                        {
                            property.ShouldSerialize = (_, _) => false;
                        }
                    }
                }
            }}
        };
    });

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "URBANCAR API",
        Version     = "v1",
        Description = "API REST para el sistema de renta de vehículos URBANCAR. Incluye gestión de personas, usuarios, vehículos, reservas, contratos, facturas, kardex y pagos."
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

    c.SchemaFilter<ProyectoRentaVehiculos.DataManager.SupabaseSchemaFilter>();

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Ingresa tu Token JWT (sin el prefijo 'Bearer').",
        Name        = "Authorization",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.Http,
        Scheme      = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddSupabaseConnection(builder.Configuration);

// ── Dependency Injection ──────────────────────────────────────────────────────
builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.AuthDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.AuthBusiness>();

builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.UsuarioDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.UsuarioBusiness>();

builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.VehiculoDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.VehiculoBusiness>();

builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.ReservaDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.ReservaBusiness>();

builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.FacturacionDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.MiscBusiness>();

builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.PersonaDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.PersonaBusiness>();

builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.AdministracionDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.AdministracionBusiness>();
builder.Services.AddScoped<ProyectoRentaVehiculos.DataAccess.AuditoriaDA>();
builder.Services.AddScoped<ProyectoRentaVehiculos.Business.AuditoriaBusiness>();

// ── JWT ───────────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = false,
            ValidateAudience         = false,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    });

var app = builder.Build();

app.UseCors(options => options
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "URBANCAR API v1");
    c.RoutePrefix = "swagger";
});

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();