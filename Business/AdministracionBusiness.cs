using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class AdministracionBusiness
    {
        private readonly AdministracionDA _da;
        public AdministracionBusiness(AdministracionDA da) { _da = da; }

        public async Task<List<Ciudad>> GetCiudades() => await _da.GetCiudades();
        public async Task<Ciudad?> GetCiudadById(int id) => await _da.GetCiudadById(id);
        public async Task<Ciudad?> CreateCiudad(Ciudad e) => await _da.CreateCiudad(e);
        public async Task<Ciudad?> UpdateCiudad(Ciudad e) => await _da.UpdateCiudad(e);
        public async Task DeleteCiudad(int id) => await _da.DeleteCiudad(id);

        public async Task<List<Marca>> GetMarcas() => await _da.GetMarcas();
        public async Task<Marca?> GetMarcaById(int id) => await _da.GetMarcaById(id);
        public async Task<Marca?> CreateMarca(Marca e) => await _da.CreateMarca(e);
        public async Task<Marca?> UpdateMarca(Marca e) => await _da.UpdateMarca(e);
        public async Task DeleteMarca(int id) => await _da.DeleteMarca(id);

        public async Task<List<Modelo>> GetModelos() => await _da.GetModelos();
        public async Task<Modelo?> GetModeloById(int id) => await _da.GetModeloById(id);
        public async Task<Modelo?> CreateModelo(Modelo e) => await _da.CreateModelo(e);
        public async Task<Modelo?> UpdateModelo(Modelo e) => await _da.UpdateModelo(e);
        public async Task DeleteModelo(int id) => await _da.DeleteModelo(id);

        public async Task<List<Categoria>> GetCategorias() => await _da.GetCategorias();
        public async Task<Categoria?> GetCategoriaById(int id) => await _da.GetCategoriaById(id);
        public async Task<Categoria?> CreateCategoria(Categoria e) => await _da.CreateCategoria(e);
        public async Task<Categoria?> UpdateCategoria(Categoria e) => await _da.UpdateCategoria(e);
        public async Task DeleteCategoria(int id) => await _da.DeleteCategoria(id);

        public async Task<List<Tarifa>> GetTarifas() => await _da.GetTarifas();
        public async Task<Tarifa?> GetTarifaById(int id) => await _da.GetTarifaById(id);
        public async Task<Tarifa?> CreateTarifa(Tarifa e) => await _da.CreateTarifa(e);
        public async Task<Tarifa?> UpdateTarifa(Tarifa e) => await _da.UpdateTarifa(e);
        public async Task DeleteTarifa(int id) => await _da.DeleteTarifa(id);

        public async Task<List<Agencia>> GetAgencias() => await _da.GetAgencias();
        public async Task<Agencia?> GetAgenciaById(int id) => await _da.GetAgenciaById(id);
        public async Task<Agencia?> CreateAgencia(Agencia e) => await _da.CreateAgencia(e);
        public async Task<Agencia?> UpdateAgencia(Agencia e) => await _da.UpdateAgencia(e);
        public async Task DeleteAgencia(int id) => await _da.DeleteAgencia(id);
    }
}
