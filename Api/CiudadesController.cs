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
    public class CiudadesController : ControllerBase
    {
        private readonly AdministracionBusiness _business;
        public CiudadesController(AdministracionBusiness business) { _business = business; }

        [HttpGet, AllowAnonymous] public async Task<IActionResult> GetAll() => Ok(await _business.GetCiudades());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetCiudadById(id));
        [HttpPost] public async Task<IActionResult> Post(Ciudad e) => Ok(await _business.CreateCiudad(e));
        [HttpPut] public async Task<IActionResult> Put(Ciudad e) => Ok(await _business.UpdateCiudad(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteCiudad(id); return Ok(); }
    }
}
