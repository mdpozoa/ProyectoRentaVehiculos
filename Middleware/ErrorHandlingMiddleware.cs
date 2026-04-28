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

            // Intentar extraer detalles si es un error de Supabase/PostgreSQL
            string? dbError = null;
            if (ex.GetType().Name == "PostgrestException")
            {
                // Usamos dynamic para evitar dependencia directa si el tipo es difícil de castear aquí
                dynamic dex = ex;
                dbError = $"DB Error: {dex.Message}. Details: {dex.Details}. Hint: {dex.Hint}";
            }

            var respuesta = new
            {
                error = ex.Message,
                dbDetails = dbError,
                mensaje = "Ocurrió un error en el servidor. Revisa los detalles."
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(respuesta)
            );
        }
    }
}