import express from 'express';
import { getProductsByCat, getPublicCategories } from './category.public.controller.js';

const router = express.Router();

router.get('/', getPublicCategories);
router.get('/:catId', getProductsByCat);

export default router;
