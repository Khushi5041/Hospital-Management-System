import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getAvailableSlots,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/:id/available-slots', getAvailableSlots);
router.route('/').get(getDoctors).post(createDoctor);
router.route('/:id').get(getDoctorById).put(updateDoctor).delete(deleteDoctor);

export default router;
