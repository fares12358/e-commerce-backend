import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  cancelOrderAdmin,
  getOrderById,
  getOrdersById,
  getInvoice,
} from './order.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { protectAdmin } from '../admin/admin.auth.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();


/* ===== Admin ===== */

router.get('/', protectAdmin, getAllOrders);
router.get('/id/:id', protectAdmin, getOrderById);
router.get('/stats', protectAdmin, getOrderStats);
router.patch('/:id/status', protectAdmin, updateOrderStatus);
router.patch('/:id/cancel', protectAdmin, cancelOrderAdmin);

/* ===== User ===== */
router.post('/', protect, usersLimiter, createOrder);
router.get('/my', protect, usersLimiter, getMyOrders);
router.get('/my/:id', protect, usersLimiter, getOrdersById);
router.patch('/:id', protect, usersLimiter, cancelOrder);
router.get('/invoice/:id', protect, usersLimiter, getInvoice);

export default router;
