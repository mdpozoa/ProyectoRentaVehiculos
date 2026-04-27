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
    public class AuditoriasController : ControllerBase
    {
        private readonly AuditoriaBusiness _business;
        public AuditoriasController(AuditoriaBusiness business) { _business = business; }

        [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _business.GetAuditorias());
        [HttpPost] public async Task<IActionResult> Post(Auditoria e) => Ok(await _business.CreateAuditoria(e));
    }
}
