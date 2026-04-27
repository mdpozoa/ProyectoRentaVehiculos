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
    public class PersonasController : ControllerBase
    {
        private readonly PersonaBusiness _personaBusiness;

        public PersonasController(PersonaBusiness personaBusiness)
        {
            _personaBusiness = personaBusiness;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _personaBusiness.GetAllAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _personaBusiness.GetByIdAsync(id);
            return data != null ? Ok(data) : NotFound();
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] Persona req)
        {
            var data = await _personaBusiness.CreateAsync(req);
            return StatusCode(201, data);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Persona req)
        {
            var data = await _personaBusiness.UpdateAsync(req);
            return Ok(data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _personaBusiness.DeleteAsync(id);
            return NoContent();
        }
    }
}