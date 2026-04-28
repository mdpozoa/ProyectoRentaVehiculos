using System.Net;
using System.Text.Json;

namespace ProyectoRentaVehiculos.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error no controlado: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            context.Response.ContentType = "application/json";

            var statusCode = ex switch
            {
                KeyNotFoundException => HttpStatusCode.NotFound,
                UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                ArgumentException => HttpStatusCode.BadRequest,
                InvalidOperationException => HttpStatusCode.BadRequest,
                _ => HttpStatusCode.InternalServerError
            };

            context.Response.StatusCode = (int)statusCode;

            // Intentar extraer detalles si es un error de Supabase/PostgreSQL usando reflexión segura
            string? dbError = null;
            if (ex.GetType().Name.Contains("PostgrestException"))
            {
                try {
                    var msg = ex.GetType().GetProperty("Message")?.GetValue(ex)?.ToString();
                    var details = ex.GetType().GetProperty("Details")?.GetValue(ex)?.ToString();
                    var hint = ex.GetType().GetProperty("Hint")?.GetValue(ex)?.ToString();
                    dbError = $"DB Error: {msg}. Details: {details}. Hint: {hint}";
                } catch {
                    dbError = "Error de base de datos (detalles no disponibles vía reflexión).";
                }
            }

            var respuesta = new
            {
                error = ex.Message,
                dbDetails = dbError,
                mensaje = "Error interno del servidor. Revisa los detalles."
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(respuesta)
            );
        }
    }
}