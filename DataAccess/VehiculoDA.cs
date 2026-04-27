using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class VehiculoDA
    {
        private readonly Client _supabase;

        public VehiculoDA(Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<List<Vehiculo>> GetDisponiblesAsync()
        {
            var response = await _supabase.From<Vehiculo>().Get();
            return response.Models.ToList();
        }

        public async Task<Vehiculo?> GetByIdAsync(int id)
        {
            var response = await _supabase.From<Vehiculo>().Where(x => x.IdVehiculo == id).Get();
            return response.Models.FirstOrDefault();
        }

        public async Task<Vehiculo?> CreateAsync(Vehiculo vehiculo)
        {
            var response = await _supabase.From<Vehiculo>().Insert(vehiculo);
            return response.Models.FirstOrDefault();
        }

        public async Task<Vehiculo?> UpdateAsync(Vehiculo vehiculo)
        {
            var response = await _supabase.From<Vehiculo>().Update(vehiculo);
            return response.Models.FirstOrDefault();
        }

        public async Task DeleteAsync(int id)
        {
            await _supabase.From<Vehiculo>().Where(x => x.IdVehiculo == id).Delete();
        }
    }
}
