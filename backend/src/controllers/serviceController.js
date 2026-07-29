import mongoose from 'mongoose';
import Service from '../models/Service.js';
import CheckResult from '../models/CheckResult.js';
import { runCheck } from '../services/checkEngine/runner.js';
import { scheduleService, unscheduleService } from '../services/schedulerService.js';
import { encrypt } from '../services/encryptionService.js';

export async function listServices(req, res) {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    console.error('List services error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createService(req, res) {
  try {
    const data = { ...req.body };

    if (data.checkType === 'api_health' && data.healthCheckAuthHeader) {
      data.healthCheckAuthHeaderEncrypted = encrypt(data.healthCheckAuthHeader);
      delete data.healthCheckAuthHeader;
    }

    const service = await Service.create(data);
    scheduleService(service);
    runCheck(service);
    res.status(201).json({ service });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.checkType === 'api_health' && data.healthCheckAuthHeader) {
      data.healthCheckAuthHeaderEncrypted = encrypt(data.healthCheckAuthHeader);
      delete data.healthCheckAuthHeader;
    }

    const oldService = await Service.findById(id);
    if (!oldService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await Service.findByIdAndUpdate(id, { $set: data }, { new: true });

    if (data.checkIntervalSeconds && data.checkIntervalSeconds !== oldService.checkIntervalSeconds) {
      unscheduleService(id);
      scheduleService(service);
    }

    res.json({ service });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const openIncidents = await mongoose.model('Incident').countDocuments({ serviceId: id, status: { $ne: 'resolved' } });
    if (openIncidents > 0) {
      return res.status(409).json({ error: 'Resolve open incidents before deleting this service' });
    }

    unscheduleService(id);
    await Service.findByIdAndDelete(id);

    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getServiceChecks(req, res) {
  try {
    const { id } = req.params;
    const { range } = req.query;

    let startDate = new Date(0);
    if (range === '24h') startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else if (range) startDate = new Date(range);

    const checks = await CheckResult.find({
      serviceId: id,
      checkedAt: { $gte: startDate },
    }).sort({ checkedAt: -1 }).limit(500);

    res.json({ checks });
  } catch (err) {
    console.error('Get service checks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getServiceSLA(req, res) {
  try {
    const { id } = req.params;
    const { range } = req.query;

    let startDate = new Date(0);
    if (range === '24h') startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const totalChecks = await CheckResult.countDocuments({ serviceId: id, checkedAt: { $gte: startDate } });
    const successfulChecks = await CheckResult.countDocuments({
      serviceId: id, checkedAt: { $gte: startDate }, success: true,
    });

    const uptimePercent = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : 100;

    const service = await Service.findById(id);
    const breaches = uptimePercent < (service?.slaTarget || 99.9);

    res.json({ uptimePercent: parseFloat(uptimePercent), totalChecks, successfulChecks, slaBreached: breaches });
  } catch (err) {
    console.error('Get service SLA error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createMaintenanceWindow(req, res) {
  try {
    const { id } = req.params;
    const { startAt, endAt, reason } = req.body;

    const mw = await mongoose.model('MaintenanceWindow').create({
      serviceId: id,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      reason: reason || '',
      createdByUserId: req.user._id,
    });

    res.status(201).json({ maintenanceWindow: mw });
  } catch (err) {
    console.error('Create maintenance window error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}