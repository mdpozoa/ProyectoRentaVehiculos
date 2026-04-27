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
    public class ContratosController : ControllerBase
    {
        private readonly ReservaBusiness _reservaBusiness;
        public ContratosController(ReservaBusiness reservaBusiness) { _reservaBusiness = reservaBusiness; }

        /// <summary>Obtiene todos los contratos.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _reservaBusiness.GetAllContratos();
            return Ok(data);
        }

        /// <summary>Obtiene un contrato por ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _reservaBusiness.GetContratoById(id);
            return data != null ? Ok(data) : NotFound();
        }

        /// <summary>Crea un nuevo contrato.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Contrato req)
        {
            try {
                // Verificar si ya existe un contrato para esta reserva
                var existente = await _reservaBusiness.GetContratoByReserva(req.IdReserva);
                if (existente != null) {
                    return Ok(existente); // Si ya existe, devolvemos el existente en lugar de fallar
                }

                var data = await _reservaBusiness.CreateContrato(req);
                return StatusCode(201, data);
            } catch (System.Exception ex) {
                return BadRequest(new { error = "Error al crear contrato", detalle = ex.Message });
            }
        }

        /// <summary>Actualiza un contrato existente (incluir id_contrato en el body).</summary>
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Contrato req)
        {
            var data = await _reservaBusiness.UpdateContrato(req);
            return Ok(data);
        }

        /// <summary>Elimina un contrato por ID.</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _reservaBusiness.DeleteContrato(id);
            return NoContent();
        }
    }
}
