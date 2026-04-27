using Supabase;
using System.Threading.Tasks;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class AuthDA
    {
        private readonly Client _supabase;

        public AuthDA(Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<Usuario?> LoginAsync(string user, string pass)
        {
            // 1. Buscar solo por nombre de usuario
            var response = await _supabase.From<Usuario>()
                .Where(x => x.UserUsuario == user)
                .Get();

            var usuario = response.Models.FirstOrDefault();

            // 2. Si no existe el usuario, retornar null
            if (usuario == null) return null;

            // 3. Verificar la contraseña contra el hash guardado
            bool passwordValida = false;
            try
            {
                passwordValida = BCrypt.Net.BCrypt.Verify(pass, usuario.PassUsuario);
            }
            catch (System.Exception)
            {
                // Fallback de seguridad: Si la base de datos tiene la contraseña en texto plano (Admin creado manualmente)
                passwordValida = (pass == usuario.PassUsuario);
            }

            return passwordValida ? usuario : null;
        }
    }
}