import Service from '../models/Service.js';
import Incident from '../models/Incident.js';

export async function getDashboardSummary(req, res) {
  try {
    const services = await Service.find();
    const activeIncidents = await Incident.countDocuments({ status: { $ne: 'resolved' } });

    const summary = {
      totalServices: services.length,
      servicesUp: services.filter(s => s.currentStatus === 'up').length,
      servicesDegraded: services.filter(s => s.currentStatus === 'degraded').length,
      servicesDown: services.filter(s => s.currentStatus === 'down').length,
      servicesFlapping: services.filter(s => s.currentStatus === 'flapping').length,
      servicesMaintenance: services.filter(s => s.currentStatus === 'maintenance').length,
      servicesUnknown: services.filter(s => s.currentStatus === 'unknown').length,
      activeIncidents,
      services: services.map(s => ({
        _id: s._id,
        name: s.name,
        currentStatus: s.currentStatus,
        lastCheckedAt: s.lastCheckedAt,
        targetUrlOrHost: s.targetUrlOrHost,
        checkType: s.checkType,
        severityLevel: s.severityLevel,
      })),
    };

    res.json({ summary });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}