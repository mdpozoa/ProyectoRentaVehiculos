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
    public class ReservasController : ControllerBase
    {
        private readonly ReservaBusiness _reservaBusiness;
        public ReservasController(ReservaBusiness reservaBusiness) { _reservaBusiness = reservaBusiness; }

        /// <summary>Obtiene todas las reservas.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _reservaBusiness.GetAllReservas();
            return Ok(data);
        }

        /// <summary>Obtiene una reserva por ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _reservaBusiness.GetReservaById(id);
            return data != null ? Ok(data) : NotFound();
        }

        /// <summary>Crea una nueva reserva.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Reserva req)
        {
            try
            {
                var data = await _reservaBusiness.CreateReserva(req);
                if (data == null) return BadRequest(new { error = "No se pudo crear la reserva. Verifique que los IDs de usuario, vehículo y agencia existan." });
                return StatusCode(201, data);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = "Error en base de datos", detalle = ex.Message });
            }
        }

        /// <summary>Actualiza una reserva existente (incluir id_reserva en el body).</summary>
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Reserva req)
        {
            var data = await _reservaBusiness.UpdateReserva(req);
            return Ok(data);
        }

        /// <summary>Elimina una reserva por ID.</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _reservaBusiness.DeleteReserva(id);
            return NoContent();
        }
    }
}
