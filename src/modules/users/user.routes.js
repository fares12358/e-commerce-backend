import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  toggleUserStatus,
  getUserDetails
} from './user.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { protectAdmin } from '../admin/admin.auth.js';

const router = express.Router();

/* ===== User ===== */
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

/* ===== Admin ===== */
router.get('/', protectAdmin, getAllUsers);
router.get('/:id', protectAdmin, getUserDetails);
router.patch('/:id/toggle-status', protectAdmin, toggleUserStatus);

export default router;
