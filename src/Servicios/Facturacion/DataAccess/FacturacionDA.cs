using Supabase;
using Shared.Entities;

namespace Facturacion.DataAccess;

public class FacturacionDA(Client supabase)
{
    // FACTURAS
    public async Task<List<Factura>> GetFacturas()                { var r = await supabase.From<Factura>().Get(); return r.Models.ToList(); }
    public async Task<Factura?> GetFacturaById(int id)            { var r = await supabase.From<Factura>().Where(x => x.IdFactura == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Factura?> GetFacturaByContrato(int idC)     { var r = await supabase.From<Factura>().Where(x => x.IdContrato == idC).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Factura?> CreateFactura(Factura f)
    {
        f.IdFactura = null;
        await supabase.From<Factura>().Insert(f);
        var r = await supabase.From<Factura>().Where(x => x.NumeroFactura == f.NumeroFactura).Get();
        return r.Models.FirstOrDefault();
    }
    public async Task<Factura?> UpdateFactura(Factura f)          { var r = await supabase.From<Factura>().Update(f); return r.Models.FirstOrDefault(); }
    public async Task DeleteFactura(int id)                       => await supabase.From<Factura>().Where(x => x.IdFactura == (int?)id).Delete();

    // DETALLE FACTURA
    public async Task<List<DetalleFactura>> GetDetalles()         { var r = await supabase.From<DetalleFactura>().Get(); return r.Models.ToList(); }
    public async Task<List<DetalleFactura>> GetDetallesByFactura(int id) { var r = await supabase.From<DetalleFactura>().Where(x => x.IdFactura == id).Get(); return r.Models.ToList(); }
    public async Task<DetalleFactura?> CreateDetalle(DetalleFactura d){ d.IdDetalle = null; var r = await supabase.From<DetalleFactura>().Insert(d); return r.Models.FirstOrDefault(); }
    public async Task DeleteDetalle(int id)                       => await supabase.From<DetalleFactura>().Where(x => x.IdDetalle == (int?)id).Delete();

    // PAGOS
    public async Task<List<Pago>> GetPagos()                      { var r = await supabase.From<Pago>().Get(); return r.Models.ToList(); }
    public async Task<Pago?> GetPagoById(int id)                  { var r = await supabase.From<Pago>().Where(x => x.IdPago == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Pago?> GetPagoByFactura(int idF)            { var r = await supabase.From<Pago>().Where(x => x.IdFactura == idF).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Pago?> CreatePago(Pago p)
    {
        p.IdPago = null;
        await supabase.From<Pago>().Insert(p);
        var r = await supabase.From<Pago>().Where(x => x.IdFactura == p.IdFactura).Get();
        return r.Models.FirstOrDefault();
    }
    public async Task<Pago?> UpdatePago(Pago p)                   { var r = await supabase.From<Pago>().Update(p); return r.Models.FirstOrDefault(); }
    public async Task DeletePago(int id)                          => await supabase.From<Pago>().Where(x => x.IdPago == (int?)id).Delete();
}

public class AuditoriaDA(Client supabase)
{
    public async Task<List<Auditoria>> GetAuditorias()            { var r = await supabase.From<Auditoria>().Get(); return r.Models.ToList(); }
    public async Task<Auditoria?> CreateAuditoria(Auditoria a)    { a.IdAuditoria = null; a.FechaAuditoria = DateTime.UtcNow; var r = await supabase.From<Auditoria>().Insert(a); return r.Models.FirstOrDefault(); }
}
