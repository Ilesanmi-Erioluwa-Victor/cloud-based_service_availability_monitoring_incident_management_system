import Service from '../../models/Service.js';
import CheckResult from '../../models/CheckResult.js';
import MaintenanceWindow from '../../models/MaintenanceWindow.js';
import { httpCheck } from './httpCheck.js';
import { tcpCheck } from './tcpCheck.js';
import { apiHealthCheck } from './apiHealthCheck.js';
import { sslCheck } from './sslCheck.js';
import { incidentService } from '../incidentService.js';
import { emitCheckResult, emitServiceStatusChanged } from '../../sockets/socketHandlers.js';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runCheck(service) {
  if (service.checkInFlight) {
    console.log(`Check already in flight for service ${service.name}, skipping`);
    return;
  }

  try {
    await Service.findByIdAndUpdate(service._id, { checkInFlight: true });

    let result = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (service.checkType === 'http' || service.checkType === 'https') {
        result = await httpCheck(service.targetUrlOrHost, service.expectedStatusCodes, service.timeoutMs);
      } else if (service.checkType === 'tcp') {
        const host = service.targetUrlOrHost;
        const port = service.targetPort || 80;
        result = await tcpCheck(host, port, service.timeoutMs);
      } else if (service.checkType === 'api_health') {
        result = await apiHealthCheck(
          service.targetUrlOrHost,
          service.expectedStatusCodes,
          service.timeoutMs,
          service.healthCheckAuthHeaderEncrypted
        );
      }

      if (result.success) break;
      if (attempt < MAX_RETRIES) {
        console.log(`Retry ${attempt + 1} for service ${service.name}`);
        await sleep(RETRY_DELAY_MS);
      }
    }

    result.responseTimeMs = result.responseTimeMs || 0;

    const checkResultDoc = await CheckResult.create({
      serviceId: service._id,
      checkedAt: new Date(),
      success: result.success,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      errorType: result.errorType,
      errorMessage: result.errorMessage,
    });

    emitCheckResult(service._id, checkResultDoc);

    let degraded = false;
    if (service.responseTimeThresholdMs && result.responseTimeMs > service.responseTimeThresholdMs) {
      degraded = true;
    }

    const now = new Date();

    const activeMaintenance = await MaintenanceWindow.findOne({
      serviceId: service._id,
      startAt: { $lte: now },
      endAt: { $gte: now },
    });

    if (activeMaintenance) {
      await Service.findByIdAndUpdate(service._id, {
        lastCheckedAt: now,
        currentStatus: 'maintenance',
        checkInFlight: false,
      });
      emitServiceStatusChanged(service._id, 'maintenance');
      return;
    }

    await incidentService.processCheckResult(service, result.success, degraded);

    if (service.checkType === 'https' && service.sslCheckEnabled) {
      const parsedUrl = new URL(service.targetUrlOrHost);
      const sslResult = await sslCheck(parsedUrl.hostname, parsedUrl.port || 443, service.sslExpiryWarningDays);
      if (!sslResult.success) {
        console.log(`SSL check warning for ${service.name}: ${sslResult.errorMessage}`);
      }
    }
  } finally {
    await Service.findByIdAndUpdate(service._id, { checkInFlight: false });
  }
}