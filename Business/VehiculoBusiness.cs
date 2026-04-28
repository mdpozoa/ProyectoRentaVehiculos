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
        public async Task<Vehiculo?> CreateAsync(Vehiculo req)
        {
            ValidarVehiculo(req);
            return await _vehiculoDA.CreateAsync(req);
        }

        public async Task<Vehiculo?> UpdateAsync(Vehiculo req)
        {
            ValidarVehiculo(req);
            return await _vehiculoDA.UpdateAsync(req);
        }

        private void ValidarVehiculo(Vehiculo req)
        {
            if (req.AnioVehiculo < 1900 || req.AnioVehiculo > System.DateTime.Now.Year + 1)
                throw new System.Exception($"El año del vehículo debe estar entre 1900 y {System.DateTime.Now.Year + 1}.");

            if (req.KilometrajeVehiculo < 0)
                throw new System.Exception("El kilometraje no puede ser negativo.");

            req.ColorVehiculo = ValidationsHelper.Capitalizar(req.ColorVehiculo);
            req.PlacaVehiculo = req.PlacaVehiculo?.ToUpper();
            req.CombustibleVehiculo = ValidationsHelper.Capitalizar(req.CombustibleVehiculo);
        }
        public async Task                 DeleteAsync(int id)   => await _vehiculoDA.DeleteAsync(id);
    }
}
