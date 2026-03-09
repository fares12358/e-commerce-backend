import express from 'express';
import {
  adminLogin,
  adminLogout,
  adminDashboard,
  adminForgotPassword,
  adminResetPassword,
  adminMe,
  updateAdminProfile,
  updateConfig,
  getConfig,
  addSection,
  updateSection,
  deleteSection,
  getContent,
  updateMainContent
} from './admin.controller.js';

import { protectAdmin } from './admin.auth.js';
import { authLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.get('/me', protectAdmin, adminMe);
router.get('/dashboard', protectAdmin, adminDashboard);
router.put('/profile', protectAdmin, updateAdminProfile);
router.put('/config', protectAdmin, updateConfig);
router.get('/config', protectAdmin, getConfig);

// Public route - for website
// Admin routes
router.get('/content', protectAdmin, getContent);
router.put('/content/main', protectAdmin, updateMainContent);
router.post('/content/section', protectAdmin, addSection);
router.put('/content/section', protectAdmin, updateSection);
router.delete('/content/section', protectAdmin, deleteSection);

router.use(authLimiter)
router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.post('/forgot-password', adminForgotPassword);
router.put('/reset-password/:token', adminResetPassword);

export default router;
