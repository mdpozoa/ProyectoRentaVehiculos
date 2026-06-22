import { API_BASE_URL } from '../api/client';

let socket = null;
const listeners = {};

export const connectSocket = () => {
  if (socket && socket.readyState === WebSocket.OPEN) return { on: addListener, off: removeListener };

  const token = localStorage.getItem('admin_token');
  
  // Convert http/https to ws/wss
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
  
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('✅ Admin WebSocket Conectado');
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'event' && data.eventType) {
        if (listeners[data.eventType]) {
          listeners[data.eventType].forEach(cb => cb(data.data));
        }
      }
    } catch (e) {
      console.error('WebSocket parse error', e);
    }
  };

  socket.onclose = () => {
    console.log('🔌 Admin WebSocket Desconectado');
    socket = null;
    // Attempt reconnect after 5s
    setTimeout(connectSocket, 5000);
  };

  socket.onerror = (err) => {
    console.error('WebSocket error', err);
  };

  return { on: addListener, off: removeListener };
};

const addListener = (event, callback) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
};

const removeListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
};

export const getSocket = () => ({ on: addListener, off: removeListener });

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};
