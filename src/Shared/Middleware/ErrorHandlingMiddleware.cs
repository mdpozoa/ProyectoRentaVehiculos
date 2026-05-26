using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Shared.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? "N/A";
            logger.LogError(ex,
                "[{CorrelationId}] Error no controlado en {Method} {Path}: {Message}",
                correlationId, context.Request.Method, context.Request.Path, ex.Message);
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

        string? dbError = null;
        if (ex.GetType().Name.Contains("PostgrestException"))
        {
            try
            {
                var details = ex.GetType().GetProperty("Details")?.GetValue(ex)?.ToString();
                var hint = ex.GetType().GetProperty("Hint")?.GetValue(ex)?.ToString();
                dbError = $"DB: {ex.Message}. Details: {details}. Hint: {hint}";
            }
            catch { dbError = "Error de base de datos."; }
        }

        var respuesta = new
        {
            success = false,
            message = ex.Message,
            dbDetails = dbError,
            errors = new[] { ex.Message }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(respuesta));
    }
}
