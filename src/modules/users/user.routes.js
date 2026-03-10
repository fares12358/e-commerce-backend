import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  toggleUserStatus,
  getUserDetails,
  deleteuserAccount
} from './user.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { protectAdmin } from '../admin/admin.auth.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();


/* ===== Admin ===== */

router.get('/', protectAdmin, getAllUsers);
router.get('/:id', protectAdmin, getUserDetails);
router.patch('/:id/toggle-status', protectAdmin, toggleUserStatus);
router.delete('/:userId', protectAdmin, deleteuserAccount);

/* ===== User ===== */
router.get('/me', protect, usersLimiter, getMyProfile);
router.put('/me', protect, usersLimiter, updateMyProfile);

export default router;
