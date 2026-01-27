import express from 'express';
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategoryPermanent,
    Categorystatus
} from './category.controller.js';

import { protectAdmin } from '../admin/admin.auth.js';
import upload from '../../middlewares/multer.js';

const router = express.Router();

router.use(protectAdmin);

router.post('/', upload.single('image'), createCategory);
router.get('/', getCategories);
router.put('/:id', upload.single('image'), updateCategory);
router.patch('/:id', Categorystatus);
router.delete('/:id', deleteCategoryPermanent);

export default router;
