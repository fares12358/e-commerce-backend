import express from 'express';
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} from './category.controller.js';

import { protectAdmin } from '../admin/admin.auth.js';
import upload from '../../middlewares/multer.js';

const router = express.Router();

router.use(protectAdmin);

router.post('/', upload.single('image'), createCategory);
router.get('/', getCategories);
router.put('/:id', upload.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
