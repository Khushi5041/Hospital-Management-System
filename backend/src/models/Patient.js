import mongoose from 'mongoose';

const patientDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['lab', 'imaging', 'prescription_scan', 'report', 'other'],
      default: 'report',
    },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String },
    bloodGroup: { type: String },
    emergencyContact: { type: String },
    allergies: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive', 'discharged'], default: 'active' },
    /** Front-desk visit token / MRN-style ID for queues and billing */
    patientCode: { type: String, unique: true, sparse: true, trim: true },
    walkIn: { type: Boolean, default: false },
    documents: [patientDocumentSchema],
  },
  { timestamps: true }
);

patientSchema.pre('save', async function (next) {
  if (this.patientCode) return next();
  const Model = this.constructor;
  for (let i = 0; i < 25; i++) {
    const code = `P-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = await Model.findOne({ patientCode: code });
    if (!clash) {
      this.patientCode = code;
      return next();
    }
  }
  next(new Error('Could not generate unique patient code'));
});

export default mongoose.model('Patient', patientSchema);
