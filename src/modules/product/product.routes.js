import express from 'express';
import {
  addProductAttribute,
  addProductImage,
  addProductSelection,
  addSelectionOption,
  createProduct,
  deleteProduct,
  deleteProductAttribute,
  deleteProductImage,
  deleteProductSelection,
  deleteSelectionOption,
  getProductById,
  getProducts,
  ProductStatus,
  updateProductAttribute,
  updateProductBasicData,
  updateProductImage,
  updateProductSelection,
} from './product.controller.js';

import { protectAdmin } from '../admin/admin.auth.js';
import upload from '../../middlewares/multer.js';

const router = express.Router();

router.use(protectAdmin);

router.post('/', upload.array('images'), createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProductBasicData);
router.patch('/:id', ProductStatus);
router.delete('/:productId', deleteProduct);
// Images
router.post('/images/:productId', upload.single('image'), addProductImage);
router.put('/images/:productId', upload.single('image'), updateProductImage);
router.delete('/images/:productId/:imageId', deleteProductImage);
// attribute
router.post('/attributes/:productId', addProductAttribute);
router.put('/attributes/:productId', updateProductAttribute);
router.delete('/attributes/:productId/:attributeId', deleteProductAttribute);
// selections
router.post('/selections/:productId', addProductSelection);
router.put('/selections/:productId', updateProductSelection);
router.delete('/selections/:productId/:selectionId', deleteProductSelection);
//options
router.post('/selections/:productId/:selectionId/options', addSelectionOption);
router.delete('/selections/:productId/:selectionId/options/:optionId', deleteSelectionOption);

export default router;
