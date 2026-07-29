import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerTeam: { type: String, default: '' },
  checkType: {
    type: String,
    enum: ['http', 'https', 'tcp', 'api_health'],
    required: true,
  },
  targetUrlOrHost: { type: String, required: true },
  targetPort: { type: Number, default: null },
  expectedStatusCodes: { type: [Number], default: [200] },
  healthCheckAuthHeaderEncrypted: { type: String, default: null },
  checkIntervalSeconds: { type: Number, default: 60 },
  timeoutMs: { type: Number, default: 10000 },
  responseTimeThresholdMs: { type: Number, default: null },
  consecutiveFailuresForIncident: { type: Number, default: 3 },
  consecutiveSuccessesForResolve: { type: Number, default: 2 },
  sslCheckEnabled: { type: Boolean, default: false },
  sslExpiryWarningDays: { type: Number, default: 14 },
  severityLevel: {
    type: String,
    enum: ['critical', 'major', 'minor'],
    default: 'minor',
  },
  isActive: { type: Boolean, default: true },
  lastCheckedAt: { type: Date, default: null },
  currentStatus: {
    type: String,
    enum: ['up', 'degraded', 'down', 'flapping', 'maintenance', 'unknown'],
    default: 'unknown',
  },
  consecutiveFailureCount: { type: Number, default: 0 },
  consecutiveSuccessCount: { type: Number, default: 0 },
  checkInFlight: { type: Boolean, default: false },
}, { timestamps: true });

serviceSchema.index({ isActive: 1, lastCheckedAt: 1 });

export default mongoose.model('Service', serviceSchema);