namespace ApiGateway.Middleware;

/// <summary>
/// Genera o propaga el X-Correlation-Id para trazabilidad distribuida.
/// Cada request tiene un ID único que se añade a todos los logs y headers de respuesta.
/// </summary>
public class CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
{
    private const string HeaderName = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        // Reutilizar si ya viene del cliente, o generar uno nuevo
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
                            ?? Guid.NewGuid().ToString("N")[..12];

        // Añadir al contexto de Serilog
        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        {
            // Propagarlo hacia los microservicios aguas abajo
            context.Request.Headers[HeaderName] = correlationId;
            context.Response.Headers[HeaderName] = correlationId;

            logger.LogDebug("[{CorrelationId}] {Method} {Path} → forwarding",
                correlationId, context.Request.Method, context.Request.Path);

            await next(context);
        }
    }
}
