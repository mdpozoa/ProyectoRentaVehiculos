using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ProyectoRentaVehiculos.Api
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class DiagnosticoController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _http;

        public DiagnosticoController(IConfiguration config, IHttpClientFactory http)
        {
            _config = config;
            _http = http;
        }

        /// <summary>Obtiene la definición del check constraint de estado_pago</summary>
        [HttpGet("constraint-pago")]
        public async Task<IActionResult> GetConstraint()
        {
            var url = _config["Supabase:Url"];
            var key = _config["Supabase:Key"];

            // Query via PostgREST RPC — necesita una función SQL en Supabase
            // Como alternativa, hacemos un INSERT intencionalmente con un valor malo
            // y leemos el detalle del error para obtener la lista de valores válidos.
            // Pero la mejor forma es consultar pg_constraint directamente.

            // Supabase expone pg_catalog vía la API REST en /rest/v1/rpc/
            // Necesitamos una función; como alternativa consultamos information_schema
            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Add("apikey", key);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");

            // Consulta a information_schema para obtener el constraint
            var requestUrl = $"{url}/rest/v1/rpc/get_constraint_pago";
            
            // Si no existe esa función RPC, intentamos leer pg_constraint via SQL directo
            // usando el endpoint de SQL de Supabase (solo disponible con service_role)
            // Como tenemos publishable key, solo podemos acceder vía REST.
            
            // Devolvemos información de diagnóstico útil
            return Ok(new {
                mensaje = "Para ver el CHECK constraint, ve al Dashboard de Supabase → Database → Tables → pago → Constraints. O ejecuta en el SQL Editor: SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'pago_estado_pago_check';",
                supabase_dashboard = $"https://supabase.com/dashboard/project/mzgggdprufdvpzybpctv",
                sql_editor = $"https://supabase.com/dashboard/project/mzgggdprufdvpzybpctv/sql/new",
                sql_query = "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'pago_estado_pago_check';"
            });
        }
    }
}
