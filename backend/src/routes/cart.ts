import { Router } from 'express';
import {
  getCartHandler, addToCartHandler, updateCartHandler,
  removeFromCartHandler, clearCartHandler, addToCartValidation,
} from '../controllers/cartController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getCartHandler);
router.post('/items', validate(addToCartValidation), addToCartHandler);
router.patch('/items/:productId', updateCartHandler);
router.delete('/items/:productId', removeFromCartHandler);
router.delete('/', clearCartHandler);

export default router;
