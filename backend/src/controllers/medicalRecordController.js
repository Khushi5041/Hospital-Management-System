import MedicalRecord from '../models/MedicalRecord.js';
import { findPatientForUser } from '../utils/patientAccess.js';

export const getMedicalRecords = async (req, res, next) => {
  try {
    const { patient, doctor } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me) return res.json([]);
      filter.patient = me._id;
    } else {
      if (patient) filter.patient = patient;
    }

    if (doctor) filter.doctor = doctor;
    const records = await MedicalRecord.find(filter)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth bloodGroup allergies')
      .populate('doctor', 'name specialization')
      .populate('appointment');
    if (!record) return res.status(404).json({ message: 'Medical record not found' });

    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me || String(record.patient?._id || record.patient) !== String(me._id)) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
};

export const createMedicalRecord = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const record = await MedicalRecord.create(req.body);
    await record.populate(['patient', 'doctor']);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

export const updateMedicalRecord = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization');
    if (!record) return res.status(404).json({ message: 'Medical record not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
};

export const deleteMedicalRecord = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Medical record not found' });
    res.json({ message: 'Medical record removed' });
  } catch (error) {
    next(error);
  }
};
