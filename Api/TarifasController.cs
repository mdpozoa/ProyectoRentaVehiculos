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
    public class TarifasController : ControllerBase
    {
        private readonly AdministracionBusiness _business;
        public TarifasController(AdministracionBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetTarifas());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetTarifaById(id));
        [HttpPost] public async Task<IActionResult> Post(Tarifa e) => Ok(await _business.CreateTarifa(e));
        [HttpPut] public async Task<IActionResult> Put(Tarifa e) => Ok(await _business.UpdateTarifa(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteTarifa(id); return Ok(); }
    }
}
