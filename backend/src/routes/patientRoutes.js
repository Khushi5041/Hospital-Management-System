import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addPatientDocument,
} from '../controllers/patientController.js';
import { protect } from '../middleware/auth.js';
import { uploadPatientDocument } from '../middleware/uploadPatientDoc.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getPatients).post(createPatient);
router.post('/:id/documents', uploadPatientDocument.single('file'), addPatientDocument);
router.route('/:id').get(getPatientById).put(updatePatient).delete(deletePatient);

export default router;
