import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ServiceCard from '../components/ServiceCard';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: '', ownerTeam: '', checkType: 'http', targetUrlOrHost: '',
    targetPort: '', expectedStatusCodes: '200', checkIntervalSeconds: '60',
    timeoutMs: '10000', responseTimeThresholdMs: '', consecutiveFailuresForIncident: '3',
    consecutiveSuccessesForResolve: '2', severityLevel: 'minor', sslCheckEnabled: false,
    sslExpiryWarningDays: '14',
  });
  const navigate = useNavigate();

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services');
      setServices(data.services);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...form,
        targetPort: form.targetPort ? parseInt(form.targetPort) : null,
        checkIntervalSeconds: parseInt(form.checkIntervalSeconds),
        timeoutMs: parseInt(form.timeoutMs),
        responseTimeThresholdMs: form.responseTimeThresholdMs ? parseInt(form.responseTimeThresholdMs) : null,
        consecutiveFailuresForIncident: parseInt(form.consecutiveFailuresForIncident),
        consecutiveSuccessesForResolve: parseInt(form.consecutiveSuccessesForResolve),
        sslExpiryWarningDays: parseInt(form.sslExpiryWarningDays),
        expectedStatusCodes: form.expectedStatusCodes.split(',').map(s => parseInt(s.trim())),
      };
      await api.post('/services', payload);
      setShowForm(false);
      fetchServices();
    } catch (err) {
      console.error('Failed to create service:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (service) => {
    setToggling(service._id);
    try {
      await api.patch(`/services/${service._id}`, { isActive: !service.isActive });
      fetchServices();
    } catch (err) {
      console.error('Failed to toggle service:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Team</label>
              <input type="text" value={form.ownerTeam} onChange={e => setForm({...form, ownerTeam: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Check Type</label>
              <select value={form.checkType} onChange={e => setForm({...form, checkType: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm">
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="tcp">TCP</option>
                <option value="api_health">API Health</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target URL/Host</label>
              <input type="text" value={form.targetUrlOrHost} onChange={e => setForm({...form, targetUrlOrHost: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Port (TCP only)</label>
              <input type="number" value={form.targetPort} onChange={e => setForm({...form, targetPort: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Status Codes</label>
              <input type="text" value={form.expectedStatusCodes} onChange={e => setForm({...form, expectedStatusCodes: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" placeholder="200,201" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Interval (seconds)</label>
              <input type="number" value={form.checkIntervalSeconds} onChange={e => setForm({...form, checkIntervalSeconds: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Timeout (ms)</label>
              <input type="number" value={form.timeoutMs} onChange={e => setForm({...form, timeoutMs: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Severity Level</label>
              <select value={form.severityLevel} onChange={e => setForm({...form, severityLevel: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm">
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Failures for Incident</label>
              <input type="number" value={form.consecutiveFailuresForIncident} onChange={e => setForm({...form, consecutiveFailuresForIncident: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Successes to Resolve</label>
              <input type="number" value={form.consecutiveSuccessesForResolve} onChange={e => setForm({...form, consecutiveSuccessesForResolve: e.target.value})}
                className="w-full border rounded px-2 py-1 text-sm" />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-4 bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Service'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service._id} className="relative">
            <ServiceCard service={service} onClick={(id) => navigate(`/services/${id}`)} />
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => handleToggleActive(service)}
                disabled={toggling === service._id}
                className={`text-xs px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${service.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
              >
                {toggling === service._id ? '...' : service.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(service._id)}
                disabled={deleting === service._id}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === service._id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}