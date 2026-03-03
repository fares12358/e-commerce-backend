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
router.use(usersLimiter);

router.get('/', getMyCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);

export default router;
