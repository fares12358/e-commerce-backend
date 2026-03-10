import express from 'express';
import {
  getPublicProducts,
  getProductDetails,
  suggestProducts,
  searchProducts
} from './product.public.controller.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.get('/', usersLimiter, getPublicProducts);
router.get('/details/:id', usersLimiter, getProductDetails);
router.get('/suggest', usersLimiter, suggestProducts);
router.get("/search", usersLimiter, searchProducts);

export default router;
