import express from 'express';
import { getProductsByCat, getPublicCategories } from './category.public.controller.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.get('/', usersLimiter, getPublicCategories);
router.get('/:catId', usersLimiter, getProductsByCat);

export default router;
