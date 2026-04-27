using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ProyectoRentaVehiculos.DataManager
{
    /// <summary>
    /// Elimina del Swagger las propiedades internas heredadas de BaseModel de Supabase
    /// (baseUrl, requestClientOptions) que no son campos de la base de datos.
    /// </summary>
    public class SupabaseSchemaFilter : ISchemaFilter
    {
        // Propiedades de Supabase.Postgrest.Models.BaseModel que NO deben
        // aparecer en los schemas del Swagger
        private static readonly string[] _hiddenProps =
        [
            "baseUrl",
            "requestClientOptions",
            "tableName",
            "primaryKey",
            "BaseUrl",
            "RequestClientOptions",
            "TableName",
            "PrimaryKey"
        ];

        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (schema.Properties == null) return;

            var keysToRemove = schema.Properties.Keys
                .Where(k => _hiddenProps.Any(h => string.Equals(h, k, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            foreach (var key in keysToRemove)
            {
                schema.Properties.Remove(key);
            }
        }
    }
}
