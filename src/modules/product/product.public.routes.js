import express from 'express';
import {
  getPublicProducts,
  getProductDetails,
  suggestProducts,
  searchProducts
} from './product.public.controller.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.use(usersLimiter);
router.get('/', getPublicProducts);
router.get('/details/:id', getProductDetails);
router.get('/suggest', suggestProducts);
router.get("/search", searchProducts);

export default router;
