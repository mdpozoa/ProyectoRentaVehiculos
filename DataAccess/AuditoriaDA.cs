using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class AuditoriaDA
    {
        private readonly Client _supabase;
        public AuditoriaDA(Client supabase) { _supabase = supabase; }

        // --- SINIESTRO ---
        public async Task<List<Siniestro>> GetSiniestros() { var r = await _supabase.From<Siniestro>().Get(); return r.Models.ToList(); }
        public async Task<Siniestro?> GetSiniestroById(int id) { var r = await _supabase.From<Siniestro>().Where(x => x.IdSiniestro == id).Get(); return r.Models.FirstOrDefault(); }
        public async Task<Siniestro?> CreateSiniestro(Siniestro e) { var r = await _supabase.From<Siniestro>().Insert(e); return r.Models.FirstOrDefault(); }
        public async Task<Siniestro?> UpdateSiniestro(Siniestro e) { var r = await _supabase.From<Siniestro>().Update(e); return r.Models.FirstOrDefault(); }
        public async Task DeleteSiniestro(int id) => await _supabase.From<Siniestro>().Where(x => x.IdSiniestro == id).Delete();

        // --- AUDITORIA ---
        public async Task<List<Auditoria>> GetAuditorias() { var r = await _supabase.From<Auditoria>().Get(); return r.Models.ToList(); }
        public async Task<Auditoria?> CreateAuditoria(Auditoria e) { var r = await _supabase.From<Auditoria>().Insert(e); return r.Models.FirstOrDefault(); }

        // --- DETALLE FACTURA ---
        public async Task<List<DetalleFactura>> GetDetalles() { var r = await _supabase.From<DetalleFactura>().Get(); return r.Models.ToList(); }
        public async Task<List<DetalleFactura>> GetDetalles(int idFactura) { var r = await _supabase.From<DetalleFactura>().Where(x => x.IdFactura == idFactura).Get(); return r.Models.ToList(); }
        public async Task<DetalleFactura?> CreateDetalle(DetalleFactura e) { var r = await _supabase.From<DetalleFactura>().Insert(e); return r.Models.FirstOrDefault(); }
    }
}
