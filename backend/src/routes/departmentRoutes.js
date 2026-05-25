import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getDepartments).post(createDepartment);
router.route('/:id').get(getDepartmentById).put(updateDepartment).delete(deleteDepartment);

export default router;
