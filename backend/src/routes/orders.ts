import { Router } from 'express';
import {
  createOrder, confirmOrder, getUserOrders,
  getOrderById, getAllOrders, updateOrderStatus,
  createOrderValidation,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

// Customer
router.post('/', authenticate, paymentLimiter, validate(createOrderValidation), createOrder);
router.post('/:orderId/confirm', authenticate, confirmOrder);
router.get('/my', authenticate, getUserOrders);
router.get('/my/:id', authenticate, getOrderById);

// Admin
router.get('/', authenticate, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;
