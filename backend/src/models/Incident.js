import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  event: {
    type: String,
    enum: ['opened', 'acknowledged', 'escalated', 'status_note', 'resolved'],
    required: true,
  },
  note: { type: String, default: '' },
  byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'resolved'],
    default: 'open',
  },
  severity: {
    type: String,
    enum: ['critical', 'major', 'minor'],
    required: true,
  },
  detectedAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date, default: null },
  acknowledgedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  downtimeDurationSeconds: { type: Number, default: null },
  timeline: { type: [timelineEntrySchema], default: [] },
  rootCauseNote: { type: String, default: null },
}, { timestamps: true });

incidentSchema.index({ serviceId: 1, status: 1 });

export default mongoose.model('Incident', incidentSchema);