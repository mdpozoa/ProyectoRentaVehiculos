using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class ReservaDA
    {
        private readonly Client _supabase;
        public ReservaDA(Client supabase) { _supabase = supabase; }

        // ── RESERVA ─────────────────────────────────────────────────────────
        public async Task<List<Reserva>> GetAllReservas()
        {
            var res = await _supabase.From<Reserva>().Get();
            return res.Models.ToList();
        }

        public async Task<Reserva?> GetReservaById(int id)
        {
            var res = await _supabase.From<Reserva>().Where(x => x.IdReserva == id).Get();
            return res.Models.FirstOrDefault();
        }

        public async Task<Reserva?> CreateReserva(Reserva r)
        {
            var res = await _supabase.From<Reserva>().Insert(r);
            return res.Models.FirstOrDefault();
        }

        public async Task<Reserva?> UpdateReserva(Reserva r)
        {
            var res = await _supabase.From<Reserva>().Update(r);
            return res.Models.FirstOrDefault();
        }

        public async Task DeleteReserva(int id) =>
            await _supabase.From<Reserva>().Where(x => x.IdReserva == id).Delete();

        // ── CONTRATO ─────────────────────────────────────────────────────────
        public async Task<List<Contrato>> GetAllContratos()
        {
            var res = await _supabase.From<Contrato>().Get();
            return res.Models.ToList();
        }

        public async Task<Contrato?> GetContratoById(int id)
        {
            var res = await _supabase.From<Contrato>().Where(x => x.IdContrato == id).Get();
            return res.Models.FirstOrDefault();
        }

        public async Task<Contrato?> GetContratoByReserva(int idReserva)
        {
            var res = await _supabase.From<Contrato>().Where(x => x.IdReserva == idReserva).Get();
            return res.Models.FirstOrDefault();
        }

        public async Task<Contrato?> CreateContrato(Contrato c)
        {
            await _supabase.From<Contrato>().Insert(c);
            // Recuperar el registro insertado por clave de negocio para obtener el ID generado
            var res = await _supabase.From<Contrato>().Where(x => x.IdReserva == c.IdReserva).Get();
            return res.Models.FirstOrDefault();
        }

        public async Task<Contrato?> UpdateContrato(Contrato c)
        {
            var res = await _supabase.From<Contrato>().Update(c);
            return res.Models.FirstOrDefault();
        }

        public async Task DeleteContrato(int id) =>
            await _supabase.From<Contrato>().Where(x => x.IdContrato == id).Delete();
    }
}
