import express from 'express';
import {
  createAttribute,
  getAttributes,
  updateAttribute,
  deleteAttribute,
  AttributeStauts
} from './attribute.controller.js';

import { protectAdmin } from '../admin/admin.auth.js';

const router = express.Router();

router.use(protectAdmin);

router.post('/', createAttribute);
router.get('/', getAttributes);
router.put('/:id', updateAttribute);
router.patch('/:id', AttributeStauts);
router.delete('/:id', deleteAttribute);

export default router;
