import Service from '../models/Service.js';
import { runCheck } from './checkEngine/runner.js';

const timers = new Map();

export function scheduleService(service) {
  if (!service.isActive) return;

  const id = service._id.toString();

  if (timers.has(id)) {
    clearInterval(timers.get(id));
    timers.delete(id);
  }

  const intervalMs = Math.max(service.checkIntervalSeconds * 1000, 5000);

  const timer = setInterval(async () => {
    try {
      const currentService = await Service.findById(id);
      if (!currentService || !currentService.isActive) {
        unscheduleService(id);
        return;
      }
      await runCheck(currentService);
    } catch (err) {
      console.error(`Scheduler error for service ${id}:`, err.message);
    }
  }, intervalMs);

  timers.set(id, timer);
  console.log(`Scheduled service ${service.name} (${service.targetUrlOrHost}) every ${service.checkIntervalSeconds}s`);
}

export function unscheduleService(serviceId) {
  const id = serviceId.toString();
  if (timers.has(id)) {
    clearInterval(timers.get(id));
    timers.delete(id);
    console.log(`Unscheduled service ${id}`);
  }
}

export function scheduleAllServices() {
  Service.find({ isActive: true }).then(services => {
    console.log(`Scheduling ${services.length} active services...`);
    services.forEach(service => scheduleService(service));
  }).catch(err => {
    console.error('Error loading services for scheduling:', err.message);
  });
}

export function rescheduleService(serviceId) {
  unscheduleService(serviceId);
  Service.findById(serviceId).then(service => {
    if (service) scheduleService(service);
  });
}