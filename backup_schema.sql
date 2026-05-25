-- ==========================================
-- BACKUP COMPLETO - PROYECTO RENTA VEHICULOS
-- Generado automáticamente basado en Entidades C# y Lógica de Negocio
-- ==========================================

-- 1. Extensiones y Configuración Inicial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Creación de Tablas

-- Tabla: ciudad
CREATE TABLE public.ciudad (
    id_ciudad SERIAL PRIMARY KEY,
    nombre_ciudad TEXT NOT NULL,
    provincia_ciudad TEXT NOT NULL
);

-- Tabla: marca
CREATE TABLE public.marca (
    id_marca SERIAL PRIMARY KEY,
    nombre_marca TEXT NOT NULL
);

-- Tabla: modelo
CREATE TABLE public.modelo (
    id_modelo SERIAL PRIMARY KEY,
    id_marca INTEGER REFERENCES public.marca(id_marca) ON DELETE CASCADE,
    nombre_modelo TEXT NOT NULL,
    tipo_transmision TEXT NOT NULL -- 'Manual', 'Automática'
);

-- Tabla: categoria
CREATE TABLE public.categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria TEXT NOT NULL,
    descripcion_categoria TEXT
);

-- Tabla: agencia
CREATE TABLE public.agencia (
    id_agencia SERIAL PRIMARY KEY,
    id_ciudad INTEGER REFERENCES public.ciudad(id_ciudad),
    nombre_agencia TEXT NOT NULL,
    direccion_agencia TEXT,
    telefono_agencia TEXT
);

-- Tabla: vehiculo
CREATE TABLE public.vehiculo (
    id_vehiculo SERIAL PRIMARY KEY,
    id_modelo INTEGER REFERENCES public.modelo(id_modelo),
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    id_agencia_actual INTEGER REFERENCES public.agencia(id_agencia),
    placa_vehiculo TEXT UNIQUE NOT NULL,
    color_vehiculo TEXT,
    anio_vehiculo INTEGER,
    kilometraje_vehiculo NUMERIC(12,2) DEFAULT 0,
    combustible_vehiculo TEXT, -- 'Gasolina', 'Diesel', 'Eléctrico'
    estado_vehiculo TEXT DEFAULT 'Disponible',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT vehiculo_estado_check CHECK (estado_vehiculo IN ('Disponible', 'Reservado', 'Rentado', 'Mantenimiento', 'Baja'))
);

-- Tabla: persona
CREATE TABLE public.persona (
    id_persona SERIAL PRIMARY KEY,
    id_ciudad INTEGER REFERENCES public.ciudad(id_ciudad),
    cedula_persona TEXT UNIQUE NOT NULL,
    nombre_persona TEXT NOT NULL,
    apellido_persona TEXT NOT NULL,
    f_nacimiento_persona DATE,
    direccion_persona TEXT,
    telefono_persona TEXT,
    correo_persona TEXT UNIQUE
);

-- Tabla: usuario
CREATE TABLE public.usuario (
    id_usuario SERIAL PRIMARY KEY,
    id_persona INTEGER REFERENCES public.persona(id_persona) ON DELETE CASCADE,
    user_usuario TEXT UNIQUE NOT NULL,
    pass_usuario TEXT NOT NULL,
    rol_usuario TEXT DEFAULT 'Cliente',
    fecha_usuario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT usuario_rol_check CHECK (rol_usuario IN ('Admin', 'Cliente'))
);

-- Tabla: reserva
CREATE TABLE public.reserva (
    id_reserva SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES public.usuario(id_usuario),
    id_vehiculo INTEGER REFERENCES public.vehiculo(id_vehiculo),
    id_agencia INTEGER REFERENCES public.agencia(id_agencia),
    fecha_reserva TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    f_inicio_reserva TIMESTAMP WITH TIME ZONE,
    f_final_reserva TIMESTAMP WITH TIME ZONE,
    estado_reserva TEXT DEFAULT 'Pendiente',
    CONSTRAINT reserva_estado_check CHECK (estado_reserva IN ('Pendiente', 'Confirmada', 'Cancelada', 'Finalizada'))
);

-- Tabla: contrato
CREATE TABLE public.contrato (
    id_contrato SERIAL PRIMARY KEY,
    id_reserva INTEGER REFERENCES public.reserva(id_reserva) ON DELETE CASCADE,
    ter_con_contrato TEXT,
    firma_contrato TEXT
);

-- Tabla: factura
CREATE TABLE public.factura (
    id_factura SERIAL PRIMARY KEY,
    id_contrato INTEGER REFERENCES public.contrato(id_contrato),
    id_usuario INTEGER REFERENCES public.usuario(id_usuario),
    numero_factura TEXT UNIQUE NOT NULL,
    f_emision_factura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subtotal_factura NUMERIC(12,2) NOT NULL,
    iva_factura NUMERIC(12,2) NOT NULL,
    total_factura NUMERIC(12,2) NOT NULL,
    m_pago_factura TEXT -- 'Tarjeta', 'Transferencia', 'Efectivo'
);

