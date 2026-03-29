import { Request, Response } from 'express';
import { body } from 'express-validator';
import { Review, Product, Order, OrderStatus, User } from '../models';
import { AppError } from '../utils/AppError';
import { getPagination, buildPaginationResponse } from '../utils/pagination';
import { deleteCache } from '../config/redis';

export const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('body').optional().trim().isLength({ max: 2000 }),
];

export async function getProductReviews(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;
  const { page, limit, offset } = getPagination(req);

  const { count, rows } = await Review.findAndCountAll({
    where: { productId, isApproved: true },
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.json({ success: true, ...buildPaginationResponse(rows, count, { page, limit, offset }) });
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;
  const { rating, title, body: reviewBody } = req.body as {
    rating: number;
    title?: string;
    body?: string;
  };
  const userId = req.user!.userId;

  const product = await Product.findByPk(productId);
  if (!product) throw new AppError('Product not found', 404);

  // Check for existing review
  const existing = await Review.findOne({ where: { userId, productId } });
  if (existing) throw new AppError('You have already reviewed this product', 409);

  // Check if verified purchase
  const purchasedOrder = await Order.findOne({
    where: { userId, status: OrderStatus.DELIVERED },
    include: [{ association: 'items', where: { productId }, required: true }],
  });

  const review = await Review.create({
    userId,
    productId,
    rating,
    title: title ?? null,
    body: reviewBody ?? null,
    isVerifiedPurchase: !!purchasedOrder,
    isApproved: true, // auto-approve; could route to moderation queue
  });

  // Recalculate product rating
  const allReviews = await Review.findAll({ where: { productId, isApproved: true } });
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await product.update({
    averageRating: parseFloat(avg.toFixed(2)),
    reviewCount: allReviews.length,
  });
  await deleteCache(`product:${product.slug}`);

  res.status(201).json({ success: true, data: review });
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  const review = await Review.findByPk(req.params.reviewId);
  if (!review) throw new AppError('Review not found', 404);

  // Owner or admin
  if (review.userId !== req.user!.userId && req.user!.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const product = await Product.findByPk(review.productId);
  await review.destroy();

  if (product) {
    const remaining = await Review.findAll({ where: { productId: product.id, isApproved: true } });
    const avg = remaining.length
      ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length
      : 0;
    await product.update({ averageRating: parseFloat(avg.toFixed(2)), reviewCount: remaining.length });
    await deleteCache(`product:${product.slug}`);
  }

  res.json({ success: true, message: 'Review deleted' });
}
