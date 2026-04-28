using Supabase;
using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.Entities;
using System.Linq;

namespace ProyectoRentaVehiculos.DataAccess
{
    public class FacturacionDA
    {
        private readonly Client _supabase;
        public FacturacionDA(Client supabase) { _supabase = supabase; }

        // ── FACTURA ─────────────────────────────────────────────────────────
        public async Task<List<Factura>> GetFacturas()
        {
            var r = await _supabase.From<Factura>().Get();
            return r.Models.ToList();
        }

        public async Task<Factura?> GetFacturaById(int id)
        {
            var r = await _supabase.From<Factura>().Where(x => x.IdFactura == (int?)id).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Factura?> GetFacturaByContrato(int idContrato)
        {
            var r = await _supabase.From<Factura>().Where(x => x.IdContrato == idContrato).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Factura?> CreateFactura(Factura f)
        {
            f.IdFactura = null;
            await _supabase.From<Factura>().Insert(f, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal });
            var r = await _supabase.From<Factura>().Where(x => x.NumeroFactura == f.NumeroFactura).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Factura?> UpdateFactura(Factura f)
        {
            var r = await _supabase.From<Factura>().Update(f);
            return r.Models.FirstOrDefault();
        }

        public async Task DeleteFactura(int id) =>
            await _supabase.From<Factura>().Where(x => x.IdFactura == (int?)id).Delete();

        // ── KARDEX ──────────────────────────────────────────────────────────
        public async Task<List<Kardex>> GetKardex()
        {
            var r = await _supabase.From<Kardex>().Get();
            return r.Models.ToList();
        }

        public async Task<Kardex?> GetKardexById(int id)
        {
            var r = await _supabase.From<Kardex>().Where(x => x.IdKardex == (int?)id).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Kardex?> CreateKardex(Kardex k)
        {
            k.IdKardex = null;
            await _supabase.From<Kardex>().Insert(k, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal });
            var r = await _supabase.From<Kardex>().Where(x => x.IdVehiculo == k.IdVehiculo).Order("id_kardex", Postgrest.Constants.Ordering.Descending).Limit(1).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Kardex?> UpdateKardex(Kardex k)
        {
            var r = await _supabase.From<Kardex>().Update(k);
            return r.Models.FirstOrDefault();
        }

        public async Task DeleteKardex(int id) =>
            await _supabase.From<Kardex>().Where(x => x.IdKardex == (int?)id).Delete();

        // ── PAGO ────────────────────────────────────────────────────────────
        public async Task<List<Pago>> GetPagos()
        {
            var r = await _supabase.From<Pago>().Get();
            return r.Models.ToList();
        }

        public async Task<Pago?> GetPagoById(int id)
        {
            var r = await _supabase.From<Pago>().Where(x => x.IdPago == (int?)id).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Pago?> GetPagoByFactura(int idFactura)
        {
            var r = await _supabase.From<Pago>().Where(x => x.IdFactura == idFactura).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Pago?> CreatePago(Pago p)
        {
            p.IdPago = null;
            await _supabase.From<Pago>().Insert(p, new Postgrest.QueryOptions { ReturnType = Postgrest.QueryOptions.ReturnType.Minimal });
            var r = await _supabase.From<Pago>().Where(x => x.IdFactura == p.IdFactura).Order("id_pago", Postgrest.Constants.Ordering.Descending).Limit(1).Get();
            return r.Models.FirstOrDefault();
        }

        public async Task<Pago?> UpdatePago(Pago p)
        {
            var r = await _supabase.From<Pago>().Update(p);
            return r.Models.FirstOrDefault();
        }

        public async Task DeletePago(int id) =>
            await _supabase.From<Pago>().Where(x => x.IdPago == (int?)id).Delete();
    }
}
