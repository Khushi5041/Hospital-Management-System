import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: { type: String, required: true },
    prescription: [{ medication: String, dosage: String, duration: String }],
    notes: { type: String },
    vitals: {
      bloodPressure: String,
      temperature: String,
      pulse: String,
      weight: String,
    },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('MedicalRecord', medicalRecordSchema);
