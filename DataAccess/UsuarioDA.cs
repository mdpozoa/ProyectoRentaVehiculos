using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class UsuarioDA
    {
        private readonly Client _supabase;

        public UsuarioDA(Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<List<Usuario>> GetAllAsync()
        {
            var response = await _supabase.From<Usuario>().Get();
            return response.Models.ToList();
        }

        public async Task<Usuario?> CreateAsync(Usuario usuario)
        {
            // Hashear la contraseña antes de guardar
            usuario.PassUsuario = BCrypt.Net.BCrypt.HashPassword(usuario.PassUsuario);

            var response = await _supabase.From<Usuario>().Insert(usuario);
            return response.Models.FirstOrDefault();
        }

        public async Task<Usuario?> GetByIdAsync(int id)
        {
            var response = await _supabase.From<Usuario>().Where(x => x.IdUsuario == id).Get();
            return response.Models.FirstOrDefault();
        }

        public async Task<Usuario?> UpdateAsync(Usuario usuario)
        {
            // Si viene una contraseña nueva, hashearla antes de actualizar
            if (!string.IsNullOrWhiteSpace(usuario.PassUsuario) &&
                !usuario.PassUsuario.StartsWith("$2"))
            {
                usuario.PassUsuario = BCrypt.Net.BCrypt.HashPassword(usuario.PassUsuario);
            }

            var response = await _supabase.From<Usuario>().Update(usuario);
            return response.Models.FirstOrDefault();
        }

        public async Task DeleteAsync(int id)
        {
            await _supabase.From<Usuario>().Where(x => x.IdUsuario == id).Delete();
        }
    }
}