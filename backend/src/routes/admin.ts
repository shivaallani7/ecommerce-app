import { Router } from 'express';
import multer from 'multer';
import {
  getDashboardStats, getAllUsers, updateUserStatus,
  getSalesReport, uploadProductImage,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/reports/sales', getSalesReport);
router.post('/upload/image', upload.single('image'), uploadProductImage);

export default router;