-- Tabla: detalle_factura
CREATE TABLE public.detalle_factura (
    id_detalle SERIAL PRIMARY KEY,
    id_factura INTEGER REFERENCES public.factura(id_factura) ON DELETE CASCADE,
    descripcion_detalle TEXT,
    cantidad_detalle INTEGER,
    precio_unitario_detalle NUMERIC(12,2),
    subtotal_detalle NUMERIC(12,2)
);

-- Tabla: pago
CREATE TABLE public.pago (
    id_pago SERIAL PRIMARY KEY,
    id_factura INTEGER REFERENCES public.factura(id_factura),
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    monto_pago NUMERIC(12,2) NOT NULL,
    estado_pago TEXT DEFAULT 'Pendiente',
    CONSTRAINT pago_estado_pago_check CHECK (estado_pago IN ('Pendiente', 'Completado', 'Fallido'))
);

-- Tabla: kardex
CREATE TABLE public.kardex (
    id_kardex SERIAL PRIMARY KEY,
    id_vehiculo INTEGER REFERENCES public.vehiculo(id_vehiculo),
    fecha_movimiento_kardex TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_movimiento_kardex TEXT, -- 'Ingreso', 'Salida', 'Mantenimiento'
    kilometraje_kardex NUMERIC(12,2),
    observaciones_kardex TEXT
);

-- Tabla: siniestro
CREATE TABLE public.siniestro (
    id_siniestro SERIAL PRIMARY KEY,
    id_reserva INTEGER REFERENCES public.reserva(id_reserva),
    id_vehiculo INTEGER REFERENCES public.vehiculo(id_vehiculo),
    fecha_siniestro TIMESTAMP WITH TIME ZONE,
    tipo_siniestro TEXT,
    descripcion_siniestro TEXT,
    monto_estimado NUMERIC(12,2),
    costo_siniestro NUMERIC(12,2)
);

-- Tabla: tarifa
CREATE TABLE public.tarifa (
    id_tarifa SERIAL PRIMARY KEY,
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    v_diario_tarifa NUMERIC(12,2) NOT NULL,
    v_seguro_tarifa NUMERIC(12,2) NOT NULL,
    fv_inicio_tarifa DATE NOT NULL,
    fv_final_tarifa DATE
);

-- Tabla: auditoria
CREATE TABLE public.auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES public.usuario(id_usuario),
    accion_auditoria TEXT NOT NULL,
    fecha_auditoria TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Funciones y Triggers

-- Función para manejar el éxito del pago
CREATE OR REPLACE FUNCTION public.fn_pago_exitoso()
RETURNS TRIGGER AS $$
DECLARE
    v_id_reserva INTEGER;
    v_id_vehiculo INTEGER;
BEGIN
    -- Solo actuar si el pago pasa a 'Completado'
    IF NEW.estado_pago = 'Completado' THEN
        -- 1. Obtener ID de reserva a través de la factura
        SELECT id_reserva INTO v_id_reserva 
        FROM public.factura f
        JOIN public.contrato c ON f.id_contrato = c.id_contrato
        WHERE f.id_factura = NEW.id_factura;

        -- 2. Actualizar Reserva a 'Confirmada'
        UPDATE public.reserva 
        SET estado_reserva = 'Confirmada'
        WHERE id_reserva = v_id_reserva;

        -- 3. Obtener ID de vehículo de la reserva
        SELECT id_vehiculo INTO v_id_vehiculo
        FROM public.reserva
        WHERE id_reserva = v_id_reserva;

        -- 4. Actualizar Vehículo a 'Rentado'
        UPDATE public.vehiculo
        SET estado_vehiculo = 'Rentado'
        WHERE id_vehiculo = v_id_vehiculo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: trg_pago_exitoso
CREATE TRIGGER trg_pago_exitoso
AFTER INSERT OR UPDATE ON public.pago
FOR EACH ROW
EXECUTE FUNCTION public.fn_pago_exitoso();

-- 4. Vistas Útiles (Opcional)
CREATE OR REPLACE VIEW public.vw_vehiculos_detalle AS
SELECT 
    v.id_vehiculo,
    v.placa_vehiculo,
    ma.nombre_marca,
    mo.nombre_modelo,
    c.nombre_categoria,
    v.estado_vehiculo,
    v.color_vehiculo,
    v.anio_vehiculo
FROM public.vehiculo v
JOIN public.modelo mo ON v.id_modelo = mo.id_modelo
JOIN public.marca ma ON mo.id_marca = ma.id_marca
JOIN public.categoria c ON v.id_categoria = c.id_categoria;
