using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Supabase;

namespace Shared.DataManager;

public static class SupabaseConfig
{
    public static void AddSupabaseConnection(this IServiceCollection services, IConfiguration configuration)
    {
        var supabaseUrl = configuration["Supabase:Url"]
            ?? throw new InvalidOperationException("Supabase:Url not configured.");
        var supabaseKey = configuration["Supabase:Key"]
            ?? throw new InvalidOperationException("Supabase:Key not configured.");

        var options = new SupabaseOptions { AutoConnectRealtime = false };
        services.AddScoped<Client>(_ => new Client(supabaseUrl, supabaseKey, options));
    }
}
