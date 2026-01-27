import express from 'express';
import { getPublicCategories } from './category.public.controller.js';

const router = express.Router();

router.get('/', getPublicCategories);

export default router;
