import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import ServiceCard from '../components/ServiceCard';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const { subscribe } = useSocket();
  const navigate = useNavigate();

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/dashboard/summary');
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    const unsub1 = subscribe('service:status-changed', () => fetchSummary());
    const unsub2 = subscribe('incident:opened', () => fetchSummary());
    const unsub3 = subscribe('incident:resolved', () => fetchSummary());

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [subscribe]);

  if (!summary) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const stats = [
    { label: 'Total Services', value: summary.totalServices, color: 'text-gray-900' },
    { label: 'Up', value: summary.servicesUp, color: 'text-green-600' },
    { label: 'Degraded', value: summary.servicesDegraded, color: 'text-yellow-600' },
    { label: 'Down', value: summary.servicesDown, color: 'text-red-600' },
    { label: 'Flapping', value: summary.servicesFlapping, color: 'text-purple-600' },
    { label: 'Maintenance', value: summary.servicesMaintenance, color: 'text-blue-600' },
    { label: 'Active Incidents', value: summary.activeIncidents, color: 'text-red-700 font-bold' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monitored Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.services.map((service) => (
          <ServiceCard
            key={service._id}
            service={service}
            onClick={(id) => navigate(`/services/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}