import mongoose from 'mongoose';

const emergencyCaseSchema = new mongoose.Schema(
  {
    callerName: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    chiefComplaint: { type: String, required: true },
    triageLevel: { type: String, enum: ['1', '2', '3', '4', '5'], default: '3' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    notes: { type: String, default: '' },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('EmergencyCase', emergencyCaseSchema);
