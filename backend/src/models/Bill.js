import mongoose from 'mongoose';

const lineSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    lines: [lineSchema],
    insuranceNote: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'issued', 'paid'], default: 'issued' },
    receiptNo: { type: String, unique: true, sparse: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

billSchema.pre('save', async function (next) {
  if (this.receiptNo) return next();
  this.receiptNo = `RCPT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  next();
});

billSchema.virtual('total').get(function () {
  return (this.lines || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
});

billSchema.set('toJSON', { virtuals: true });
billSchema.set('toObject', { virtuals: true });

export default mongoose.model('Bill', billSchema);
