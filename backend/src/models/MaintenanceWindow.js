import mongoose from 'mongoose';

const maintenanceWindowSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  reason: { type: String, default: '' },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

maintenanceWindowSchema.index({ serviceId: 1, startAt: 1, endAt: 1 });

export default mongoose.model('MaintenanceWindow', maintenanceWindowSchema);