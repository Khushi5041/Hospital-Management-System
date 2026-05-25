import express from 'express';
import {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getMedicalRecords).post(createMedicalRecord);
router.route('/:id').get(getMedicalRecordById).put(updateMedicalRecord).delete(deleteMedicalRecord);

export default router;
