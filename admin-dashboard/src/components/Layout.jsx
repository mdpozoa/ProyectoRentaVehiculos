import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, LogOut, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Layout.css';

export default function Layout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <Car size={32} className="logo" />
          <h2>Zenith<span className="highlight">Admin</span></h2>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/fleet" 
            className={`nav-item ${location.pathname === '/fleet' ? 'active' : ''}`}
          >
            <Car size={20} />
            <span>Flota v2</span>
          </Link>
          <Link 
            to="/clients" 
            className={`nav-item ${location.pathname === '/clients' ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Clientes</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{admin?.email?.charAt(0).toUpperCase()}</div>
            <span className="email">{admin?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
