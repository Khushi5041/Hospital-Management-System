import express from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getAppointments).post(createAppointment);
router.route('/:id').get(getAppointmentById).put(updateAppointment).delete(deleteAppointment);

export default router;
