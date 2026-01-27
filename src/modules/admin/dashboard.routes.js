import express from 'express';
import { getDashboardStats } from './dashboard.controller.js';
import { protectAdmin } from './admin.auth.js';

const router = express.Router();

router.get('/stats', protectAdmin, getDashboardStats);

export default router;
