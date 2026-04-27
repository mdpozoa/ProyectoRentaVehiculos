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
    public class AgenciasController : ControllerBase
    {
        private readonly AdministracionBusiness _business;
        public AgenciasController(AdministracionBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetAgencias());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetAgenciaById(id));
        [HttpPost] public async Task<IActionResult> Post(Agencia e) => Ok(await _business.CreateAgencia(e));
        [HttpPut] public async Task<IActionResult> Put(Agencia e) => Ok(await _business.UpdateAgencia(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteAgencia(id); return Ok(); }
    }
}
