using System.Threading.Tasks;
using System.Collections.Generic;
using ProyectoRentaVehiculos.DataAccess;
using ProyectoRentaVehiculos.Entities;

namespace ProyectoRentaVehiculos.Business
{
    public class MiscBusiness
    {
        private readonly MiscDA _miscDA;
        private readonly ReservaDA _reservaDA;
        private readonly VehiculoDA _vehiculoDA;

        public MiscBusiness(MiscDA miscDA, ReservaDA reservaDA, VehiculoDA vehiculoDA) 
        { 
            _miscDA = miscDA; 
            _reservaDA = reservaDA;
            _vehiculoDA = vehiculoDA;
        }

        // ── FACTURA ─────────────────────────────────────────────────────────
        public async Task<List<Factura>> GetFacturas()        => await _miscDA.GetFacturas();
        public async Task<Factura?>     GetFacturaById(int id) => await _miscDA.GetFacturaById(id);
        public async Task<Factura?>     GetFacturaByContrato(int idContrato) => await _miscDA.GetFacturaByContrato(idContrato);
        
        public async Task<Factura?> CreateFactura(Factura f)
        {
            if (f.SubtotalFactura <= 0) throw new System.Exception("El subtotal debe ser mayor a 0.");
            if (f.IvaFactura < 0) throw new System.Exception("El IVA no puede ser negativo.");
            
            f.TotalFactura = f.SubtotalFactura + f.IvaFactura;
            return await _miscDA.CreateFactura(f);
        }

        public async Task<Factura?>     UpdateFactura(Factura f) => await _miscDA.UpdateFactura(f);
        public async Task               DeleteFactura(int id)    => await _miscDA.DeleteFactura(id);

        // ── KARDEX ──────────────────────────────────────────────────────────
        public async Task<List<Kardex>> GetKardex()           => await _miscDA.GetKardex();
        public async Task<Kardex?>      GetKardexById(int id)  => await _miscDA.GetKardexById(id);
        public async Task<Kardex?>      CreateKardex(Kardex k) => await _miscDA.CreateKardex(k);
        public async Task<Kardex?>      UpdateKardex(Kardex k) => await _miscDA.UpdateKardex(k);
        public async Task               DeleteKardex(int id)   => await _miscDA.DeleteKardex(id);

        // ── PAGO ────────────────────────────────────────────────────────────
        public async Task<List<Pago>> GetPagos()          => await _miscDA.GetPagos();
        public async Task<Pago?>      GetPagoById(int id)  => await _miscDA.GetPagoById(id);
        public async Task<Pago?>      GetPagoByFactura(int idFactura) => await _miscDA.GetPagoByFactura(idFactura);
        
        public async Task<Pago?> CreatePago(Pago p)
        {
            if (p.MontoPago <= 0) throw new System.Exception("El monto del pago debe ser mayor a 0.");

            p.EstadoPago = "Completado";
            var pago = await _miscDA.CreatePago(p);

            if (pago != null)
            {
                var factura = await _miscDA.GetFacturaById(p.IdFactura);
                if (factura != null)
                {
                    var contrato = await _reservaDA.GetContratoById(factura.IdContrato);
                    if (contrato != null)
                    {
                        var reserva = await _reservaDA.GetReservaById(contrato.IdReserva);
                        if (reserva != null)
                        {
                            reserva.EstadoReserva = "Confirmada";
                            await _reservaDA.UpdateReserva(reserva);

                            if (reserva.IdVehiculo.HasValue)
                            {
                                var vehiculo = await _vehiculoDA.GetByIdAsync(reserva.IdVehiculo.Value);
                                if (vehiculo != null)
                                {
                                    vehiculo.EstadoVehiculo = "Rentado";
                                    await _vehiculoDA.UpdateAsync(vehiculo);
                                }
                            }
                        }
                    }
                }
            }
            return pago;
        }

        public async Task<Pago?>      UpdatePago(Pago p)   => await _miscDA.UpdatePago(p);
        public async Task             DeletePago(int id)   => await _miscDA.DeletePago(id);
    }
}
