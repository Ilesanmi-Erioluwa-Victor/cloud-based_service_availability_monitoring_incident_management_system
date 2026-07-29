import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'responder'], default: 'responder' },
  notificationPreferences: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    phoneNumber: { type: String, default: null },
    smsMinSeverity: { type: String, enum: ['critical', 'major', 'minor'], default: 'critical' },
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);