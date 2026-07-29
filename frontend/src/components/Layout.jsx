import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('uptimeguard_token');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-600'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-white font-bold text-lg">UptimeGuard</span>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/services" className={linkClass}>Services</NavLink>
              <NavLink to="/incidents" className={linkClass}>Incidents</NavLink>
              <NavLink to="/sla" className={linkClass}>SLA Reports</NavLink>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}