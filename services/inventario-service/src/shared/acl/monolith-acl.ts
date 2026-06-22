/**
 * MonolithACL — Anti-Corruption Layer para el monolito legado (Railway/Supabase).
 *
 * Centraliza TODAS las llamadas al sistema legado:
 *   - Un solo punto de configuración (env vars)
 *   - Caché en memoria con TTL para reducir llamadas HTTP
 *   - Manejo de errores con fallback controlado
 *   - Mapeo explícito del modelo de datos del monolito al dominio propio
 */

import 'dotenv/config';

// ── Configuración desde variables de entorno ─────────────────────────────────
const MONOLITH_URL     = process.env['MONOLITH_URL']      ?? 'https://scintillating-warmth-production-d1f6.up.railway.app/api';
const FRONTEND_BASE    = process.env['FRONTEND_URL']       ?? 'https://nginx-frontend.ambitiousforest-4fd0ab3a.eastus.azurecontainerapps.io';
const SUPABASE_URL     = process.env['SUPABASE_MONOLITH_URL'] ?? 'https://mzgggdprufdvpzybpctv.supabase.co';
const SUPABASE_KEY     = process.env['SUPABASE_MONOLITH_KEY'] ?? '';
const CACHE_TTL_MS     = Number(process.env['MONOLITH_CACHE_TTL_MS'] ?? '60000'); // 60 seg por defecto
const REQUEST_TIMEOUT  = Number(process.env['MONOLITH_TIMEOUT_MS']   ?? '8000');  // 8 seg

// ── Tipos del dominio del monolito (Anti-Corruption: nunca salen de esta clase) ─
interface MonolithVehiculo {
  ID_Vehiculo:     number;
  ID_Modelo:       number;
  ID_Categoria:    number;
  ID_Agencia_Actual: number | null;
  Placa_Vehiculo:  string;
  Color_Vehiculo:  string;
  Anio_Vehiculo:   number;
  Combustible_Vehiculo: string;
  Estado_Vehiculo: string;
}

interface MonolithModelo  { ID_Modelo: number; ID_Marca: number; Nombre_Modelo: string; }
interface MonolithMarca   { ID_Marca:  number; Nombre_Marca:  string; }
interface MonolithCategoria { ID_Categoria: number; Nombre_Categoria: string; }

// ── Tipo del dominio propio ───────────────────────────────────────────────────
export interface VehiculoDto {
  id:          string;
  nombre:      string;
  descripcion: string;
  precioPorDia: number;
  moneda:      string;
  categoria:   string | null;
  agenciaId:   string | null;
  disponible:  boolean;
  status:      string;
  imagenUrl:   string;
}

