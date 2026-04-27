using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class AuditoriaBusiness
    {
        private readonly AuditoriaDA _da;
        public AuditoriaBusiness(AuditoriaDA da) { _da = da; }

        public async Task<List<Siniestro>> GetSiniestros() => await _da.GetSiniestros();
        public async Task<Siniestro?> GetSiniestroById(int id) => await _da.GetSiniestroById(id);
        public async Task<Siniestro?> CreateSiniestro(Siniestro e) => await _da.CreateSiniestro(e);
        public async Task<Siniestro?> UpdateSiniestro(Siniestro e) => await _da.UpdateSiniestro(e);
        public async Task DeleteSiniestro(int id) => await _da.DeleteSiniestro(id);

        public async Task<List<Auditoria>> GetAuditorias() => await _da.GetAuditorias();
        public async Task<Auditoria?> CreateAuditoria(Auditoria e) => await _da.CreateAuditoria(e);

        public async Task<List<DetalleFactura>> GetDetalles() => await _da.GetDetalles();
        public async Task<List<DetalleFactura>> GetDetalles(int idFactura) => await _da.GetDetalles(idFactura);
        public async Task<DetalleFactura?> CreateDetalle(DetalleFactura e) => await _da.CreateDetalle(e);
    }
}
