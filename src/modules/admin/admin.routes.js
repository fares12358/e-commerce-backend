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
  updateMainContent,
  getRefundFlag,      // [v1.0.4]
  updateRefundFlag,   // [v1.0.4]
} from './admin.controller.js';

import { protectAdmin } from './admin.auth.js';
import { authLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.get('/me', protectAdmin, adminMe);
router.get('/dashboard', protectAdmin, adminDashboard);
router.put('/profile', protectAdmin, updateAdminProfile);
router.put('/config', protectAdmin, updateConfig);
router.get('/config', protectAdmin, getConfig);

/* [v1.0.4] Refund feature flag — admin-only */
router.get('/refund-flag',  protectAdmin, getRefundFlag);
router.put('/refund-flag',  protectAdmin, updateRefundFlag);

// Public route - for website
// Admin routes
router.get('/content', protectAdmin, getContent);
router.put('/content/main', protectAdmin, updateMainContent);
router.post('/content/section', protectAdmin, addSection);
router.put('/content/section', protectAdmin, updateSection);
router.delete('/content/section', protectAdmin, deleteSection);

router.post('/login', authLimiter, adminLogin);
router.post('/logout',  authLimiter,adminLogout);
router.post('/forgot-password', authLimiter, adminForgotPassword);
router.put('/reset-password/:token',  authLimiter,adminResetPassword);

export default router;
