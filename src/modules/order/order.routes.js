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
  requestRefund,        // [v1.0.4]
  approveRefund,        // [v1.0.5]
  rejectRefund,         // [v1.0.5]
  markProductReceived,  // [v1.0.5]
  markMoneyRefunded,    // [v1.0.5]
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

/* ===== Admin — Refund [v1.0.5] ===== */
router.patch('/:id/refund/approve',           protectAdmin, approveRefund);
router.patch('/:id/refund/reject',            protectAdmin, rejectRefund);
router.patch('/:id/refund/product-received',  protectAdmin, markProductReceived);
router.patch('/:id/refund/money-refunded',    protectAdmin, markMoneyRefunded);

/* ===== User ===== */
router.post('/', protect, usersLimiter, createOrder);
router.get('/my', protect, usersLimiter, getMyOrders);
router.get('/my/:id', protect, usersLimiter, getOrdersById);
router.patch('/:id', protect, usersLimiter, cancelOrder);
router.get('/invoice/:id', protect, usersLimiter, getInvoice);

/* ===== User — Refund [v1.0.4] ===== */
router.post('/:id/refund', protect, usersLimiter, requestRefund);

export default router;
