import Service from '../models/Service.js';
import Incident from '../models/Incident.js';

export async function getPublicStatus(req, res) {
  try {
    const services = await Service.find({ isActive: true }).select('name currentStatus targetUrlOrHost lastCheckedAt');

    const recentIncidents = await Incident.find()
      .populate('serviceId', 'name')
      .sort({ detectedAt: -1 })
      .limit(20);

    res.json({ services, recentIncidents });
  } catch (err) {
    console.error('Public status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}