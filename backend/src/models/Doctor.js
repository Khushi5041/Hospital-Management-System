import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    specialization: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    qualification: { type: String },
    consultationFee: { type: Number, default: 0 },
    availableDays: [{ type: String }],
    availableTimeStart: { type: String },
    availableTimeEnd: { type: String },
    status: { type: String, enum: ['active', 'on_leave', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
