using Supabase;
using Shared.Entities;
using Shared.DTOs;

namespace CatalogoVehiculos.DataAccess;

/// <summary>Acceso a datos del dominio Catálogo: marca, modelo, categoría, agencia, tarifa, ciudad, kardex.</summary>
public class CatalogoDA(Client supabase)
{
    // --- MARCA ---
    public async Task<List<Marca>> GetMarcas()           { var r = await supabase.From<Marca>().Get(); return r.Models.ToList(); }
    public async Task<Marca?> GetMarcaById(int id)       { var r = await supabase.From<Marca>().Where(x => x.IdMarca == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Marca?> CreateMarca(Marca e)       { e.IdMarca = null; var r = await supabase.From<Marca>().Insert(e); return r.Models.FirstOrDefault(); }
    public async Task<Marca?> UpdateMarca(Marca e)       { var r = await supabase.From<Marca>().Update(e); return r.Models.FirstOrDefault(); }
    public async Task DeleteMarca(int id)                => await supabase.From<Marca>().Where(x => x.IdMarca == (int?)id).Delete();

    // --- MODELO ---
    public async Task<List<Modelo>> GetModelos()         { var r = await supabase.From<Modelo>().Get(); return r.Models.ToList(); }
    public async Task<Modelo?> GetModeloById(int id)     { var r = await supabase.From<Modelo>().Where(x => x.IdModelo == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Modelo?> CreateModelo(Modelo e)    { e.IdModelo = null; var r = await supabase.From<Modelo>().Insert(e); return r.Models.FirstOrDefault(); }
    public async Task<Modelo?> UpdateModelo(Modelo e)    { var r = await supabase.From<Modelo>().Update(e); return r.Models.FirstOrDefault(); }
    public async Task DeleteModelo(int id)               => await supabase.From<Modelo>().Where(x => x.IdModelo == (int?)id).Delete();

    // --- CATEGORIA ---
    public async Task<List<Categoria>> GetCategorias()   { var r = await supabase.From<Categoria>().Get(); return r.Models.ToList(); }
    public async Task<Categoria?> GetCategoriaById(int id){ var r = await supabase.From<Categoria>().Where(x => x.IdCategoria == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Categoria?> CreateCategoria(Categoria e){ e.IdCategoria = null; var r = await supabase.From<Categoria>().Insert(e); return r.Models.FirstOrDefault(); }
    public async Task<Categoria?> UpdateCategoria(Categoria e){ var r = await supabase.From<Categoria>().Update(e); return r.Models.FirstOrDefault(); }
    public async Task DeleteCategoria(int id)            => await supabase.From<Categoria>().Where(x => x.IdCategoria == (int?)id).Delete();

    // --- AGENCIA ---
    public async Task<List<Agencia>> GetAgencias()       { var r = await supabase.From<Agencia>().Get(); return r.Models.ToList(); }
    public async Task<Agencia?> GetAgenciaById(int id)   { var r = await supabase.From<Agencia>().Where(x => x.IdAgencia == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Agencia?> CreateAgencia(Agencia e) { e.IdAgencia = null; var r = await supabase.From<Agencia>().Insert(e); return r.Models.FirstOrDefault(); }
    public async Task<Agencia?> UpdateAgencia(Agencia e) { var r = await supabase.From<Agencia>().Update(e); return r.Models.FirstOrDefault(); }
    public async Task DeleteAgencia(int id)              => await supabase.From<Agencia>().Where(x => x.IdAgencia == (int?)id).Delete();

    // --- TARIFA ---
    public async Task<List<Tarifa>> GetTarifas()         { var r = await supabase.From<Tarifa>().Get(); return r.Models.ToList(); }
    public async Task<Tarifa?> GetTarifaById(int id)     { var r = await supabase.From<Tarifa>().Where(x => x.IdTarifa == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Tarifa?> GetTarifaByCategoria(int idCat) { var r = await supabase.From<Tarifa>().Where(x => x.IdCategoria == idCat).Get(); return r.Models.OrderByDescending(t => t.FVInicioTarifa).FirstOrDefault(); }
    public async Task<Tarifa?> CreateTarifa(Tarifa e)    { e.IdTarifa = null; var r = await supabase.From<Tarifa>().Insert(e); return r.Models.FirstOrDefault(); }
    public async Task<Tarifa?> UpdateTarifa(Tarifa e)    { var r = await supabase.From<Tarifa>().Update(e); return r.Models.FirstOrDefault(); }
    public async Task DeleteTarifa(int id)               => await supabase.From<Tarifa>().Where(x => x.IdTarifa == (int?)id).Delete();

    // --- CIUDAD ---
    public async Task<List<Ciudad>> GetCiudades()        { var r = await supabase.From<Ciudad>().Get(); return r.Models.ToList(); }
    public async Task<Ciudad?> GetCiudadById(int id)     { var r = await supabase.From<Ciudad>().Where(x => x.IdCiudad == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Ciudad?> CreateCiudad(Ciudad e)    { e.IdCiudad = null; var r = await supabase.From<Ciudad>().Insert(e); return r.Models.FirstOrDefault(); }
    public async Task<Ciudad?> UpdateCiudad(Ciudad e)    { var r = await supabase.From<Ciudad>().Update(e); return r.Models.FirstOrDefault(); }
    public async Task DeleteCiudad(int id)               => await supabase.From<Ciudad>().Where(x => x.IdCiudad == (int?)id).Delete();

    // --- KARDEX ---
    public async Task<List<Kardex>> GetKardex()          { var r = await supabase.From<Kardex>().Get(); return r.Models.ToList(); }
    public async Task<List<Kardex>> GetKardexByVehiculo(int idVehiculo) { var r = await supabase.From<Kardex>().Where(x => x.IdVehiculo == idVehiculo).Get(); return r.Models.ToList(); }
    public async Task<Kardex?> CreateKardex(Kardex e)    { e.IdKardex = null; var r = await supabase.From<Kardex>().Insert(e); return r.Models.FirstOrDefault(); }
}
