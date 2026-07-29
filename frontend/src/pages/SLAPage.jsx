import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function SLAPage() {
  const [services, setServices] = useState([]);
  const [slaData, setSlaData] = useState({});
  const [range, setRange] = useState('30d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: svcRes } = await api.get('/services');
        setServices(svcRes.services);

        const slaPromises = svcRes.services.map(s =>
          api.get(`/services/${s._id}/sla?range=${range}`).then(r => ({ id: s._id, ...r.data }))
        );
        const results = await Promise.all(slaPromises);
        const slaMap = {};
        results.forEach(r => { slaMap[r.id] = r; });
        setSlaData(slaMap);
      } catch (err) {
        console.error('Failed to fetch SLA data:', err);
      }
    };
    fetchData();
  }, [range]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SLA Reports</h1>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Period:</span>
        {['24h', '7d', '30d'].map(p => (
          <button key={p} onClick={() => setRange(p)}
            className={`px-3 py-1 rounded text-sm ${range === p ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Successful</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map(service => {
              const sla = slaData[service._id];
              return (
                <tr key={service._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sla?.uptimePercent ?? '-'}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">99.9%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sla ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sla.slaBreached ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {sla.slaBreached ? 'BREACHED' : 'OK'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sla?.totalChecks ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sla?.successfulChecks ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}