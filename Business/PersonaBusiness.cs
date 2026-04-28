using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class PersonaBusiness
    {
        private readonly PersonaDA _personaDA;

        public PersonaBusiness(PersonaDA personaDA)
        {
            _personaDA = personaDA;
        }

        public async Task<List<Persona>> GetAllAsync() => await _personaDA.GetAllAsync();
        public async Task<Persona?> GetByIdAsync(int id) => await _personaDA.GetByIdAsync(id);
        public async Task<Persona?> CreateAsync(Persona req)
        {
            if (string.IsNullOrWhiteSpace(req.NombrePersona) || !System.Text.RegularExpressions.Regex.IsMatch(req.NombrePersona, @"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"))
                throw new System.ArgumentException("El nombre solo puede contener letras.");

            if (string.IsNullOrWhiteSpace(req.ApellidoPersona) || !System.Text.RegularExpressions.Regex.IsMatch(req.ApellidoPersona, @"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"))
                throw new System.ArgumentException("El apellido solo puede contener letras.");

            return await _personaDA.CreateAsync(req);
        }
        public async Task<Persona?> UpdateAsync(Persona req) => await _personaDA.UpdateAsync(req);
        public async Task DeleteAsync(int id) => await _personaDA.DeleteAsync(id);
    }
}
