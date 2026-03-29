import { Router } from 'express';
import {
  getCategories, getCategoryBySlug, createCategory,
  updateCategory, deleteCategory, categoryValidation,
} from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

router.post('/', authenticate, requireAdmin, validate(categoryValidation), createCategory);
router.patch('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
