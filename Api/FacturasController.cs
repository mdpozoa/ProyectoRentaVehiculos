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
    public class FacturasController : ControllerBase
    {
        private readonly MiscBusiness _miscBusiness;
        public FacturasController(MiscBusiness miscBusiness) { _miscBusiness = miscBusiness; }

        /// <summary>Obtiene todas las facturas.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _miscBusiness.GetFacturas();
            return Ok(data);
        }

        /// <summary>Obtiene una factura por ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _miscBusiness.GetFacturaById(id);
            return data != null ? Ok(data) : NotFound();
        }

        /// <summary>Crea una nueva factura.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Factura req)
        {
            try {
                // Verificar si ya existe una factura para este contrato
                var existente = await _miscBusiness.GetFacturaByContrato(req.IdContrato);
                if (existente != null) {
                    // Si la factura existente tiene ID=0 (dato corrupto), eliminarla y crear una nueva
                    if (existente.IdFactura == 0) {
                        await _miscBusiness.DeleteFactura(0);
                    } else {
                        return Ok(existente); // Factura válida existente
                    }
                }

                var data = await _miscBusiness.CreateFactura(req);
                return StatusCode(201, data);
            } catch (System.Exception ex) {
                return BadRequest(new { error = "Error al crear factura", detalle = ex.Message });
            }
        }

        /// <summary>Actualiza una factura existente (incluir id_factura en el body).</summary>
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Factura req)
        {
            var data = await _miscBusiness.UpdateFactura(req);
            return Ok(data);
        }

        /// <summary>Elimina una factura por ID.</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _miscBusiness.DeleteFactura(id);
            return NoContent();
        }
    }
}
