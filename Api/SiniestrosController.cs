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
    public class SiniestrosController : ControllerBase
    {
        private readonly AuditoriaBusiness _business;
        public SiniestrosController(AuditoriaBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetSiniestros());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetSiniestroById(id));
        [HttpPost] public async Task<IActionResult> Post(Siniestro e) => Ok(await _business.CreateSiniestro(e));
        [HttpPut] public async Task<IActionResult> Put(Siniestro e) => Ok(await _business.UpdateSiniestro(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteSiniestro(id); return Ok(); }
    }
}
