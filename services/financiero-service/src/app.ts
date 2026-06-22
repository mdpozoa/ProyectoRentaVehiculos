import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createPagoRouter }    from './modules/pagos/pago.routes.js';
import { createFacturaRouter } from './modules/facturas/factura.routes.js';
import { pagoRepository, pagoController, facturaController } from './shared/container.js';
import { createPaymentBookingRouter } from './modules/booking-integration/payment-booking.routes.js';
import { errorHandler } from './shared/errors/error.middleware.js';
import { swaggerSpec } from './shared/swagger.js';
import { startEventConsumer } from './shared/bus/event-consumer.js';
import { startRabbitMQConsumer } from './shared/rabbitmq/rabbitmq-consumer.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'financiero-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Booking integration route
app.use('/api/v1/mateodavid/payment/booking', createPaymentBookingRouter(pagoRepository));

app.use('/api/v1/mateodavid/pagos',    createPagoRouter(pagoController));
app.use('/api/v1/mateodavid/facturas', createFacturaRouter(facturaController));

app.use(errorHandler);

// ── Iniciar consumers de eventos (no bloquean el startup) ──────────────────────
startEventConsumer().catch(err =>
  console.error('[financiero-service] Error arrancando Azure SB consumer:', err),
);
startRabbitMQConsumer().catch(err =>
  console.error('[financiero-service] Error arrancando RabbitMQ consumer:', err),
);

export default app;

