using Supabase;
using Shared.Entities;

namespace CatalogoVehiculos.DataAccess;

/// <summary>Acceso a datos de la tabla vehiculo.</summary>
public class VehiculoDA(Client supabase)
{
    public async Task<List<Vehiculo>> GetAllAsync()
    {
        var r = await supabase.From<Vehiculo>().Where(v => v.EstadoVehiculo == "Disponible").Get();
        return r.Models.ToList();
    }

    public async Task<List<Vehiculo>> GetDisponiblesAsync()
    {
        var r = await supabase.From<Vehiculo>().Where(v => v.EstadoVehiculo == "Disponible").Get();
        return r.Models.ToList();
    }

    public async Task<Vehiculo?> GetByIdAsync(int id)
    {
        var r = await supabase.From<Vehiculo>().Where(v => v.IdVehiculo == (int?)id).Get();
        return r.Models.FirstOrDefault();
    }

    public async Task<Vehiculo?> CreateAsync(Vehiculo v)
    {
        v.IdVehiculo = null;
        var r = await supabase.From<Vehiculo>().Insert(v);
        return r.Models.FirstOrDefault();
    }

    public async Task<Vehiculo?> UpdateAsync(Vehiculo v)
    {
        var r = await supabase.From<Vehiculo>().Update(v);
        return r.Models.FirstOrDefault();
    }

    public async Task DeleteAsync(int id) =>
        await supabase.From<Vehiculo>().Where(v => v.IdVehiculo == (int?)id).Delete();

    public async Task<bool> ExisteConPlacaAsync(string placa)
    {
        var r = await supabase.From<Vehiculo>().Where(v => v.PlacaVehiculo == placa).Get();
        return r.Models.Any();
    }
}
