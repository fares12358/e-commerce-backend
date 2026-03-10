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
import { authLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.get('/me', protect, me);
router.post('/register/send-otp', authLimiter, sendRegisterOtp);
router.post('/register/verify-otp', authLimiter, verifyRegisterOtp);
router.post('/login', authLimiter, login);
router.post('/logout', authLimiter, logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);
router.put('/me', protect, authLimiter, changePassword);

export default router;
