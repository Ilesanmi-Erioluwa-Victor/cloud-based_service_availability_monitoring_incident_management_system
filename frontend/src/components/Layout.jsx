import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('uptimeguard_token');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-600'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <span className="text-white font-bold text-lg">UptimeGuard</span>
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-2">
                <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                <NavLink to="/services" className={linkClass}>Services</NavLink>
                <NavLink to="/incidents" className={linkClass}>Incidents</NavLink>
                <NavLink to="/sla" className={linkClass}>SLA Reports</NavLink>
              </div>
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-600">Logout</button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden px-3 py-2 rounded-md text-blue-100 hover:bg-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="md:hidden pb-3 space-y-1">
              <NavLink to="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/services" className={linkClass} onClick={() => setMenuOpen(false)}>Services</NavLink>
              <NavLink to="/incidents" className={linkClass} onClick={() => setMenuOpen(false)}>Incidents</NavLink>
              <NavLink to="/sla" className={linkClass} onClick={() => setMenuOpen(false)}>SLA Reports</NavLink>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}