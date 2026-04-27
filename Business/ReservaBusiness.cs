using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class ReservaBusiness
    {
        private readonly ReservaDA _reservaDA;
        public ReservaBusiness(ReservaDA reservaDA) { _reservaDA = reservaDA; }

        // ── RESERVA ─────────────────────────────────────────────────────────
        public async Task<List<Reserva>>  GetAllReservas()              => await _reservaDA.GetAllReservas();
        public async Task<Reserva?>       GetReservaById(int id)        => await _reservaDA.GetReservaById(id);
        public async Task<Reserva?>       CreateReserva(Reserva req)    => await _reservaDA.CreateReserva(req);
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
