import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import AdminLogin from './views/AdminLogin';
import Dashboard from './views/Dashboard';
import FleetManager from './views/FleetManager';
import ClientsManager from './views/ClientsManager';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const initSession = useAuthStore(state => state.initSession);

  useEffect(() => {
    initSession();
  }, [initSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="fleet" element={<FleetManager />} />
          <Route path="clients" element={<ClientsManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
