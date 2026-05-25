import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireStaffDesk } from '../middleware/requireStaffDesk.js';
import {
  getStats,
  listQueue,
  addQueueEntry,
  updateQueueEntry,
  listBeds,
  createBed,
  updateBed,
  listBills,
  createBill,
  markBillPaid,
  listEmergencies,
  createEmergency,
  closeEmergency,
  notifyDoctor,
  listMessages,
} from '../controllers/staffDeskController.js';

const router = express.Router();
router.use(protect, requireStaffDesk);

router.get('/stats', getStats);
router.get('/queue', listQueue);
router.post('/queue', addQueueEntry);
router.patch('/queue/:id', updateQueueEntry);

router.get('/beds', listBeds);
router.post('/beds', createBed);
router.patch('/beds/:id', updateBed);

router.get('/bills', listBills);
router.post('/bills', createBill);
router.patch('/bills/:id/mark-paid', markBillPaid);

router.get('/emergencies', listEmergencies);
router.post('/emergencies', createEmergency);
router.patch('/emergencies/:id/close', closeEmergency);

router.post('/notify', notifyDoctor);
router.get('/messages', listMessages);

export default router;
