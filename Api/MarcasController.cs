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
    public class MarcasController : ControllerBase
    {
        private readonly AdministracionBusiness _business;
        public MarcasController(AdministracionBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetMarcas());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetMarcaById(id));
        [HttpPost] public async Task<IActionResult> Post(Marca e) => Ok(await _business.CreateMarca(e));
        [HttpPut] public async Task<IActionResult> Put(Marca e) => Ok(await _business.UpdateMarca(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteMarca(id); return Ok(); }
    }
}
