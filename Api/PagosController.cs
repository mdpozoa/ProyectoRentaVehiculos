using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using ProyectoRentaVehiculos.Business;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Api
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PagosController : ControllerBase
    {
        private readonly MiscBusiness _miscBusiness;
        public PagosController(MiscBusiness miscBusiness) { _miscBusiness = miscBusiness; }

        /// <summary>Obtiene todos los pagos.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _miscBusiness.GetPagos();
            return Ok(data);
        }

        /// <summary>Obtiene un pago por ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _miscBusiness.GetPagoById(id);
            return data != null ? Ok(data) : NotFound();
        }

        /// <summary>Crea un nuevo pago.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Pago req)
        {
            try {
                // Verificar si ya existe un pago para esta factura
                var existente = await _miscBusiness.GetPagoByFactura(req.IdFactura);
                if (existente != null) {
                    return Ok(existente);
                }

                var data = await _miscBusiness.CreatePago(req);
                return StatusCode(201, data);
            } catch (System.Exception ex) {
                return BadRequest(new { error = "Error al registrar pago", detalle = ex.Message });
            }
        }

        /// <summary>Actualiza un pago existente (incluir id_pago en el body).</summary>
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Pago req)
        {
            var data = await _miscBusiness.UpdatePago(req);
            return Ok(data);
        }

        /// <summary>Elimina un pago por ID.</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _miscBusiness.DeletePago(id);
            return NoContent();
        }
    }
}
