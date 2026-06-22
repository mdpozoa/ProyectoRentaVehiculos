import React, { useEffect, useState } from 'react';
import { getVehiculos, updateVehiculoStatus } from '../api/inventario';
import { connectSocket } from '../socket/socket';
import { AlertTriangle, CheckCircle, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import './FleetManager.css';

export default function FleetManager() {
  const [vehiculos, setVehiculos] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async (pageToFetch) => {
    setIsLoading(true);
    try {
      const response = await getVehiculos(pageToFetch, 10);
      setVehiculos(response.data);
      setMeta(response.meta);
    } catch (e) {
      console.error('Error al cargar vehículos', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
    
    const socket = connectSocket();
    const handleUpdate = () => {
      getVehiculos(page, 10).then(res => {
        setVehiculos(res.data);
        setMeta(res.meta);
      }).catch(console.error);
    };

    socket.on('reserva.created', handleUpdate);
    socket.on('reserva.cancelled', handleUpdate);
    socket.on('vehiculo.actualizado', handleUpdate);

    return () => {
      socket.off('reserva.created', handleUpdate);
      socket.off('reserva.cancelled', handleUpdate);
      socket.off('vehiculo.actualizado', handleUpdate);
    };
  }, [page]);

  const changeStatus = async (vehiculo, newStatus) => {
    if (vehiculo.status === newStatus) return;
    if (!window.confirm(`¿Seguro que deseas cambiar el estado a ${newStatus}?`)) return;

    setActionLoadingId(vehiculo.id);
    try {
      await updateVehiculoStatus(vehiculo.id, newStatus);
      // Actualizar vista
      setVehiculos(vehiculos.map(v => v.id === vehiculo.id ? { ...v, status: newStatus } : v));
    } catch (e) {
      alert('Error al actualizar el estado: ' + (e.response?.data?.message || e.message));
      // Revertir dropdown visual en caso de error
      setVehiculos([...vehiculos]); 
    } finally {
      setActionLoadingId(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const isAvail = status === 'DISPONIBLE';
    return (
      <span className={`status-badge ${isAvail ? 'success' : 'warning'}`}>
        {isAvail ? <CheckCircle size={12} /> : <Wrench size={12} />}
        {status}
      </span>
    );
  };

  return (
    <div className="fleet-page">
      <div className="page-header">
        <h1>Gestión de Flota</h1>
        <p>Administra el estado y disponibilidad de los vehículos (API v2)</p>
      </div>

      <div className="table-container glass-panel">
        {isLoading ? (
          <div className="loading-state">Cargando flota...</div>
        ) : (
          <>
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>Modelo / Año</th>
                  <th>Precio/Día</th>
                  <th>Estado Actual</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div className="v-model">{typeof v.modelo === 'object' ? (v.modelo?.nombre || v.modelo?.id) : v.modelo}</div>
                      <div className="v-year">{v.anio}</div>
                    </td>
                    <td className="v-price">${v.precioDia || v.precioPorDia}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>
                      <select 
                        className="status-select"
                        value={v.status}
                        onChange={(e) => changeStatus(v, e.target.value)}
                        disabled={actionLoadingId === v.id}
                      >
                        <option value="DISPONIBLE">DISPONIBLE</option>
                        <option value="RESERVADO">RESERVADO</option>
                        <option value="EN_USO">EN_USO</option>
                        <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                        <option value="INACTIVO">INACTIVO</option>
                      </select>
                      {actionLoadingId === v.id && <span className="loading-spinner">...</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && (
              <div className="pagination">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)}
                  className="page-btn"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="page-info">Página {meta.page} de {meta.totalPages}</span>
                <button 
                  disabled={page >= meta.totalPages} 
                  onClick={() => setPage(page + 1)}
                  className="page-btn"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
