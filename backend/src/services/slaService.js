import CheckResult from '../models/CheckResult.js';
import Incident from '../models/Incident.js';
import Service from '../models/Service.js';

export async function calculateUptime(serviceId, startDate, endDate = new Date()) {
  const totalChecks = await CheckResult.countDocuments({
    serviceId,
    checkedAt: { $gte: startDate, $lte: endDate },
  });

  const successfulChecks = await CheckResult.countDocuments({
    serviceId,
    checkedAt: { $gte: startDate, $lte: endDate },
    success: true,
  });

  const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

  const incidents = await Incident.find({
    serviceId,
    status: 'resolved',
    resolvedAt: { $ne: null },
    detectedAt: { $gte: startDate, $lte: endDate },
  });

  const totalDowntimeMs = incidents.reduce((sum, inc) => {
    return sum + (inc.downtimeDurationSeconds || 0) * 1000;
  }, 0);

  const periodMs = endDate.getTime() - startDate.getTime();
  const downtimeUptimePercent = periodMs > 0
    ? ((periodMs - totalDowntimeMs) / periodMs) * 100
    : 100;

  return {
    checkBasedUptime: parseFloat(uptimePercent.toFixed(2)),
    downtimeBasedUptime: parseFloat(downtimeUptimePercent.toFixed(2)),
    totalChecks,
    successfulChecks,
    totalIncidents: incidents.length,
    totalDowntimeSeconds: Math.floor(totalDowntimeMs / 1000),
    periodDays: Math.floor(periodMs / (1000 * 60 * 60 * 24)),
  };
}

export async function checkSLABreach(serviceId, slaTarget = 99.9, range = '30d') {
  let startDate;
  if (range === '24h') startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  else if (range === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const uptime = await calculateUptime(serviceId, startDate);

  return {
    ...uptime,
    slaTarget,
    slaBreached: uptime.downtimeBasedUptime < slaTarget,
  };
}