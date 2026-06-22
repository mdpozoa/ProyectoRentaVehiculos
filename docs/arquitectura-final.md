# ZenithDrive: Documento Final de Arquitectura y Defensa Técnica

## 1. Arquitectura Híbrida Definitiva
El sistema ZenithDrive opera bajo un modelo de arquitectura **Híbrida Event-Driven y gRPC**, diseñada para soportar alta carga, garantizar interoperabilidad y mitigar puntos únicos de fallo.
- **Producción (Cloud):** Se emplea **Azure Container Apps** para un escalado serverless de microservicios, respaldado por **Azure Service Bus** para mensajería y **Azure API Management** o **Nginx Ingress** para ruteo.
- **Desarrollo/On-Premise:** Utiliza **Docker Compose** con una instancia local de **RabbitMQ**, gestionado a través de inyección de dependencias abstractas para evitar acoplamiento fuerte al proveedor de nube.

## 2. Diagrama de Microservicios y Patrones
La plataforma está dividida en módulos de negocio independientes:
1. **API Gateway (Nginx):** Punto de entrada único (Puerto 80). Balancea cargas y maneja el proxy reverso para REST y WebSockets.
2. **Auth Service:** Gestión de JWT y perfiles (Usuarios y Administradores).
3. **Inventario Service:** Gestión del catálogo de vehículos.
4. **Mantenimiento Service:** Supervisa estados mecánicos.
5. **Operaciones Service (Core):** Implementa el **Patrón Saga** para reservas. Orquesta pagos e inventario.
6. **Financiero Service:** Procesamiento de pagos (Stripe/PayPal simulado).
7. **Bus Service (Notificaciones):** Puente WebSocket que traduce eventos de RabbitMQ al frontend móvil y web.

### 2.1 API v2 y HATEOAS
La capa REST ha sido modernizada a `/api/v2/`. Se introdujo **paginación estricta** (limit/page) y enlaces **HATEOAS** para mejorar la descubribilidad de la API por parte de clientes externos.

## 3. Eventos y Contratos (RabbitMQ)
El sistema confía en la comunicación asíncrona para la consistencia eventual. 
**Topics Principales:**
- `reserva.created`: Disparado por *Operaciones*. Capturado por *Financiero* y *Mantenimiento*.
- `pago.processed`: Disparado por *Financiero*. Avanza el estado de la reserva.
- `vehiculo.updated`: Disparado por *Inventario*. Sincroniza la disponibilidad en catálogos de lectura rápida.

## 4. Estrategia de Interoperabilidad
Para consultas de lectura que requieren ultra-baja latencia (ej. "Validar si un vehículo está disponible antes de procesar el pago"), se utiliza **gRPC**.
- Se definieron contratos `.proto` compartidos en `shared/protos`.
- Operaciones llama directamente a Inventario vía `grpc://inventario:50051`.
- Esta vía evita el overhead del protocolo HTTP/1.1 y reduce drásticamente los tiempos de latencia interna.

## 5. Estrategia de Resiliencia (Circuit Breaker y Fallbacks)
Si el servidor gRPC de inventario colapsa, el servicio de Operaciones no falla catastroficamente:
- **Fallback a REST:** Se implementó un enrutador que detecta fallos en la conexión gRPC (`status.UNAVAILABLE`) y automáticamente reintenta la misma consulta mediante una llamada REST a `/api/v2/inventario/vehiculos/:id`.
- **Sagas Compensatorias:** Si el pago falla después de reservar el inventario, un evento de compensación es enviado para liberar el vehículo automáticamente, asegurando consistencia transaccional en bases de datos distribuidas.

## 6. Frontends Consolidados
- **Móvil (React Native/Expo):** Creado para los usuarios finales. Interface premium, consumo eficiente de la API v2 y conexión WebSocket directa a `bus-service`.
- **Administración (React/Vite):** Backoffice administrativo con Glassmorphism. Conexión WebSocket para ver alertas de reservas en tiempo real y gestionar la flota con un solo click.

## 7. Lecciones Aprendidas
1. **Acoplamiento de Tipos:** Manejar librerías asíncronas como `amqplib` en TypeScript requiere definir estrictamente los modelos (`amqplib.ChannelModel` vs `Connection`) para evitar errores en compilación CI/CD.
2. **Dualidad gRPC/REST:** Mantener ambos canales es costoso en desarrollo pero inmensamente valioso en producción para tolerar caídas de red internas.
3. **Persistencia de Eventos:** Los WebSockets sin estado obligan a tener un respaldo; es vital que el cliente recargue el estado inicial por REST antes de empezar a escuchar los eventos delta.
