import mongoose from 'mongoose';

const staffMessageSchema = new mongoose.Schema(
  {
    toDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    body: { type: String, required: true, trim: true },
    channel: { type: String, enum: ['in_app', 'sms', 'email'], default: 'in_app' },
    /** Simulated delivery — real SMS/email would integrate externally */
    deliveryStatus: { type: String, enum: ['queued', 'logged'], default: 'logged' },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('StaffMessage', staffMessageSchema);
