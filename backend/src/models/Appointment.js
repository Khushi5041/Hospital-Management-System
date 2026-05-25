import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    date: { type: Date },
    timeSlot: { type: String },
    type: { type: String, enum: ['consultation', 'followup', 'emergency'], default: 'consultation' },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    notes: { type: String },
    /** Patient's message when requesting an appointment (pending) */
    patientNotes: { type: String },
    preferredDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    preferredDate: { type: Date },
  },
  { timestamps: true }
);

appointmentSchema.pre('validate', function (next) {
  if (this.status === 'pending') return next();
  if (!this.doctor || !this.date || !this.timeSlot) {
    this.invalidate(
      'doctor',
      'Doctor, date, and time slot are required unless the appointment is pending (patient request)'
    );
  }
  next();
});

export default mongoose.model('Appointment', appointmentSchema);
