using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class VehiculoBusiness
    {
        private readonly VehiculoDA _vehiculoDA;

        public VehiculoBusiness(VehiculoDA vehiculoDA)
        {
            _vehiculoDA = vehiculoDA;
        }

        public async Task<List<Vehiculo>> GetVehiculosAsync()  => await _vehiculoDA.GetDisponiblesAsync();
        public async Task<Vehiculo?>      GetByIdAsync(int id)  => await _vehiculoDA.GetByIdAsync(id);
        public async Task<Vehiculo?>      CreateAsync(Vehiculo req) => await _vehiculoDA.CreateAsync(req);
        public async Task<Vehiculo?>      UpdateAsync(Vehiculo req) => await _vehiculoDA.UpdateAsync(req);
        public async Task                 DeleteAsync(int id)   => await _vehiculoDA.DeleteAsync(id);
    }
}
