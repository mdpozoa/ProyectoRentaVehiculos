using Shared.Entities;
using Facturacion.DataAccess;

namespace Facturacion.Business;

public class FacturacionBusiness(FacturacionDA da)
{
    public Task<List<Factura>> GetFacturas()              => da.GetFacturas();
    public Task<Factura?> GetFacturaById(int id)           => da.GetFacturaById(id);
    public Task<Factura?> GetFacturaByContrato(int id)     => da.GetFacturaByContrato(id);
    public async Task<Factura?> CreateFactura(Factura f)
    {
        if (f.SubtotalFactura <= 0) throw new ArgumentException("El subtotal debe ser mayor a 0.");
        f.TotalFactura = f.SubtotalFactura + f.IvaFactura;
        f.FEmisionFactura ??= DateTime.UtcNow;
        return await da.CreateFactura(f);
    }
    public Task<Factura?> UpdateFactura(Factura f)         => da.UpdateFactura(f);
    public Task DeleteFactura(int id)                      => da.DeleteFactura(id);

    public Task<List<DetalleFactura>> GetDetalles()        => da.GetDetalles();
    public Task<List<DetalleFactura>> GetDetallesByFactura(int id) => da.GetDetallesByFactura(id);
    public Task<DetalleFactura?> CreateDetalle(DetalleFactura d)   => da.CreateDetalle(d);
    public Task DeleteDetalle(int id)                      => da.DeleteDetalle(id);

    public Task<List<Pago>> GetPagos()                     => da.GetPagos();
    public Task<Pago?> GetPagoById(int id)                  => da.GetPagoById(id);
    public Task<Pago?> GetPagoByFactura(int id)             => da.GetPagoByFactura(id);
    public async Task<Pago?> CreatePago(Pago p)
    {
        if (p.MontoPago <= 0) throw new ArgumentException("El monto debe ser mayor a 0.");
        p.EstadoPago = "Completado";
        p.FechaPago  ??= DateTime.UtcNow;
        return await da.CreatePago(p);
    }
    public Task<Pago?> UpdatePago(Pago p)                   => da.UpdatePago(p);
    public Task DeletePago(int id)                          => da.DeletePago(id);
}

public class AuditoriaBusiness(AuditoriaDA da)
{
    public Task<List<Auditoria>> GetAuditorias()           => da.GetAuditorias();
    public Task<Auditoria?> CreateAuditoria(Auditoria a)   => da.CreateAuditoria(a);
}
