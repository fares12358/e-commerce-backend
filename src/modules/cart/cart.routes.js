import express from 'express';
import {
  getMyCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from './cart.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);

export default router;
