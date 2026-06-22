import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL pública vía localtunnel - siempre usar esta en desarrollo
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mateobooking.loca.lt';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s para tolerar la latencia del localtunnel
  headers: {
    // Requerido para que localtunnel no bloquee las peticiones
    'bypass-tunnel-reminder': 'true',
  },
});

// Interceptor: inyectar JWT token en cada petición
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignorar error de AsyncStorage
  }
  return config;
});

// Interceptor: manejo global de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'La conexión tardó demasiado. Verifica tu red e intenta de nuevo.';
    } else if (!error.response) {
      error.message = 'No se pudo conectar al servidor. Verifica que el backend esté activo.';
    }
    return Promise.reject(error);
  }
);
