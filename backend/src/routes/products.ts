import { Router } from 'express';
import {
  getProducts, getProductBySlug, getProductById, createProduct,
  updateProduct, deleteProduct, getFeaturedProducts, productValidation,
} from '../controllers/productController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Admin-only mutations
router.post('/', authenticate, requireAdmin, validate(productValidation), createProduct);
router.patch('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
