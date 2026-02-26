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

const router = express.Router();

/* ===== User ===== */

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/my/:id', protect, getOrdersById);
router.patch('/:id', protect, cancelOrder);
router.get('/invoice/:id', protect, getInvoice);

/* ===== Admin ===== */

router.get('/', protectAdmin, getAllOrders);
router.get('/id/:id', protectAdmin, getOrderById);
router.get('/stats', protectAdmin, getOrderStats);
router.patch('/:id/status', protectAdmin, updateOrderStatus);
router.patch('/:id/cancel', protectAdmin, cancelOrderAdmin);
export default router;
