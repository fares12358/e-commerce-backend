import express from 'express';
import { getProductsByCat, getPublicCategories } from './category.public.controller.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.use(usersLimiter);
router.get('/', getPublicCategories);
router.get('/:catId', getProductsByCat);

export default router;
