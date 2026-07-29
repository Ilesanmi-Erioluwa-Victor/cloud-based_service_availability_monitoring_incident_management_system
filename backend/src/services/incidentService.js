import Service from '../models/Service.js';
import Incident from '../models/Incident.js';
import CheckResult from '../models/CheckResult.js';
import { emitServiceStatusChanged, emitIncidentOpened, emitIncidentResolved } from '../sockets/socketHandlers.js';
import { alertService } from './alertService.js';

const FLAPPING_WINDOW_MS = 15 * 60 * 1000;
const FLAPPING_THRESHOLD_COUNT = 3;
const FLAPPING_COOLDOWN_MS = 30 * 60 * 1000;

const flappingCooldowns = new Map();

class IncidentService {
  async processCheckResult(service, success, degraded) {
    const id = service._id.toString();

    if (success && !degraded) {
      service.consecutiveFailureCount = 0;
      service.consecutiveSuccessCount += 1;
    } else {
      service.consecutiveFailureCount += 1;
      service.consecutiveSuccessCount = 0;
    }

    let newStatus = success ? (degraded ? 'degraded' : 'up') : 'down';

    const now = new Date();
    await Service.findByIdAndUpdate(service._id, {
      lastCheckedAt: now,
      currentStatus: newStatus,
      consecutiveFailureCount: service.consecutiveFailureCount,
      consecutiveSuccessCount: service.consecutiveSuccessCount,
    });

    emitServiceStatusChanged(service._id, newStatus);

    if (newStatus === 'down' || newStatus === 'degraded') {
      await this.handleFailure(service);
    } else {
      await this.handleSuccess(service);
    }

    if (newStatus === 'up' || newStatus === 'down' || newStatus === 'degraded') {
      await this.checkFlapping(service);
    }
  }

  async handleFailure(service) {
    if (service.consecutiveFailureCount < service.consecutiveFailuresForIncident) return;

    const existingOpen = await Incident.findOne({
      serviceId: service._id,
      status: { $ne: 'resolved' },
    });

    if (existingOpen) return;

    const incident = await Incident.create({
      serviceId: service._id,
      status: 'open',
      severity: service.severityLevel,
      detectedAt: new Date(),
      timeline: [{
        timestamp: new Date(),
        event: 'opened',
        note: `Service ${service.name} is down after ${service.consecutiveFailuresForIncident} consecutive failures`,
      }],
    });

    emitIncidentOpened(incident);

    try {
      await alertService.sendIncidentAlerts(incident, service);
    } catch (err) {
      console.error('Alert sending failed (non-blocking):', err.message);
    }
  }

  async handleSuccess(service) {
    const openIncident = await Incident.findOne({
      serviceId: service._id,
      status: { $ne: 'resolved' },
    });

    if (!openIncident) return;

    if (service.consecutiveSuccessCount < service.consecutiveSuccessesForResolve) return;

    openIncident.status = 'resolved';
    openIncident.resolvedAt = new Date();
    openIncident.downtimeDurationSeconds = Math.floor(
      (openIncident.resolvedAt - openIncident.detectedAt) / 1000
    );
    openIncident.timeline.push({
      timestamp: openIncident.resolvedAt,
      event: 'resolved',
      note: `Auto-resolved after ${service.consecutiveSuccessesForResolve} consecutive successful checks`,
    });

    await openIncident.save();

    const resolvedSeverity = openIncident.severity;
    const resolvedIncident = openIncident;

    await Service.findByIdAndUpdate(service._id, {
      currentStatus: 'up',
      consecutiveFailureCount: 0,
      consecutiveSuccessCount: 0,
    });

    emitServiceStatusChanged(service._id, 'up');
    emitIncidentResolved(resolvedIncident);
  }

  async checkFlapping(service) {
    const id = service._id.toString();

    const now = Date.now();
    const cooldownUntil = flappingCooldowns.get(id);
    if (cooldownUntil && now < cooldownUntil) return;

    const recentIncidents = await Incident.find({
      serviceId: service._id,
      detectedAt: { $gte: new Date(now - FLAPPING_WINDOW_MS) },
    }).sort({ detectedAt: -1 });

    const recentResolved = recentIncidents.filter(i => i.status === 'resolved');
    const recentFailedChecks = await CheckResult.countDocuments({
      serviceId: service._id,
      checkedAt: { $gte: new Date(now - FLAPPING_WINDOW_MS) },
      success: false,
    });

    if (recentFailedChecks >= 3 && recentResolved.length >= FLAPPING_THRESHOLD_COUNT) {
      await Service.findByIdAndUpdate(service._id, { currentStatus: 'flapping' });
      emitServiceStatusChanged(service._id, 'flapping');

      const existingFlappingIncident = await Incident.findOne({
        serviceId: service._id,
        status: { $ne: 'resolved' },
        'timeline.event': 'opened',
      });

      if (!existingFlappingIncident) {
        const flappingIncident = await Incident.create({
          serviceId: service._id,
          status: 'open',
          severity: service.severityLevel,
          detectedAt: new Date(),
          timeline: [{
            timestamp: new Date(),
            event: 'opened',
            note: `Service is flapping: ${recentResolved.length} incidents resolved within ${FLAPPING_WINDOW_MS / 60000} minutes`,
          }],
        });

        emitIncidentOpened(flappingIncident);
      }

      flappingCooldowns.set(id, now + FLAPPING_COOLDOWN_MS);

      setTimeout(() => {
        flappingCooldowns.delete(id);
        Service.findById(service._id).then(s => {
          if (s && s.currentStatus === 'flapping') {
            Service.findByIdAndUpdate(service._id, { currentStatus: 'unknown' });
            emitServiceStatusChanged(service._id, 'unknown');
          }
        });
      }, FLAPPING_COOLDOWN_MS);
    }
  }
}

export const incidentService = new IncidentService();