import mongoose from 'mongoose';

const departmentTypeEnum = [
  'emergency_trauma',
  'internal_medicine',
  'surgery_orthopedics',
  'pediatrics',
  'obstetrics_gynecology',
  'cardiology',
  'neurology',
  'oncology',
  'radiology_imaging',
  'laboratory_pathology',
  'outpatient_primary',
  'icu_critical_care',
  'psychiatry_mental_health',
  'rehabilitation',
  'pharmacy',
  'administration_support',
  'other',
];

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    departmentType: {
      type: String,
      enum: departmentTypeEnum,
      default: 'outpatient_primary',
    },
    headOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    floor: { type: String },
    contactExtension: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Department', departmentSchema);
