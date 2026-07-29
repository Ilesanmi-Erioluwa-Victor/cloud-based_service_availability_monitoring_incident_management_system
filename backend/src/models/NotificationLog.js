import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  errorMessage: { type: String, default: null },
});

export default mongoose.model('NotificationLog', notificationLogSchema);