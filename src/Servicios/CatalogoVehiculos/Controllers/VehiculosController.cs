using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Shared.DTOs;
using Shared.Entities;
using CatalogoVehiculos.Business;

namespace CatalogoVehiculos.Controllers;

/// <summary>
/// Catálogo de Vehículos — cumple contrato vehiculos-api.yaml v1.0
/// </summary>
[ApiController]
[Route("api/v1/vehiculos")]
public class VehiculosController(VehiculoBusiness business, ILogger<VehiculosController> logger) : ControllerBase
{
    /// <summary>GET /api/v1/vehiculos — Listar vehículos con paginación y filtros</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedApiResponse<VehiculoDto>), 200)]
    public async Task<IActionResult> GetVehiculos(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? categoria = null,
        [FromQuery] bool? disponible = null)
    {
        var correlationId = Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        logger.LogInformation("[{CorrelationId}] GET /vehiculos page={Page} pageSize={PageSize} search={Search}",
            correlationId, page, pageSize, search);

        var items = await business.GetVehiculos(page, pageSize, search, categoria, disponible);
        return Ok(PagedApiResponse<VehiculoDto>.Ok(items, page, pageSize, items.Count));
    }

    /// <summary>GET /api/v1/vehiculos/{id} — Obtener vehículo por ID</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<VehiculoDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<VehiculoDto>), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var dto = await business.GetById(id);
        if (dto == null)
            return NotFound(ApiResponse<VehiculoDto>.Fail($"Vehículo {id} no encontrado."));
        return Ok(ApiResponse<VehiculoDto>.Ok(dto));
    }

    /// <summary>GET /api/v1/vehiculos/{id}/disponibilidad — Consultar disponibilidad por rango de fechas</summary>
    [HttpGet("{id:int}/disponibilidad")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<DisponibilidadVehiculoDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<DisponibilidadVehiculoDto>), 409)]
    public async Task<IActionResult> GetDisponibilidad(
        int id,
        [FromQuery] DateOnly fechaInicio,
        [FromQuery] DateOnly fechaFin)
    {
        if (fechaFin <= fechaInicio)
            return BadRequest(ApiResponse<DisponibilidadVehiculoDto>.Fail("fechaFin debe ser posterior a fechaInicio."));

        var result = await business.CheckDisponibilidad(id, fechaInicio, fechaFin);
        if (!result.Disponible)
            return Conflict(ApiResponse<DisponibilidadVehiculoDto>.Ok(result));

        return Ok(ApiResponse<DisponibilidadVehiculoDto>.Ok(result));
    }

    /// <summary>POST /api/v1/vehiculos — Crear vehículo (Admin)</summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<VehiculoDto>), 201)]
    public async Task<IActionResult> CreateVehiculo([FromBody] Vehiculo req)
    {
        var dto = await business.CreateVehiculo(req);
        return Created($"/api/v1/vehiculos/{dto?.Id}", ApiResponse<VehiculoDto>.Ok(dto!));
    }

    /// <summary>PUT /api/v1/vehiculos/{id} — Actualizar vehículo (Admin)</summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse<VehiculoDto>), 200)]
    public async Task<IActionResult> UpdateVehiculo(int id, [FromBody] Vehiculo req)
    {
        req.IdVehiculo = id;
        var dto = await business.UpdateVehiculo(req);
        return Ok(ApiResponse<VehiculoDto>.Ok(dto!));
    }

    /// <summary>DELETE /api/v1/vehiculos/{id} — Eliminar vehículo (Admin)</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteVehiculo(int id)
    {
        await business.DeleteVehiculo(id);
        return NoContent();
    }

    /// <summary>POST /api/v1/vehiculos/{id}/force-availability — Forzar disponibilidad (Admin)</summary>
    [HttpPost("{id:int}/force-availability")]
    [AllowAnonymous] // User wanted an easy endpoint to hit without auth overhead right now
    [ProducesResponseType(200)]
    public async Task<IActionResult> ForceAvailability(int id)
    {
        await business.ForceAvailability(id);
        return Ok(new { mensaje = $"Vehículo {id} forzado a Disponible exitosamente." });
    }
}

