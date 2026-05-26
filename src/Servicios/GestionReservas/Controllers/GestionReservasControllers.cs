using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Shared.DTOs;
using Shared.Entities;
using GestionReservas.Business;
using GestionReservas.DataAccess;

namespace GestionReservas.Controllers;

/// <summary>Auth — genera JWT con scopes</summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController(AuthBusiness business) : ControllerBase
{
    public record LoginRequest(string Username, string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var (token, rol, idUsuario) = await business.Login(req.Username, req.Password);
        return Ok(ApiResponse<object>.Ok(new { token, rol, idUsuario }));
    }
}

/// <summary>Reservas — cumple vehiculos-api.yaml: POST, GET, PATCH</summary>
[ApiController]
[Route("api/v1/reservas")]
public class ReservasController(ReservaBusiness business, ILogger<ReservasController> logger) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetReservas([FromQuery] int? userId)
    {
        var list = userId.HasValue
            ? await business.GetByUsuario(userId.Value)
            : await business.GetAll();
        return Ok(ApiResponse<object>.Ok(list!));
    }

    /// <summary>GET /api/v1/reservas/{id}</summary>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ReservaDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetReserva(int id)
    {
        var r = await business.GetById(id);
        if (r == null) return NotFound(ApiResponse<ReservaDto>.Fail($"Reserva {id} no encontrada."));
        var dto = new ReservaDto
        {
            Id         = r.IdReserva.ToString()!,
            Estado     = r.EstadoReserva,
            Total      = 0,
            VehiculoId = r.IdVehiculo.ToString(),
            ClienteId  = r.IdUsuario.ToString(),
            FechaInicio= r.FInicioReserva,
            FechaFin   = r.FFinalReserva
        };
        return Ok(ApiResponse<ReservaDto>.Ok(dto));
    }

    /// <summary>POST /api/v1/reservas — Crear reserva (valida con CatalogoVehiculos)</summary>
    [HttpPost]
    [Authorize(Policy = "ReservasWrite")]
    [ProducesResponseType(typeof(ApiResponse<ReservaDto>), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateReserva([FromBody] ReservaRequestDto dto)
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        var correlationId = Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        logger.LogInformation("[{CorrelationId}] POST /reservas vehiculo={VehiculoId} cliente={ClienteId}",
            correlationId, dto.VehiculoId, dto.ClienteId);

        var reserva = await business.CreateReserva(dto, authHeader);
        var result = new ReservaDto
        {
            Id     = reserva!.IdReserva.ToString()!,
            Estado = reserva.EstadoReserva,
            Total  = 0
        };
        return Created($"/api/v1/reservas/{reserva.IdReserva}", ApiResponse<ReservaDto>.Ok(result));
    }

    /// <summary>PATCH /api/v1/reservas/{id} — Actualizar estado</summary>
    [HttpPatch("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ReservaDto>), 200)]
    public async Task<IActionResult> UpdateEstado(int id, [FromBody] UpdateEstadoDto body)
    {
        var r = await business.UpdateEstado(id, body.Estado);
        return Ok(ApiResponse<ReservaDto>.Ok(new ReservaDto { Id = r!.IdReserva.ToString()!, Estado = r.EstadoReserva, Total = 0 }));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteReserva(int id) { await business.DeleteReserva(id); return NoContent(); }
}

/// <summary>Alquileres y Devoluciones — vehiculos-api.yaml</summary>
[ApiController]
public class AlquileresController(ReservaBusiness business, SiniestroDA siniestroDA) : ControllerBase
{
    /// <summary>POST /api/v1/alquileres — Inicia alquiler (marca reserva como Confirmada)</summary>
    [HttpPost("api/v1/alquileres")]
    [Authorize(Policy = "ReservasWrite")]
    [ProducesResponseType(201)]
    public async Task<IActionResult> CreateAlquiler([FromBody] AlquilerRequestDto dto)
    {
        if (!int.TryParse(dto.ReservaId, out var reservaId))
            return BadRequest(ApiResponse<object>.Fail("reservaId inválido."));

        var reserva = await business.UpdateEstado(reservaId, "Confirmada");
        return Created($"/api/v1/alquileres/{reservaId}", ApiResponse<object>.Ok(new { alquilerId = reservaId, kmSalida = dto.KmSalida, estado = reserva?.EstadoReserva }!));
    }

    /// <summary>POST /api/v1/devoluciones — Registra devolución (marca reserva como Finalizada)</summary>
    [HttpPost("api/v1/devoluciones")]
    [Authorize(Policy = "ReservasWrite")]
    [ProducesResponseType(201)]
    public async Task<IActionResult> CreateDevolucion([FromBody] DevolucionRequestDto dto)
    {
        if (!int.TryParse(dto.AlquilerId, out var reservaId))
            return BadRequest(ApiResponse<object>.Fail("alquilerId inválido."));

        var reserva = await business.UpdateEstado(reservaId, "Finalizada");
        return Created($"/api/v1/devoluciones/{reservaId}", ApiResponse<object>.Ok(new { devolucionId = reservaId, kmEntrada = dto.KmEntrada, cargoExtra = dto.CargoExtra, estado = reserva?.EstadoReserva }!));
    }
}

/// <summary>Personas y Usuarios</summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class PersonasController(PersonaBusiness business) : ControllerBase
{
    [HttpGet]                public async Task<IActionResult> GetAll()              => Ok(ApiResponse<object>.Ok((await business.GetAll())!));
    [HttpGet("{id:int}")]    public async Task<IActionResult> GetById(int id)        { var r = await business.GetById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpGet("cedula/{c}")]  public async Task<IActionResult> GetByCedula(string c)  { var r = await business.GetByCedula(c); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost]               public async Task<IActionResult> Create([FromBody] Persona p) { var r = await business.Create(p); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("{id:int}")]    public async Task<IActionResult> Update(int id, [FromBody] Persona p)  { p.IdPersona = id; var r = await business.Update(p); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id)        { await business.Delete(id); return NoContent(); }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsuariosController(UsuarioBusiness business) : ControllerBase
{
    [HttpGet]                [Authorize(Policy = "AdminOnly")] public async Task<IActionResult> GetAll()   => Ok(ApiResponse<object>.Ok((await business.GetAll())!));
    [HttpGet("{id:int}")]    public async Task<IActionResult> GetById(int id)   { var r = await business.GetById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost]               [AllowAnonymous] public async Task<IActionResult> Create([FromBody] Usuario u)  { var r = await business.Create(u); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("{id:int}")]    public async Task<IActionResult> Update(int id, [FromBody] Usuario u)          { u.IdUsuario = id; var r = await business.Update(u); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("{id:int}")] [Authorize(Policy = "AdminOnly")] public async Task<IActionResult> Delete(int id)  { await business.Delete(id); return NoContent(); }
}

[ApiController]
[Route("api/v1/contratos")]
[Authorize]
public class ContratosController(ReservaBusiness business) : ControllerBase
{
    [HttpGet]                public async Task<IActionResult> GetAll()            => Ok(ApiResponse<object>.Ok((await business.GetContratos())!));
    [HttpGet("{id:int}")]    public async Task<IActionResult> GetById(int id)      { var r = await business.GetContratoById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpGet("reserva/{id}")]public async Task<IActionResult> GetByReserva(int id) { var r = await business.GetContratoByReserva(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost]               public async Task<IActionResult> Create([FromBody] Contrato c)  { var r = await business.CreateContrato(c); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("{id:int}")]    public async Task<IActionResult> Update(int id, [FromBody] Contrato c) { c.IdContrato = id; var r = await business.UpdateContrato(c); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id)      { await business.DeleteContrato(id); return NoContent(); }
}

[ApiController]
[Route("api/v1/siniestros")]
[Authorize]
public class SiniestrosController(SiniestroDA da) : ControllerBase
{
    [HttpGet]               public async Task<IActionResult> GetAll()             => Ok(ApiResponse<object>.Ok((await da.GetAll())!));
    [HttpGet("{id:int}")]   public async Task<IActionResult> GetById(int id)       { var r = await da.GetById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost]              public async Task<IActionResult> Create([FromBody] Siniestro s)   { var r = await da.Create(s); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("{id:int}")]   public async Task<IActionResult> Update(int id, [FromBody] Siniestro s) { s.IdSiniestro = id; var r = await da.Update(s); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id)      { await da.Delete(id); return NoContent(); }
}
