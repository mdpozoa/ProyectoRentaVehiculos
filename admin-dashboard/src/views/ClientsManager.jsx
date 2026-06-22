import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Phone, Loader2, CheckCircle } from 'lucide-react';
import { registerClient } from '../api/auth';
import './ClientsManager.css';

export default function ClientsManager() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    cedula: '',
    telefono: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await registerClient({
        ...formData,
        cedula: formData.cedula || undefined,
        telefono: formData.telefono || undefined
      });
      setSuccess('Cliente registrado exitosamente');
      setFormData({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        cedula: '',
        telefono: ''
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Error al registrar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="clients-manager-container">
      <div className="glass-panel clients-card">
        <div className="clients-header">
          <UserPlus size={40} className="clients-icon" />
          <div>
            <h2>Registro de Nuevo Cliente</h2>
            <p>Agrega un nuevo cliente a la plataforma ZenithDrive</p>
          </div>
        </div>

        {error && <div className="clients-alert error">{error}</div>}
        {success && <div className="clients-alert success"><CheckCircle size={20} /> {success}</div>}

        <form onSubmit={handleSubmit} className="clients-form">
          <div className="form-row">
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                name="nombres"
                placeholder="Nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                name="apellidos"
                placeholder="Apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                name="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                name="cedula"
                placeholder="Cédula (Opcional)"
                value={formData.cedula}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <Phone size={18} className="input-icon" />
              <input 
                type="tel" 
                name="telefono"
                placeholder="Teléfono (Opcional)"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="clients-submit-btn">
            {isLoading ? <Loader2 className="spinner" /> : 'Registrar Cliente'}
          </button>
        </form>
      </div>
    </div>
  );
}
