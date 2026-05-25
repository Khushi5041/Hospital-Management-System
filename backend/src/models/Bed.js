import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    bedLabel: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'cleaning'],
      default: 'available',
    },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

bedSchema.index({ room: 1, bedLabel: 1 }, { unique: true });

export default mongoose.model('Bed', bedSchema);
