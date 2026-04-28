using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class ReservaBusiness
    {
        private readonly ReservaDA _reservaDA;
        private readonly VehiculoDA _vehiculoDA;

        public ReservaBusiness(ReservaDA reservaDA, VehiculoDA vehiculoDA) 
        { 
            _reservaDA = reservaDA; 
            _vehiculoDA = vehiculoDA;
        }

        // ── RESERVA ─────────────────────────────────────────────────────────
        public async Task<List<Reserva>>  GetAllReservas()              => await _reservaDA.GetAllReservas();
        public async Task<Reserva?>       GetReservaById(int id)        => await _reservaDA.GetReservaById(id);
        
        public async Task<Reserva?> CreateReserva(Reserva req)
        {
            if (req.FInicioReserva.HasValue && req.FInicioReserva.Value.Date < System.DateTime.Now.Date)
                throw new System.Exception("La fecha de inicio de la reserva no puede ser en el pasado.");

            if (req.FInicioReserva.HasValue && req.FFinalReserva.HasValue)
            {
                var dias = (req.FFinalReserva.Value.Date - req.FInicioReserva.Value.Date).TotalDays;
                if (dias <= 0) throw new System.Exception("La fecha final debe ser posterior a la fecha de inicio.");
                if (dias > 7) throw new System.Exception("La renta máxima permitida es de 7 días.");
            }

            var vehiculo = await _vehiculoDA.GetByIdAsync(req.IdVehiculo ?? 0);
            if (vehiculo == null) throw new System.Exception("Vehículo no encontrado.");
            if (vehiculo.EstadoVehiculo != "Disponible") throw new System.Exception("El vehículo no está disponible.");

            req.EstadoReserva = "Pendiente";
            var reserva = await _reservaDA.CreateReserva(req);

            if (reserva != null && vehiculo.IdVehiculo.HasValue)
            {
                vehiculo.EstadoVehiculo = "Reservado";
                await _vehiculoDA.UpdateAsync(vehiculo);
            }

            return reserva;
        }
        public async Task<Reserva?>       UpdateReserva(Reserva req)    => await _reservaDA.UpdateReserva(req);
        public async Task                 DeleteReserva(int id)         => await _reservaDA.DeleteReserva(id);

        // ── CONTRATO ─────────────────────────────────────────────────────────
        public async Task<List<Contrato>> GetAllContratos()             => await _reservaDA.GetAllContratos();
        public async Task<Contrato?>      GetContratoById(int id)       => await _reservaDA.GetContratoById(id);
        public async Task<Contrato?>      GetContratoByReserva(int idReserva) => await _reservaDA.GetContratoByReserva(idReserva);
        public async Task<Contrato?>      CreateContrato(Contrato req)  => await _reservaDA.CreateContrato(req);
        public async Task<Contrato?>      UpdateContrato(Contrato req)  => await _reservaDA.UpdateContrato(req);
        public async Task                 DeleteContrato(int id)        => await _reservaDA.DeleteContrato(id);
    }
}
