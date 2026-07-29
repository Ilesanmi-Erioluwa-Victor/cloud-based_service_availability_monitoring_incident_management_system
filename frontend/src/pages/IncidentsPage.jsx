import React, { useState, useEffect } from 'react';
import api from '../services/api';
import IncidentCard from '../components/IncidentCard';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter] = useState('');
  const [acknowledging, setAcknowledging] = useState(null);
  const [resolving, setResolving] = useState(null);

  const fetchIncidents = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/incidents${params}`);
      setIncidents(data.incidents);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  };

  useEffect(() => { fetchIncidents(); }, [filter]);

  const handleAcknowledge = async (id) => {
    setAcknowledging(id);
    try {
      await api.patch(`/incidents/${id}/acknowledge`);
      fetchIncidents();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await api.patch(`/incidents/${id}/resolve`);
      fetchIncidents();
    } catch (err) {
      console.error('Failed to resolve:', err);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Incidents</h1>

      <div className="flex space-x-2 mb-4">
        {['', 'open', 'acknowledged', 'resolved'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm ${filter === f ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {incidents.map(incident => (
          <div key={incident._id} className="relative">
            <IncidentCard incident={incident} />
            {incident.status !== 'resolved' && (
              <div className="mt-2 flex space-x-2">
                {incident.status === 'open' && (
                  <button
                    onClick={() => handleAcknowledge(incident._id)}
                    disabled={acknowledging === incident._id}
                    className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {acknowledging === incident._id ? 'Acknowledging...' : 'Acknowledge'}
                  </button>
                )}
                <button
                  onClick={() => handleResolve(incident._id)}
                  disabled={resolving === incident._id}
                  className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resolving === incident._id ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            )}
          </div>
        ))}
        {incidents.length === 0 && (
          <p className="text-gray-500 text-center py-8">No incidents found</p>
        )}
      </div>
    </div>
  );
}