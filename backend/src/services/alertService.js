import axios from 'axios';
import env from '../config/env.js';
import User from '../models/User.js';
import NotificationLog from '../models/NotificationLog.js';
import { emitIncidentAcknowledged } from '../sockets/socketHandlers.js';

const ESCALATION_WINDOW_MS = 10 * 60 * 1000;
const ESCALATION_CHECK_INTERVAL_MS = 60 * 1000;

let escalationTimer = null;

class AlertService {
  async sendIncidentAlerts(incident, service) {
    const users = await User.find({ 'notificationPreferences.emailEnabled': true });

    for (const user of users) {
      await this.sendEmailAlert(user, incident, service);
    }

    if (incident.severity === 'critical') {
      const smsUsers = await User.find({
        'notificationPreferences.smsEnabled': true,
        'notificationPreferences.phoneNumber': { $ne: null, $ne: '' },
        $or: [
          { 'notificationPreferences.smsMinSeverity': 'critical' },
          { 'notificationPreferences.smsMinSeverity': 'major' },
          { 'notificationPreferences.smsMinSeverity': 'minor' },
        ],
      });

      for (const user of smsUsers) {
        if (this.meetsSmsThreshold(user, incident.severity)) {
          await this.sendSmsAlert(user, incident, service);
        }
      }
    }

    this.startEscalationCheck();
  }

  meetsSmsThreshold(user, severity) {
    const severityOrder = { minor: 1, major: 2, critical: 3 };
    return severityOrder[severity] >= severityOrder[user.notificationPreferences.smsMinSeverity];
  }

  async sendEmailAlert(user, incident, service) {
    try {
      if (!env.BREVO_API_KEY) {
        console.log(`Brevo API key not configured, skipping email to ${user.email}`);
        await NotificationLog.create({
          incidentId: incident._id,
          channel: 'email',
          recipientUserId: user._id,
          sentAt: new Date(),
          status: 'failed',
          errorMessage: 'Brevo API key not configured',
        });
        return;
      }

      const subject = `[${incident.severity.toUpperCase()}] UptimeGuard Alert: ${service.name} is down`;
      const htmlContent = `
        <h2>UptimeGuard Incident Alert</h2>
        <p><strong>Service:</strong> ${service.name}</p>
        <p><strong>Target:</strong> ${service.targetUrlOrHost}</p>
        <p><strong>Severity:</strong> ${incident.severity}</p>
        <p><strong>Detected at:</strong> ${incident.detectedAt}</p>
        <p><strong>Incident ID:</strong> ${incident._id}</p>
        <p>The service has been down for ${service.consecutiveFailureCount} consecutive checks.</p>
        <hr/>
        <p><small>UptimeGuard - Automatic Monitoring Alert</small></p>
      `;

      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { email: 'uptimeguard@monitoring.local', name: 'UptimeGuard' },
        to: [{ email: user.email, name: user.name }],
        subject,
        htmlContent,
      }, {
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      await NotificationLog.create({
        incidentId: incident._id,
        channel: 'email',
        recipientUserId: user._id,
        sentAt: new Date(),
        status: 'sent',
      });

      console.log(`Email alert sent to ${user.email} for incident ${incident._id}`);
    } catch (err) {
      console.error(`Failed to send email to ${user.email}:`, err.message);

      await NotificationLog.create({
        incidentId: incident._id,
        channel: 'email',
        recipientUserId: user._id,
        sentAt: new Date(),
        status: 'failed',
        errorMessage: err.message,
      });
    }
  }

