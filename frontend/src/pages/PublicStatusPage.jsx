import React, { useEffect, useState } from 'react';
import api from '../services/api';
import IncidentCard from '../components/IncidentCard';

export default function PublicStatusPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get('/public/status');
        setData(res);
      } catch (err) {
        console.error('Failed to fetch public status:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status) => {
    const map = { up: 'bg-green-500', degraded: 'bg-yellow-500', down: 'bg-red-500', flapping: 'bg-purple-500', maintenance: 'bg-blue-500', unknown: 'bg-gray-400' };
    return map[status] || 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-800 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">UptimeGuard</h1>
          <p className="text-blue-200">System Status Overview</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-lg font-semibold mb-4">Service Status</h2>
        <div className="space-y-3 mb-8">
          {data?.services?.map(service => (
            <div key={service._id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-gray-500">{service.targetUrlOrHost}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-3 h-3 rounded-full ${statusColor(service.currentStatus)}`}></span>
                <span className="text-sm font-medium">{service.currentStatus?.toUpperCase()}</span>
                {service.lastCheckedAt && (
                  <span className="text-xs text-gray-400 ml-2">{new Date(service.lastCheckedAt).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">Recent Incidents</h2>
        <div className="space-y-4">
          {data?.recentIncidents?.length > 0 ? (
            data.recentIncidents.map(incident => (
              <IncidentCard key={incident._id} incident={incident} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent incidents</p>
          )}
        </div>
      </div>
    </div>
  );
}