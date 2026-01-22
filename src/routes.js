import express from 'express';

import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
// import userRoutes from './modules/users/user.routes.js';
import productRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/category/category.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
// router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/admin/categories', categoryRoutes);

export default router;