  async sendSmsAlert(user, incident, service) {
    try {
      if (!user.notificationPreferences.phoneNumber) {
        await NotificationLog.create({
          incidentId: incident._id,
          channel: 'sms',
          recipientUserId: user._id,
          sentAt: new Date(),
          status: 'failed',
          errorMessage: 'No phone number configured',
        });
        return;
      }

      if (!env.SMS_API_KEY) {
        console.log('SMS API key not configured, skipping SMS');
        await NotificationLog.create({
          incidentId: incident._id,
          channel: 'sms',
          recipientUserId: user._id,
          sentAt: new Date(),
          status: 'failed',
          errorMessage: 'SMS API key not configured',
        });
        return;
      }

      const message = `[UptimeGuard] CRITICAL: ${service.name} (${service.targetUrlOrHost}) is DOWN. Incident #${incident._id}`;

      if (env.SMS_PROVIDER === 'termii') {
        await axios.post('https://api.termii.com/api/v1/sms/send', {
          api_key: env.SMS_API_KEY,
          to: user.notificationPreferences.phoneNumber,
          from: 'UptimeGuard',
          sms: message,
          type: 'plain',
          channel: 'generic',
        }, {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (env.SMS_PROVIDER === 'bulksmsnigeria') {
        await axios.post('https://www.bulksmsnigeria.com/api/v2/sms', {
          from: 'UptimeGuard',
          to: user.notificationPreferences.phoneNumber,
          body: message,
        }, {
          headers: {
            'Authorization': `Bearer ${env.SMS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (env.SMS_PROVIDER === 'mysmsgate') {
        await axios.post('https://mysmsgate.net/api/v1/send', {
          to: user.notificationPreferences.phoneNumber,
          message: message,
        }, {
          headers: {
            'Authorization': `Bearer ${env.SMS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        await axios.post('https://api.smartsmssolutions.com/v2/sms/send', {
          to: user.notificationPreferences.phoneNumber,
          from: 'UptimeGuard',
          body: message,
        }, {
          headers: {
            'Authorization': `Bearer ${env.SMS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
      }

      await NotificationLog.create({
        incidentId: incident._id,
        channel: 'sms',
        recipientUserId: user._id,
        sentAt: new Date(),
        status: 'sent',
      });

      console.log(`SMS alert sent to ${user.notificationPreferences.phoneNumber} for incident ${incident._id}`);
    } catch (err) {
      console.error(`Failed to send SMS to ${user.notificationPreferences.phoneNumber}:`, err.message);

      await NotificationLog.create({
        incidentId: incident._id,
        channel: 'sms',
        recipientUserId: user._id,
        sentAt: new Date(),
        status: 'failed',
        errorMessage: err.message,
      });
    }
  }

  async sendEscalationAlert(incident, service) {
    const admins = await User.find({ role: 'admin', 'notificationPreferences.emailEnabled': true });

    for (const admin of admins) {
      try {
        const subject = `[ESCALATION] UptimeGuard: ${service.name} incident not acknowledged`;
        const htmlContent = `
          <h2>UptimeGuard Escalation Alert</h2>
          <p><strong>Service:</strong> ${service.name}</p>
          <p><strong>Target:</strong> ${service.targetUrlOrHost}</p>
          <p><strong>Severity:</strong> ${incident.severity}</p>
          <p><strong>Detected at:</strong> ${incident.detectedAt}</p>
          <p><strong>Status:</strong> NOT YET ACKNOWLEDGED (${Math.floor((Date.now() - new Date(incident.detectedAt).getTime()) / 60000)} minutes elapsed)</p>
          <p>Immediate attention required.</p>
          <hr/>
          <p><small>UptimeGuard - Escalation Alert</small></p>
        `;

        await axios.post('https://api.brevo.com/v3/smtp/email', {
          sender: { email: 'uptimeguard@monitoring.local', name: 'UptimeGuard' },
          to: [{ email: admin.email, name: admin.name }],
          subject,
          htmlContent,
        }, {
          headers: {
            'api-key': env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        incident.timeline.push({
          timestamp: new Date(),
          event: 'escalated',
          note: `Escalation alert sent to admin ${admin.email}`,
        });
        await incident.save();

        await NotificationLog.create({
          incidentId: incident._id,
          channel: 'email',
          recipientUserId: admin._id,
          sentAt: new Date(),
          status: 'sent',
        });
      } catch (err) {
        console.error(`Escalation email failed to ${admin.email}:`, err.message);
      }
    }
  }

  startEscalationCheck() {
    if (escalationTimer) return;

    escalationTimer = setInterval(async () => {
      try {
        const unacknowledgedIncidents = await Incident.find({
          status: 'open',
          detectedAt: { $lte: new Date(Date.now() - ESCALATION_WINDOW_MS) },
        }).populate('serviceId');

        for (const incident of unacknowledgedIncidents) {
          const alreadyEscalated = incident.timeline.some(e => e.event === 'escalated');
          if (!alreadyEscalated && incident.serviceId) {
            await this.sendEscalationAlert(incident, incident.serviceId);
          }
        }
      } catch (err) {
        console.error('Escalation check error:', err.message);
      }
    }, ESCALATION_CHECK_INTERVAL_MS);

    console.log('Escalation check started');
  }
}

export const alertService = new AlertService();