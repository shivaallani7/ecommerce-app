import { Router } from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import categoryRoutes from './categories';
import orderRoutes from './orders';
import cartRoutes from './cart';
import reviewRoutes from './reviews';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/products/:productId/reviews', reviewRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
