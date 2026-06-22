import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;

export const connectSocket = async () => {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem('@auth_token');
  
  socket = io(API_BASE_URL, {
    path: '/ws',
    transports: ['websocket'],
    auth: {
      token
    }
  });

  socket.on('connect', () => {
    console.log('✅ Conectado a WebSocket en', API_BASE_URL);
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado de WebSocket');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
