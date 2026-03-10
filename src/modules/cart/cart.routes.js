import express from 'express';
import {
  getMyCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from './cart.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.use(protect);

router.get('/', usersLimiter, getMyCart);
router.post('/add', usersLimiter, addToCart);
router.put('/update', usersLimiter, updateCartItem);
router.delete('/remove/:itemId', usersLimiter, removeFromCart);
router.delete('/clear', usersLimiter, clearCart);

export default router;
