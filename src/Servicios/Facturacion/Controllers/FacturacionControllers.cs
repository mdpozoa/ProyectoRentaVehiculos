using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Shared.DTOs;
using Shared.Entities;
using Facturacion.Business;
using Facturacion.DataAccess;

namespace Facturacion.Controllers;

[ApiController] [Route("api/v1/facturas")] [Authorize]
public class FacturasController(FacturacionBusiness biz) : ControllerBase
{
    [HttpGet]                public async Task<IActionResult> GetAll()               => Ok(ApiResponse<object>.Ok((await biz.GetFacturas())!));
    [HttpGet("{id:int}")]    public async Task<IActionResult> GetById(int id)         { var r = await biz.GetFacturaById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpGet("contrato/{id}")] public async Task<IActionResult> GetByContrato(int id) { var r = await biz.GetFacturaByContrato(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost]               public async Task<IActionResult> Create([FromBody] Factura f) { var r = await biz.CreateFactura(f); return Created($"/api/v1/facturas/{r?.IdFactura}", ApiResponse<object>.Ok(r!)); }
    [HttpPut("{id:int}")]    public async Task<IActionResult> Update(int id, [FromBody] Factura f)  { f.IdFactura = id; var r = await biz.UpdateFactura(f); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("{id:int}")] [Authorize(Policy = "AdminOnly")] public async Task<IActionResult> Delete(int id) { await biz.DeleteFactura(id); return NoContent(); }
}

[ApiController] [Route("api/v1/detalle-factura")] [Authorize]
public class DetalleFacturaController(FacturacionBusiness biz) : ControllerBase
{
    [HttpGet]                 public async Task<IActionResult> GetAll()               => Ok(ApiResponse<object>.Ok((await biz.GetDetalles())!));
    [HttpGet("factura/{id}")] public async Task<IActionResult> GetByFactura(int id)   => Ok(ApiResponse<object>.Ok((await biz.GetDetallesByFactura(id))!));
    [HttpPost]                public async Task<IActionResult> Create([FromBody] DetalleFactura d)  { var r = await biz.CreateDetalle(d); return Ok(ApiResponse<object>.Ok(r!)); }
    [HttpDelete("{id:int}")]  [Authorize(Policy = "AdminOnly")] public async Task<IActionResult> Delete(int id) { await biz.DeleteDetalle(id); return NoContent(); }
}

[ApiController] [Route("api/v1/pagos")] [Authorize]
public class PagosController(FacturacionBusiness biz) : ControllerBase
{
    [HttpGet]                public async Task<IActionResult> GetAll()               => Ok(ApiResponse<object>.Ok((await biz.GetPagos())!));
    [HttpGet("{id:int}")]    public async Task<IActionResult> GetById(int id)         { var r = await biz.GetPagoById(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpGet("factura/{id}")] public async Task<IActionResult> GetByFactura(int id)  { var r = await biz.GetPagoByFactura(id); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpPost]               public async Task<IActionResult> Create([FromBody] Pago p) { var r = await biz.CreatePago(p); return Created($"/api/v1/pagos/{r?.IdPago}", ApiResponse<object>.Ok(r!)); }
    [HttpPut("{id:int}")]    public async Task<IActionResult> Update(int id, [FromBody] Pago p) { p.IdPago = id; var r = await biz.UpdatePago(p); return r == null ? NotFound() : Ok(ApiResponse<object>.Ok(r)); }
    [HttpDelete("{id:int}")] [Authorize(Policy = "AdminOnly")] public async Task<IActionResult> Delete(int id) { await biz.DeletePago(id); return NoContent(); }
}

[ApiController] [Route("api/v1/auditorias")] [Authorize(Policy = "AdminOnly")]
public class AuditoriaController(AuditoriaBusiness biz) : ControllerBase
{
    [HttpGet]  public async Task<IActionResult> GetAll()                             => Ok(ApiResponse<object>.Ok((await biz.GetAuditorias())!));
    [HttpPost] public async Task<IActionResult> Create([FromBody] Auditoria a)        { var r = await biz.CreateAuditoria(a); return Ok(ApiResponse<object>.Ok(r!)); }
}
