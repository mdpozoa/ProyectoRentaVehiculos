import React, { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '../socket/socket';
import { Bell, Activity, Clock } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('reserva.created', (data) => {
      setEvents(prev => [{
        id: Date.now(),
        type: 'RESERVA_NUEVA',
        message: `Nueva reserva para vehículo: ${data.vehiculoId}`,
        time: new Date().toLocaleTimeString(),
        data
      }, ...prev].slice(0, 50));
    });

    socket.on('reserva.status.updated', (data) => {
      setEvents(prev => [{
        id: Date.now(),
        type: 'ESTADO_ACTUALIZADO',
        message: `Reserva ${data.reservaId} -> ${data.estado}`,
        time: new Date().toLocaleTimeString(),
        data
      }, ...prev].slice(0, 50));
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Monitoreo en Tiempo Real</h1>
        <p>Centro de control operativo ZenithDrive</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-primary">
            <Activity size={24} color="white" />
          </div>
          <div className="stat-info">
            <h3>Eventos Recientes</h3>
            <p className="stat-value">{events.length}</p>
          </div>
        </div>
      </div>

      <div className="events-section glass-panel">
        <div className="section-header">
          <Bell size={20} className="text-primary" />
          <h2>Feed de Operaciones</h2>
        </div>
        
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No hay eventos recientes. Esperando actividad...</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-time">
                  <Clock size={14} /> {event.time}
                </div>
                <div className={`event-badge ${event.type}`}>
                  {event.type.replace('_', ' ')}
                </div>
                <div className="event-message">
                  {event.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
