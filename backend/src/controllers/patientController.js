import Patient from '../models/Patient.js';
import { findPatientForUser } from '../utils/patientAccess.js';

export const getPatients = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      return res.json(me ? [me] : []);
    }
    const { search, status } = req.query;
    const filter = {};
    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: new RegExp(esc, 'i') },
        { email: new RegExp(esc, 'i') },
        { phone: new RegExp(esc, 'i') },
        { patientCode: new RegExp(esc, 'i') },
      ];
    }
    if (status) filter.status = status;
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me || String(me._id) !== String(patient._id)) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    }
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient removed' });
  } catch (error) {
    next(error);
  }
};

export const addPatientDocument = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const { title, category } = req.body;
    const cat = ['lab', 'imaging', 'prescription_scan', 'report', 'other'].includes(category) ? category : 'report';
    patient.documents.push({
      title: (title && String(title).trim()) || req.file.originalname || 'Document',
      category: cat,
      fileUrl: `/uploads/patient-docs/${req.file.filename}`,
    });
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
};
