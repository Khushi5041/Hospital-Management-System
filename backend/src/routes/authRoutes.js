import express from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
  patchProfile,
  updateProfilePhoto,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadProfilePic } from '../middleware/uploadProfile.js';

const router = express.Router();

router.post('/register', uploadProfilePic.single('profilePic'), register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.patch('/profile', protect, patchProfile);
router.put('/profile-photo', protect, uploadProfilePic.single('profilePic'), updateProfilePhoto);
router.put('/change-password', protect, changePassword);
router.post('/delete-account', protect, deleteAccount);

export default router;
