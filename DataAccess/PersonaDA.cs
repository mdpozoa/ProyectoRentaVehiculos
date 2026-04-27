using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class PersonaDA
    {
        private readonly Client _supabase;

        public PersonaDA(Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<List<Persona>> GetAllAsync()
        {
            var response = await _supabase.From<Persona>().Get();
            return response.Models.ToList();
        }

        public async Task<Persona?> GetByIdAsync(int id)
        {
            var response = await _supabase.From<Persona>().Where(x => x.IdPersona == id).Get();
            return response.Models.FirstOrDefault();
        }

        public async Task<Persona?> CreateAsync(Persona persona)
        {
            var response = await _supabase.From<Persona>().Insert(persona);
            return response.Models.FirstOrDefault();
        }

        public async Task<Persona?> UpdateAsync(Persona persona)
        {
            var response = await _supabase.From<Persona>().Update(persona);
            return response.Models.FirstOrDefault();
        }

        public async Task DeleteAsync(int id)
        {
            await _supabase.From<Persona>().Where(x => x.IdPersona == id).Delete();
        }
    }
}
