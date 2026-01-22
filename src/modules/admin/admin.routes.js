import express from 'express';
import {
  adminLogin,
  adminLogout,
  adminDashboard,
  adminForgotPassword,
  adminResetPassword,
  adminMe,
  updateAdminProfile
} from './admin.controller.js';

import { protectAdmin } from './admin.auth.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/logout', adminLogout);

router.get('/me', protectAdmin, adminMe);
router.get('/dashboard', protectAdmin, adminDashboard);

router.post('/forgot-password', adminForgotPassword);
router.put('/reset-password/:token', adminResetPassword);

router.put('/profile', protectAdmin, updateAdminProfile);



export default router;
