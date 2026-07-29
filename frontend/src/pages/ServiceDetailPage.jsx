import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import UptimeChart from '../components/UptimeChart';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [checks, setChecks] = useState([]);
  const [sla, setSla] = useState(null);
  const [range, setRange] = useState('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [svcRes, checksRes, slaRes] = await Promise.all([
          api.get('/services'),
          api.get(`/services/${id}/checks?range=${range}`),
          api.get(`/services/${id}/sla?range=${range}`),
        ]);
        const found = svcRes.data.services.find(s => s._id === id);
        setService(found);
        setChecks(checksRes.data.checks);
        setSla(slaRes.data);
      } catch (err) {
        console.error('Failed to fetch service detail:', err);
      }
    };
    fetchData();
  }, [id, range]);

  if (!service) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate('/services')} className="text-blue-600 hover:underline mb-4 block">&larr; Back to Services</button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-500">{service.targetUrlOrHost}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${
            service.currentStatus === 'up' ? 'bg-green-500' :
            service.currentStatus === 'degraded' ? 'bg-yellow-500' :
            service.currentStatus === 'down' ? 'bg-red-500' :
            service.currentStatus === 'flapping' ? 'bg-purple-500' :
            service.currentStatus === 'maintenance' ? 'bg-blue-500' : 'bg-gray-400'
          }`}>
            {service.currentStatus?.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div><span className="text-xs text-gray-500">Type</span><p className="text-sm font-medium">{service.checkType}</p></div>
          <div><span className="text-xs text-gray-500">Interval</span><p className="text-sm font-medium">{service.checkIntervalSeconds}s</p></div>
          <div><span className="text-xs text-gray-500">Severity</span><p className="text-sm font-medium">{service.severityLevel}</p></div>
          <div><span className="text-xs text-gray-500">Failures for Incident</span><p className="text-sm font-medium">{service.consecutiveFailuresForIncident}</p></div>
        </div>
      </div>

      {sla && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">SLA / Uptime</h2>
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm text-gray-500">Period:</span>
            {['24h', '7d', '30d'].map(p => (
              <button key={p} onClick={() => setRange(p)}
                className={`px-3 py-1 rounded text-sm ${range === p ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{sla.uptimePercent}%</div>
              <div className="text-xs text-gray-500">Uptime (check-based)</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className={`text-2xl font-bold ${sla.slaBreached ? 'text-red-600' : 'text-green-600'}`}>
                {sla.slaBreached ? 'BREACHED' : 'OK'}
              </div>
              <div className="text-xs text-gray-500">SLA Status</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-700">{sla.totalChecks}</div>
              <div className="text-xs text-gray-500">Total Checks</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-700">{sla.successfulChecks}</div>
              <div className="text-xs text-gray-500">Successful</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Response Time History</h2>
        <UptimeChart data={checks} dataKey="responseTimeMs" xKey="checkedAt" color="#3B82F6" />
      </div>
    </div>
  );
}