import express from 'express';
import {
  getMyLocations,
  addLocation,
  updateLocation,
  deleteLocation
} from './user.location.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyLocations);
router.post('/', addLocation);
router.put('/:locationId', updateLocation);
router.delete('/:locationId', deleteLocation);

export default router;
