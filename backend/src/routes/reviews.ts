import { Router } from 'express';
import {
  getProductReviews, createReview, deleteReview, reviewValidation,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router({ mergeParams: true });

router.get('/', getProductReviews);
router.post('/', authenticate, validate(reviewValidation), createReview);
router.delete('/:reviewId', authenticate, deleteReview);

export default router;
