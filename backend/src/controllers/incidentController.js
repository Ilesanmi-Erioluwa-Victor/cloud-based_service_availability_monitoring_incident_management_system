import Incident from '../models/Incident.js';
import Service from '../models/Service.js';

export async function listIncidents(req, res) {
  try {
    const { status, serviceId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (serviceId) filter.serviceId = serviceId;

    const incidents = await Incident.find(filter)
      .populate('serviceId', 'name targetUrlOrHost')
      .populate('acknowledgedByUserId', 'name email')
      .sort({ detectedAt: -1 });

    res.json({ incidents });
  } catch (err) {
    console.error('List incidents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function acknowledgeIncident(req, res) {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.status === 'resolved') {
      return res.status(400).json({ error: 'Cannot acknowledge a resolved incident' });
    }

    incident.status = 'acknowledged';
    incident.acknowledgedAt = new Date();
    incident.acknowledgedByUserId = req.user._id;
    incident.timeline.push({
      timestamp: new Date(),
      event: 'acknowledged',
      note: `Acknowledged by ${req.user.name}`,
      byUserId: req.user._id,
    });

    await incident.save();
    res.json({ incident });
  } catch (err) {
    console.error('Acknowledge incident error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resolveIncident(req, res) {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.status === 'resolved') {
      return res.status(400).json({ error: 'Incident already resolved' });
    }

    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    incident.downtimeDurationSeconds = Math.floor((incident.resolvedAt - incident.detectedAt) / 1000);
    incident.timeline.push({
      timestamp: incident.resolvedAt,
      event: 'resolved',
      note: `Manually resolved by ${req.user.name}`,
      byUserId: req.user._id,
    });

    await incident.save();

    await Service.findByIdAndUpdate(incident.serviceId, {
      currentStatus: 'up',
      consecutiveFailureCount: 0,
    });

    res.json({ incident });
  } catch (err) {
    console.error('Resolve incident error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRootCause(req, res) {
  try {
    const { id } = req.params;
    const { rootCauseNote } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      id,
      { rootCauseNote },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json({ incident });
  } catch (err) {
    console.error('Update root cause error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}