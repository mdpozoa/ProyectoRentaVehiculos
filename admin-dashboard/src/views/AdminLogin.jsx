import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, Loader2, User, Phone, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { loginAdmin, registerClient } from '../api/auth';
import './AdminLogin.css';

export default function AdminLogin() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: ''
  });

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', nombres: '', apellidos: '', cedula: '', telefono: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        await registerClient({
          ...formData,
          cedula: formData.cedula || undefined,
          telefono: formData.telefono || undefined
        });
        setSuccess('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
        setIsRegistering(false); // Switch to login
        setFormData({ ...formData, password: '' }); // keep email, clear password
      } else {
        const data = await loginAdmin(formData.email, formData.password);
        login(data.usuario, data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className={`glass-panel login-card ${isRegistering ? 'register-mode' : 'login-mode'}`}>
        <div className="login-header">
          <Car size={48} className="logo-icon pulse-animation" />
          <h1>Zenith<span className="highlight">Drive</span></h1>
          <p>{isRegistering ? 'Únete a nuestra plataforma' : 'Bienvenido de vuelta'}</p>
        </div>

        <div className="mode-tabs">
          <button 
            type="button" 
            className={`tab-btn ${!isRegistering ? 'active' : ''}`}
            onClick={() => !isRegistering ? null : toggleMode()}
          >
            <LogIn size={18} /> Iniciar Sesión
          </button>
          <button 
            type="button" 
            className={`tab-btn ${isRegistering ? 'active' : ''}`}
            onClick={() => isRegistering ? null : toggleMode()}
          >
            <UserPlus size={18} /> Registrarse
          </button>
        </div>

        {error && <div className="auth-message error">{error}</div>}
        {success && <div className="auth-message success">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-content">
            
            {/* Campos de Registro */}
            {isRegistering && (
              <div className="register-fields slide-down">
                <div className="form-row">
                  <div className="input-group">
                    <User size={20} className="input-icon" />
                    <input 
                      type="text" 
                      name="nombres"
                      placeholder="Nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      required={isRegistering}
                    />
                  </div>
                  <div className="input-group">
                    <User size={20} className="input-icon" />
                    <input 
                      type="text" 
                      name="apellidos"
                      placeholder="Apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      required={isRegistering}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <User size={20} className="input-icon" />
                    <input 
                      type="text" 
                      name="cedula"
                      placeholder="Cédula (Opcional)"
                      value={formData.cedula}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <Phone size={20} className="input-icon" />
                    <input 
                      type="tel" 
                      name="telefono"
                      placeholder="Teléfono (Opcional)"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos Comunes (Email y Password) */}
            <div className="input-group">
              <Mail size={20} className="input-icon" />
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
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={isRegistering ? 6 : 1}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="login-btn interactive-btn">
            {isLoading ? <Loader2 className="spinner" /> : (isRegistering ? 'Crear Cuenta' : 'Ingresar')}
          </button>
        </form>
      </div>
    </div>
  );
}
