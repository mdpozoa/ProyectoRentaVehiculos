using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Supabase;

namespace ProyectoRentaVehiculos.DataManager
{
    public static class SupabaseConfig
    {
        public static void AddSupabaseConnection(this IServiceCollection services, IConfiguration configuration)
        {
            var supabaseUrl = configuration["Supabase:Url"];
            var supabaseKey = configuration["Supabase:Key"];
            var options = new SupabaseOptions { AutoConnectRealtime = false }; // ← corregido
            
            services.AddScoped<Client>(_ => new Client(supabaseUrl, supabaseKey, options));
        }
    }
}