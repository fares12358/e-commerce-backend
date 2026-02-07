import express from 'express';
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  sendRegisterOtp,
  verifyRegisterOtp,
  me,
  changePassword
} from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register/send-otp', sendRegisterOtp);
router.post('/register/verify-otp', verifyRegisterOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, me);
router.put('/me', protect, changePassword);

export default router;