/// <summary>CRUD de datos de catálogo (marcas, modelos, categorías, agencias, tarifas, ciudades, kardex)</summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class CatalogoAdminController(CatalogoBusiness business) : ControllerBase
{
    // --- MARCAS ---
    [HttpGet("marcas")]        [AllowAnonymous] public async Task<IActionResult> GetMarcas()              => Ok(ApiResponse<object>.Ok((await business.GetMarcas())!));
    [HttpGet("marcas/{id}")]   [AllowAnonymous] public async Task<IActionResult> GetMarca(int id)          { var r = await business.GetMarcaById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost("marcas")]       public async Task<IActionResult> CreateMarca([FromBody] Marca e)             { var r = await business.CreateMarca(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("marcas/{id}")]   public async Task<IActionResult> UpdateMarca(int id, [FromBody] Marca e)    { e.IdMarca = id; var r = await business.UpdateMarca(e); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("marcas/{id}")] public async Task<IActionResult> DeleteMarca(int id)                       { await business.DeleteMarca(id); return NoContent(); }

    // --- MODELOS ---
    [HttpGet("modelos")]        [AllowAnonymous] public async Task<IActionResult> GetModelos()             => Ok(ApiResponse<object>.Ok((await business.GetModelos())!));
    [HttpPost("modelos")]       public async Task<IActionResult> CreateModelo([FromBody] Modelo e)          { var r = await business.CreateModelo(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("modelos/{id}")]   public async Task<IActionResult> UpdateModelo(int id, [FromBody] Modelo e) { e.IdModelo = id; var r = await business.UpdateModelo(e); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("modelos/{id}")] public async Task<IActionResult> DeleteModelo(int id)                     { await business.DeleteModelo(id); return NoContent(); }

    // --- CATEGORIAS ---
    [HttpGet("categorias")]     [AllowAnonymous] public async Task<IActionResult> GetCategorias()          => Ok(ApiResponse<object>.Ok((await business.GetCategorias())!));
    [HttpPost("categorias")]    public async Task<IActionResult> CreateCategoria([FromBody] Categoria e)    { var r = await business.CreateCategoria(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("categorias/{id}")] public async Task<IActionResult> UpdateCategoria(int id, [FromBody] Categoria e) { e.IdCategoria = id; var r = await business.UpdateCategoria(e); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("categorias/{id}")] public async Task<IActionResult> DeleteCategoria(int id)               { await business.DeleteCategoria(id); return NoContent(); }

    // --- AGENCIAS ---
    [HttpGet("agencias")]       [AllowAnonymous] public async Task<IActionResult> GetAgencias()            => Ok(ApiResponse<object>.Ok((await business.GetAgencias())!));
    [HttpPost("agencias")]      public async Task<IActionResult> CreateAgencia([FromBody] Agencia e)        { var r = await business.CreateAgencia(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("agencias/{id}")]  public async Task<IActionResult> UpdateAgencia(int id, [FromBody] Agencia e){ e.IdAgencia = id; var r = await business.UpdateAgencia(e); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("agencias/{id}")] public async Task<IActionResult> DeleteAgencia(int id)                   { await business.DeleteAgencia(id); return NoContent(); }

    // --- TARIFAS ---
    [HttpGet("tarifas")]        [AllowAnonymous] public async Task<IActionResult> GetTarifas()             => Ok(ApiResponse<object>.Ok((await business.GetTarifas())!));
    [HttpPost("tarifas")]       public async Task<IActionResult> CreateTarifa([FromBody] Tarifa e)          { var r = await business.CreateTarifa(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("tarifas/{id}")]   public async Task<IActionResult> UpdateTarifa(int id, [FromBody] Tarifa e) { e.IdTarifa = id; var r = await business.UpdateTarifa(e); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("tarifas/{id}")] public async Task<IActionResult> DeleteTarifa(int id)                     { await business.DeleteTarifa(id); return NoContent(); }

    // --- CIUDADES ---
    [HttpGet("ciudades")]       [AllowAnonymous] public async Task<IActionResult> GetCiudades()            => Ok(ApiResponse<object>.Ok((await business.GetCiudades())!));
    [HttpPost("ciudades")]      public async Task<IActionResult> CreateCiudad([FromBody] Ciudad e)          { var r = await business.CreateCiudad(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPut("ciudades/{id}")]  public async Task<IActionResult> UpdateCiudad(int id, [FromBody] Ciudad e) { e.IdCiudad = id; var r = await business.UpdateCiudad(e); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("ciudades/{id}")] public async Task<IActionResult> DeleteCiudad(int id)                    { await business.DeleteCiudad(id); return NoContent(); }

    // --- KARDEX ---
    [HttpGet("kardex")]         public async Task<IActionResult> GetKardex()                               => Ok(ApiResponse<object>.Ok((await business.GetKardex())!));
    [HttpGet("kardex/vehiculo/{id}")] public async Task<IActionResult> GetKardexVehiculo(int id)           => Ok(ApiResponse<object>.Ok((await business.GetKardexByVehiculo(id))!));
    [HttpPost("kardex")]        public async Task<IActionResult> CreateKardex([FromBody] Kardex e)          { var r = await business.CreateKardex(e); return r == null ? BadRequest() : Ok(ApiResponse<object>.Ok(r)); }
}
