import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import IncidentsPage from './pages/IncidentsPage';
import SLAPage from './pages/SLAPage';
import PublicStatusPage from './pages/PublicStatusPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('uptimeguard_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/public/status" element={<PublicStatusPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/sla" element={<SLAPage />} />
      </Route>
    </Routes>
  );
}