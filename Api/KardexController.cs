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
    public class KardexController : ControllerBase
    {
        private readonly MiscBusiness _miscBusiness;
        public KardexController(MiscBusiness miscBusiness) { _miscBusiness = miscBusiness; }

        /// <summary>Obtiene todos los registros de kardex.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _miscBusiness.GetKardex();
            return Ok(data);
        }

        /// <summary>Obtiene un registro de kardex por ID.</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _miscBusiness.GetKardexById(id);
            return data != null ? Ok(data) : NotFound();
        }

        /// <summary>Crea un nuevo registro de kardex.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Kardex req)
        {
            var data = await _miscBusiness.CreateKardex(req);
            return StatusCode(201, data);
        }

        /// <summary>Actualiza un registro de kardex (incluir id_kardex en el body).</summary>
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Kardex req)
        {
            var data = await _miscBusiness.UpdateKardex(req);
            return Ok(data);
        }

        /// <summary>Elimina un registro de kardex por ID.</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _miscBusiness.DeleteKardex(id);
            return NoContent();
        }
    }
}
