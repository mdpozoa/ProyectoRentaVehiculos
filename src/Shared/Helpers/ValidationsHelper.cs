using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Shared.Helpers;

public static class ValidationsHelper
{
    public static string Capitalizar(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return char.ToUpper(value[0]) + value[1..].ToLower();
    }
}

/// <summary>JWT scope constants used across all microservices.</summary>
public static class JwtScopes
{
    public const string VehiculosRead  = "vehiculos:read";
    public const string ReservasWrite  = "reservas:write";
    public const string ReservasRead   = "reservas:read";
    public const string FacturacionRead  = "facturacion:read";
    public const string FacturacionWrite = "facturacion:write";
    public const string Admin          = "admin";
}

public static class JwtConfig
{
    /// <summary>Registers JWT Bearer authentication on a microservice.</summary>
    public static void AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtKey = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key not configured.");

        services.AddAuthentication(opt =>
        {
            opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            opt.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = false,
                ValidateAudience         = false,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };
        });

        services.AddAuthorization(opts =>
        {
            opts.AddPolicy("VehiculosRead",    p => p.RequireAuthenticatedUser());
            opts.AddPolicy("ReservasWrite",    p => p.RequireClaim("rol", "Admin", "Cliente"));
            opts.AddPolicy("AdminOnly",        p => p.RequireClaim("rol", "Admin"));
            opts.AddPolicy("FacturacionRead",  p => p.RequireClaim("rol", "Admin", "Cliente"));
        });
    }
}
