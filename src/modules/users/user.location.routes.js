import express from 'express';
import {
  getMyLocations,
  addLocation,
  deleteLocation,
  setDefaultLocation
} from './user.location.controller.js';

import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/user', getMyLocations);
router.post('/', addLocation);
router.delete('/:locationId', deleteLocation);
router.patch('/:locationId/default', setDefaultLocation);
export default router;
