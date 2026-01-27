import express from 'express';

import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import userRoutes from './modules/users/user.routes.js';
import userLocation from './modules/users/user.location.routes.js';
import productRoutes from './modules/product/product.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import dashboardRoutes from './modules/admin/dashboard.routes.js';
import publicCategoryRoutes from './modules/category/category.public.routes.js';
import publicProductRoutes from './modules/product/product.public.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';

const router = express.Router();

// import attributeRoutes from './modules/attribute/attribute.routes.js';
// router.use('/admin/attributes', attributeRoutes);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/admin/products', productRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/users/location', userLocation);
router.use('/orders', orderRoutes);
router.use('/products', publicProductRoutes);
router.use('/categories', publicCategoryRoutes);
router.use('/cart', cartRoutes);

export default router;
