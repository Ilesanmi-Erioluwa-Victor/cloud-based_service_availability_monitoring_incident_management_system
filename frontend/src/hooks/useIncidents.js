import { useState, useEffect } from 'react';
import api from '../services/api';

export function useIncidents(filters = {}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.serviceId) params.set('serviceId', filters.serviceId);

      const { data } = await api.get(`/incidents?${params}`);
      setIncidents(data.incidents);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filters.status, filters.serviceId]);

  return { incidents, loading, refetch: fetchIncidents };
}