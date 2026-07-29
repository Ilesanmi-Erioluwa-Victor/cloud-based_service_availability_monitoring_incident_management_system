import mongoose from 'mongoose';

const checkResultSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  checkedAt: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
  statusCode: { type: Number, default: null },
  responseTimeMs: { type: Number, default: null },
  errorType: {
    type: String,
    enum: ['timeout', 'connection_refused', 'wrong_status_code', 'invalid_response_body', 'ssl_error', null],
    default: null,
  },
  errorMessage: { type: String, default: null },
});

checkResultSchema.index({ serviceId: 1, checkedAt: -1 });
checkResultSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

export default mongoose.model('CheckResult', checkResultSchema);