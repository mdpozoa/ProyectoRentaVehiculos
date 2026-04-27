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

            var (statusCode, mensaje) = ex switch
            {
                KeyNotFoundException   => (HttpStatusCode.NotFound,           "Recurso no encontrado."),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized,  "No tienes permiso para esta acción."),
                ArgumentException      => (HttpStatusCode.BadRequest,         ex.Message),
                InvalidOperationException => (HttpStatusCode.BadRequest,      ex.Message),
                _                      => (HttpStatusCode.InternalServerError, "Ocurrió un error interno. Intenta nuevamente.")
            };

            context.Response.StatusCode = (int)statusCode;

            var respuesta = new
            {
                error   = mensaje,
                detalle = ex.ToString()  // Mostrar stack trace para depuración profunda
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(respuesta)
            );
        }
    }
}