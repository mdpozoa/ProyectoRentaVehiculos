using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ProyectoRentaVehiculos.Business;

namespace ProyectoRentaVehiculos.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthBusiness _authBusiness;

        public AuthController(AuthBusiness authBusiness)
        {
            _authBusiness = authBusiness;
        }

        public class LoginRequest { public string? User_usuario { get; set; } public string? Pass_usuario { get; set; } }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var (token, rol) = await _authBusiness.Login(req.User_usuario!, req.Pass_usuario!);
                return Ok(new { mensaje = "Login exitoso", token = token, rol = rol });
            }
            catch (System.Exception ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
        }
    }
}
