using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ProyectoRentaVehiculos.Business;
using ProyectoRentaVehiculos.Entities;
using Microsoft.AspNetCore.Authorization;

namespace ProyectoRentaVehiculos.Api
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DetalleFacturaController : ControllerBase
    {
        private readonly AuditoriaBusiness _business;
        public DetalleFacturaController(AuditoriaBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetDetalles());
        [HttpGet("{idFactura}")] public async Task<IActionResult> GetByFactura(int idFactura) => Ok(await _business.GetDetalles(idFactura));
        [HttpPost]
        public async Task<IActionResult> Post(DetalleFactura e)
        {
            try {
                // Verificar si ya existe este detalle para esta factura para evitar duplicidad en reintentos
                var detalles = await _business.GetDetalles(e.IdFactura);
                var existente = detalles.FirstOrDefault(x => x.DescripcionDetalle == e.DescripcionDetalle);
                if (existente != null) return Ok(existente);

                var res = await _business.CreateDetalle(e);
                return Ok(res);
            } catch (System.Exception ex) {
                return BadRequest(new { error = "Error al crear detalle factura", detalle = ex.Message });
            }
        }
    }
}
