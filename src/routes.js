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
import adsRoutes from './modules/ads/ads.routes.js';
import dataRoutes from './modules/data/data.routes.js';
import contactRoutes from './modules/contact/contact.routes.js';
import notificationRoutes from './modules/notification/notificationRoutes.routes.js';
import contorllesRoutes from './modules/contorlles/contorlles.routes.js';
import telegramRoutes from './modules/telegram/telegram.api.routes.js';
import docRoutes from './docs/docs.routes.js';
import { checkBackendStatus } from './middlewares/checkBackendStatus.js';

const router = express.Router();

router.use('/controllers', contorllesRoutes);
router.use(checkBackendStatus)
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/notification', notificationRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/admin/products', productRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/ads', adsRoutes);

router.use('/telegram', telegramRoutes);

router.use('/docs', docRoutes);

router.use('/data', dataRoutes);
router.use('/users', userRoutes);
router.use('/users/location', userLocation);
router.use('/orders', orderRoutes);
router.use('/products', publicProductRoutes);
router.use('/categories', publicCategoryRoutes);
router.use('/cart', cartRoutes);
router.use('/contact', contactRoutes);


export default router;