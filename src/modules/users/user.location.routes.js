import express from 'express';
import {
  getMyLocations,
  addLocation,
  deleteLocation,
  setDefaultLocation
} from './user.location.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { usersLimiter } from '../../middlewares/rateLimit.js';

const router = express.Router();

router.use(protect);

router.get('/user', usersLimiter, getMyLocations);
router.post('/', usersLimiter, addLocation);
router.delete('/:locationId', usersLimiter, deleteLocation);
router.patch('/:locationId/default', usersLimiter, setDefaultLocation);
export default router;
