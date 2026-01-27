import express from 'express';
import {
  getPublicProducts,
  getProductDetails
} from './product.public.controller.js';

const router = express.Router();

router.get('/', getPublicProducts);
router.get('/:id', getProductDetails);

export default router;
