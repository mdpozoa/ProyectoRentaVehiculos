using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class AdministracionDA
    {
        private readonly Client _supabase;
        public AdministracionDA(Client supabase) { _supabase = supabase; }

        // --- CIUDAD ---
        public async Task<List<Ciudad>> GetCiudades() { var r = await _supabase.From<Ciudad>().Get(); return r.Models.ToList(); }
        public async Task<Ciudad?> GetCiudadById(int id) { var r = await _supabase.From<Ciudad>().Where(x => x.IdCiudad == (int?)id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Ciudad?> CreateCiudad(Ciudad e) { e.IdCiudad = null; await _supabase.From<Ciudad>().Insert(e, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal }); var r = await _supabase.From<Ciudad>().Where(x => x.NombreCiudad == e.NombreCiudad).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Ciudad?> UpdateCiudad(Ciudad e) { var r = await _supabase.From<Ciudad>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteCiudad(int id) => await _supabase.From<Ciudad>().Where(x => x.IdCiudad == (int?)id).Delete();

        // --- MARCA ---
        public async Task<List<Marca>> GetMarcas() { var r = await _supabase.From<Marca>().Get(); return r.Models.ToList(); }
        public async Task<Marca?> GetMarcaById(int id) { var r = await _supabase.From<Marca>().Where(x => x.IdMarca == (int?)id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Marca?> CreateMarca(Marca e) { e.IdMarca = null; await _supabase.From<Marca>().Insert(e, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal }); var r = await _supabase.From<Marca>().Where(x => x.NombreMarca == e.NombreMarca).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Marca?> UpdateMarca(Marca e) { var r = await _supabase.From<Marca>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteMarca(int id) => await _supabase.From<Marca>().Where(x => x.IdMarca == (int?)id).Delete();

        // --- MODELO ---
        public async Task<List<Modelo>> GetModelos() { var r = await _supabase.From<Modelo>().Get(); return r.Models.ToList(); }
        public async Task<Modelo?> GetModeloById(int id) { var r = await _supabase.From<Modelo>().Where(x => x.IdModelo == (int?)id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Modelo?> CreateModelo(Modelo e) { e.IdModelo = null; await _supabase.From<Modelo>().Insert(e, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal }); var r = await _supabase.From<Modelo>().Where(x => x.NombreModelo == e.NombreModelo).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Modelo?> UpdateModelo(Modelo e) { var r = await _supabase.From<Modelo>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteModelo(int id) => await _supabase.From<Modelo>().Where(x => x.IdModelo == (int?)id).Delete();

        // --- CATEGORIA ---
        public async Task<List<Categoria>> GetCategorias() { var r = await _supabase.From<Categoria>().Get(); return r.Models.ToList(); }
        public async Task<Categoria?> GetCategoriaById(int id) { var r = await _supabase.From<Categoria>().Where(x => x.IdCategoria == (int?)id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Categoria?> CreateCategoria(Categoria e) { e.IdCategoria = null; await _supabase.From<Categoria>().Insert(e, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal }); var r = await _supabase.From<Categoria>().Where(x => x.NombreCategoria == e.NombreCategoria).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Categoria?> UpdateCategoria(Categoria e) { var r = await _supabase.From<Categoria>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteCategoria(int id) => await _supabase.From<Categoria>().Where(x => x.IdCategoria == (int?)id).Delete();

        // --- TARIFA ---
        public async Task<List<Tarifa>> GetTarifas() { var r = await _supabase.From<Tarifa>().Get(); return r.Models.ToList(); }
        public async Task<Tarifa?> GetTarifaById(int id) { var r = await _supabase.From<Tarifa>().Where(x => x.IdTarifa == (int?)id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Tarifa?> CreateTarifa(Tarifa e) { e.IdTarifa = null; await _supabase.From<Tarifa>().Insert(e, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal }); var r = await _supabase.From<Tarifa>().Where(x => x.IdCategoria == e.IdCategoria).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Tarifa?> UpdateTarifa(Tarifa e) { var r = await _supabase.From<Tarifa>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteTarifa(int id) => await _supabase.From<Tarifa>().Where(x => x.IdTarifa == (int?)id).Delete();

        // --- AGENCIA ---
        public async Task<List<Agencia>> GetAgencias() { var r = await _supabase.From<Agencia>().Get(); return r.Models.ToList(); }
        public async Task<Agencia?> GetAgenciaById(int id) { var r = await _supabase.From<Agencia>().Where(x => x.IdAgencia == (int?)id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Agencia?> CreateAgencia(Agencia e) { e.IdAgencia = null; await _supabase.From<Agencia>().Insert(e, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal }); var r = await _supabase.From<Agencia>().Where(x => x.NombreAgencia == e.NombreAgencia).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Agencia?> UpdateAgencia(Agencia e) { var r = await _supabase.From<Agencia>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteAgencia(int id) => await _supabase.From<Agencia>().Where(x => x.IdAgencia == (int?)id).Delete();
    }
}
