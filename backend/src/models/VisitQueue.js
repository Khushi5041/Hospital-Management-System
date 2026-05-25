import mongoose from 'mongoose';

const visitQueueSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    chiefComplaint: { type: String, default: '' },
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    status: {
      type: String,
      enum: ['waiting', 'called', 'with_doctor', 'completed', 'cancelled'],
      default: 'waiting',
    },
    visitToken: { type: String, trim: true },
    checkedInAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

visitQueueSchema.pre('save', async function (next) {
  if (this.visitToken) return next();
  this.visitToken = `Q-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  next();
});

export default mongoose.model('VisitQueue', visitQueueSchema);
