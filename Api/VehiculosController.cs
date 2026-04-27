using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using ProyectoRentaVehiculos.Entities;
using ProyectoRentaVehiculos.Business;

namespace ProyectoRentaVehiculos.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiculosController : ControllerBase
    {
        private readonly VehiculoBusiness _vehiculoBusiness;

        public VehiculosController(VehiculoBusiness vehiculoBusiness)
        {
            _vehiculoBusiness = vehiculoBusiness;
        }

        /// <summary>Obtiene todos los vehículos.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _vehiculoBusiness.GetVehiculosAsync();
            return Ok(data);
        }

        /// <summary>Obtiene un vehículo por ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _vehiculoBusiness.GetByIdAsync(id);
            return data != null ? Ok(data) : NotFound();
        }

        /// <summary>Crea un nuevo vehículo.</summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] Vehiculo req)
        {
            var data = await _vehiculoBusiness.CreateAsync(req);
            return StatusCode(201, data);
        }

        /// <summary>Actualiza un vehículo existente (incluir id_vehiculo en el body).</summary>
        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Update([FromBody] Vehiculo req)
        {
            var data = await _vehiculoBusiness.UpdateAsync(req);
            return Ok(data);
        }

        /// <summary>Elimina un vehículo por ID.</summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            await _vehiculoBusiness.DeleteAsync(id);
            return NoContent();
        }
    }
}