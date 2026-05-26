using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ApiGateway.Middleware;

/// <summary>
/// Valida JWT y scopes en el Gateway ANTES de reenviar al microservicio.
/// Rutas protegidas: reservas/write, admin.
/// El catálogo de vehículos es de acceso libre (no requiere JWT).
/// </summary>
public class JwtScopeMiddleware(RequestDelegate next, IConfiguration config, ILogger<JwtScopeMiddleware> logger)
{
    // Rutas públicas que NO requieren autenticación
    private static readonly string[] PublicPaths =
    [
        "/api/v1/vehiculos",
        "/api/v1/catalogo-admin/marcas",
        "/api/v1/catalogo-admin/modelos",
        "/api/v1/catalogo-admin/categorias",
        "/api/v1/catalogo-admin/agencias",
        "/api/v1/catalogo-admin/tarifas",
        "/api/v1/catalogo-admin/ciudades",
        "/api/v1/auth/login",
        "/api/v1/usuarios",   // POST allowed without auth (registro)
        "/health"
    ];

    // Rutas que requieren rol Admin
    private static readonly string[] AdminPaths =
    [
        "/api/v1/auditorias",
        "/api/v1/kardex"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        var path   = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        // Permitir rutas públicas
        if (IsPublic(path, method))
        {
            await next(context);
            return;
        }

        // Validar token JWT
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Token de autenticación requerido." });
            return;
        }

        var token = authHeader["Bearer ".Length..].Trim();
        var claims = ValidateToken(token);

        if (claims == null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Token inválido o expirado." });
            return;
        }

        var rol = claims.FirstOrDefault(c => c.Type == "rol")?.Value ?? "";
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? "N/A";

        // Verificar rutas de admin
        if (AdminPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)) && rol != "Admin")
        {
            logger.LogWarning("[{CorrelationId}] Acceso denegado a {Path} para rol={Rol}", correlationId, path, rol);
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Acceso denegado. Se requiere rol Admin." });
            return;
        }

        logger.LogInformation("[{CorrelationId}] {Method} {Path} → usuario rol={Rol}", correlationId, method, path, rol);
        await next(context);
    }

    private bool IsPublic(string path, string method)
    {
        // GET a vehículos es público
        if (path.StartsWith("/api/v1/vehiculos", StringComparison.OrdinalIgnoreCase) && method == "GET") return true;
        // POST a /api/v1/usuarios es registro público
        if (path.Equals("/api/v1/usuarios", StringComparison.OrdinalIgnoreCase) && method == "POST") return true;
        // Login y health
        return PublicPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase) && method == "POST" || path.StartsWith("/health") || path.StartsWith("/api/v1/auth"));
    }

    private IEnumerable<System.Security.Claims.Claim>? ValidateToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer           = false,
                ValidateAudience         = false,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = key
            }, out _);
            return principal.Claims;
        }
        catch { return null; }
    }
}
