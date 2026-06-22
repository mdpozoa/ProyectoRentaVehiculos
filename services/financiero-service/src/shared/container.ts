import prisma from './database/prisma.js';
import { PagoRepository }    from '../modules/pagos/pago.repository.js';
import { PagoController }    from '../modules/pagos/pago.controller.js';
import { FacturaRepository } from '../modules/facturas/factura.repository.js';
import { FacturaController } from '../modules/facturas/factura.controller.js';

export const pagoRepository    = new PagoRepository(prisma);
export const facturaRepository = new FacturaRepository(prisma);

export const pagoController    = new PagoController(pagoRepository);
export const facturaController = new FacturaController(facturaRepository);
