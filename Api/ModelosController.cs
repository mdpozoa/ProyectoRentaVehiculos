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
    public class ModelosController : ControllerBase
    {
        private readonly AdministracionBusiness _business;
        public ModelosController(AdministracionBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetModelos());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetModeloById(id));
        [HttpPost] public async Task<IActionResult> Post(Modelo e) => Ok(await _business.CreateModelo(e));
        [HttpPut] public async Task<IActionResult> Put(Modelo e) => Ok(await _business.UpdateModelo(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteModelo(id); return Ok(); }
    }
}
