using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class UsuarioBusiness
    {
        private readonly UsuarioDA _usuarioDA;

        public UsuarioBusiness(UsuarioDA usuarioDA)
        {
            _usuarioDA = usuarioDA;
        }

        public async Task<List<Usuario>> GetAllAsync()
        {
            return await _usuarioDA.GetAllAsync();
        }

        public async Task<Usuario?> CreateAsync(Usuario req)
        {
            return await _usuarioDA.CreateAsync(req);
        }
        public async Task<Usuario?> GetByIdAsync(int id) => await _usuarioDA.GetByIdAsync(id);
        public async Task<Usuario?> UpdateAsync(Usuario req) => await _usuarioDA.UpdateAsync(req);
        public async Task DeleteAsync(int id) => await _usuarioDA.DeleteAsync(id);
    }
}