// ── Caché en memoria ──────────────────────────────────────────────────────────
interface CacheEntry<T> { data: T; expiresAt: number; }
const cache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Fetch con timeout ─────────────────────────────────────────────────────────
async function fetchMonolith<T>(endpoint: string): Promise<T> {
  const cacheKey = endpoint;
  const cached = getFromCache<T>(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${MONOLITH_URL}${endpoint}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Monolith ${endpoint}: HTTP ${res.status}`);
    const data = await res.json() as T;
    setInCache(cacheKey, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ── Resolución de imagen (basada en color + año + placa) ──────────────────────
function resolveImageUrl(color: string, anio: number, placa: string): string {
  const c = (color || '').toLowerCase().trim();

  let file: string | null = null;

  if      (c.includes('amarillo'))                        file = 'SparkAmarillo2018.png';
  else if (c.includes('blanco'))                          file = 'SparkBlanco2017.png';
  else if (c.includes('morado'))                          file = 'SparkMorado2020.png';
  else if (c.includes('negro'))                           file = 'SparkNegro2025.png';
  else if (c.includes('vino') || c.includes('bordo'))     file = 'SparkVino2015.png';
  else if (c.includes('rojo') || c.includes('red')) {
    file = anio <= 2015 ? 'SparkRojo2015.png' : anio <= 2018 ? 'SparkRojo2018.png' : 'SparkRojo2024.png';
  } else if (c.includes('verde') || c.includes('green')) {
    file = anio <= 2016 ? 'SparkVerde2016.png' : 'SparkVerde2022.png';
  }

  if (!file) {
    const digits  = placa.replace(/\D/g, '');
    const idx     = digits.length > 0 ? parseInt(digits[digits.length - 1]!) % 10 : 0;
    const fallbacks = [
      'SparkRojo2018.png',  'SparkVerde2022.png', 'SparkNegro2025.png',
      'SparkBlanco2017.png','SparkAmarillo2018.png','SparkRojo2015.png',
      'SparkMorado2020.png','SparkVerde2016.png',  'SparkRojo2024.png', 'SparkVino2015.png',
    ];
    file = fallbacks[idx] ?? 'SparkRojo2018.png';
  }

  return `${FRONTEND_BASE}/fotos_vehiculos/${file}`;
}

// ── Mapeo de dominio monolito → dominio propio ────────────────────────────────
function mapVehiculo(
  v:         MonolithVehiculo,
  modelos:   MonolithModelo[],
  marcas:    MonolithMarca[],
  categorias: MonolithCategoria[],
): VehiculoDto {
  const modelo    = modelos.find(m => m.ID_Modelo === v.ID_Modelo);
  const marca     = modelo ? marcas.find(ma => ma.ID_Marca === modelo.ID_Marca) : null;
  const categoria = categorias.find(c => c.ID_Categoria === v.ID_Categoria);

  const precioPorDia = Number(process.env['DEFAULT_PRECIO_DIA'] ?? 45);

  return {
    id:          v.ID_Vehiculo.toString(),
    nombre:      `${marca?.Nombre_Marca ?? ''} ${modelo?.Nombre_Modelo ?? ''} ${v.Anio_Vehiculo}`.trim(),
    descripcion: `Color: ${v.Color_Vehiculo} | Combustible: ${v.Combustible_Vehiculo} | Placa: ${v.Placa_Vehiculo}`,
    precioPorDia,
    moneda:      'USD',
    categoria:   categoria?.Nombre_Categoria ?? null,
    agenciaId:   v.ID_Agencia_Actual ? v.ID_Agencia_Actual.toString() : null,
    disponible:  v.Estado_Vehiculo === 'Disponible',
    status:      v.Estado_Vehiculo,
    imagenUrl:   resolveImageUrl(v.Color_Vehiculo, v.Anio_Vehiculo, v.Placa_Vehiculo),
  };
}

// ── Carga de catálogos en paralelo ────────────────────────────────────────────
async function fetchCatalogos() {
  const [modelos, categorias, marcas] = await Promise.all([
    fetchMonolith<MonolithModelo[]>('/Modelos').catch(e => { console.warn('Modelos fallback:', e.message); return [] as MonolithModelo[]; }),
    fetchMonolith<MonolithCategoria[]>('/Categorias').catch(e => { console.warn('Categorias fallback:', e.message); return [] as MonolithCategoria[]; }),
    fetchMonolith<MonolithMarca[]>('/Marcas').catch(e => { console.warn('Marcas fallback:', e.message); return [] as MonolithMarca[]; }),
  ]);
  return { modelos, categorias, marcas };
}

// ── API pública de la ACL ─────────────────────────────────────────────────────

/** Lista todos los vehículos disponibles del monolito. */
export async function listVehiculos(soloDisponibles = true): Promise<VehiculoDto[]> {
  const [vehiculos, { modelos, categorias, marcas }] = await Promise.all([
    fetchMonolith<MonolithVehiculo[]>('/Vehiculos'),
    fetchCatalogos(),
  ]);

  const mapped = vehiculos.map(v => mapVehiculo(v, modelos, marcas, categorias));
  return soloDisponibles ? mapped.filter(v => v.disponible) : mapped;
}

/** Obtiene un vehículo por su ID numérico del monolito. */
export async function getVehiculo(id: string): Promise<VehiculoDto | null> {
  const [vehiculos, { modelos, categorias, marcas }] = await Promise.all([
    fetchMonolith<MonolithVehiculo[]>('/Vehiculos'),
    fetchCatalogos(),
  ]);

  const v = vehiculos.find(v => v.ID_Vehiculo.toString() === id);
  if (!v) return null;
  return mapVehiculo(v, modelos, marcas, categorias);
}

/** Actualiza el estado de un vehículo en el monolito vía Supabase REST. */
export async function updateVehiculoStatus(
  vehiculoId: string,
  nuevoStatus: 'DISPONIBLE' | 'RESERVADO' | 'EN_USO' | 'INACTIVO',
): Promise<{ success: boolean; estadoMonolith: string }> {
  const statusMap: Record<string, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO:  'Reservado',
    EN_USO:     'Reservado',
    INACTIVO:   'Reservado',
  };

  const estadoMonolith = statusMap[nuevoStatus] ?? 'Disponible';

  if (!SUPABASE_KEY) {
    console.warn('[MonolithACL] SUPABASE_MONOLITH_KEY no configurado — omitiendo sync de estado');
    return { success: false, estadoMonolith };
  }

  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), 6_000);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehiculo?id_vehiculo=eq.${vehiculoId}`,
      {
        method:  'PATCH',
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body:   JSON.stringify({ estado_vehiculo: estadoMonolith }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`[MonolithACL] Error updating vehicle ${vehiculoId}:`, err);
      return { success: false, estadoMonolith };
    }

    // Invalidar caché de vehículos al cambiar estado
    cache.delete('/Vehiculos');

    return { success: true, estadoMonolith };
  } catch (err: any) {
    console.error(`[MonolithACL] Timeout/error updating vehicle ${vehiculoId}:`, err?.message);
    return { success: false, estadoMonolith };
  } finally {
    clearTimeout(timer);
  }
}

/** Limpia la caché manualmente (útil en tests o admin endpoints). */
export function clearMonolithCache(): void {
  cache.clear();
  console.log('[MonolithACL] Caché vaciada');
}
