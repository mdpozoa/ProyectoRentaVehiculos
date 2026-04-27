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
    public class UsuariosController : ControllerBase
    {
        private readonly UsuarioBusiness _usuarioBusiness;

        public UsuariosController(UsuarioBusiness usuarioBusiness)
        {
            _usuarioBusiness = usuarioBusiness;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _usuarioBusiness.GetAllAsync();
            return Ok(data);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] Usuario req)
        {
            try
            {
                var data = await _usuarioBusiness.CreateAsync(req);
                return StatusCode(201, data);
            }
            catch (Exception ex)
            {
                var msg = ex.Message.Contains("42501")
                    ? "Error de permisos en la base de datos (Row Level Security). Contacta al administrador."
                    : ex.Message;
                return StatusCode(500, new { error = msg });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _usuarioBusiness.GetByIdAsync(id);
            return data != null ? Ok(data) : NotFound();
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Usuario req)
        {
            var data = await _usuarioBusiness.UpdateAsync(req);
            return Ok(data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _usuarioBusiness.DeleteAsync(id);
            return NoContent();
        }
    }
}
