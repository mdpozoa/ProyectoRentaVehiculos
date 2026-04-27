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
    public class CategoriasController : ControllerBase
    {
        private readonly AdministracionBusiness _business;
        public CategoriasController(AdministracionBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetCategorias());
        [HttpGet("{id}")] public async Task<IActionResult> Get(int id) => Ok(await _business.GetCategoriaById(id));
        [HttpPost] public async Task<IActionResult> Post(Categoria e) => Ok(await _business.CreateCategoria(e));
        [HttpPut] public async Task<IActionResult> Put(Categoria e) => Ok(await _business.UpdateCategoria(e));
        [HttpDelete("{id}")] public async Task<IActionResult> Delete(int id) { await _business.DeleteCategoria(id); return Ok(); }
    }
}
