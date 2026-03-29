import { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  calculateCartTotal,
} from '../services/cartService';
import { trackEvent } from '../services/insights';

export const addToCartValidation = [
  body('productId').isUUID().withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export async function getCartHandler(req: Request, res: Response): Promise<void> {
  const cart = await getCart(req.user!.userId);
  const totals = calculateCartTotal(cart);
  res.json({ success: true, data: { ...cart, ...totals } });
}

export async function addToCartHandler(req: Request, res: Response): Promise<void> {
  const { productId, quantity } = req.body as { productId: string; quantity: number };
  const cart = await addToCart(req.user!.userId, productId, quantity);
  const totals = calculateCartTotal(cart);
  trackEvent('add_to_cart', { productId, quantity: String(quantity) });
  res.json({ success: true, data: { ...cart, ...totals } });
}

export async function updateCartHandler(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;
  const { quantity } = req.body as { quantity: number };
  const cart = await updateCartItem(req.user!.userId, productId, quantity);
  const totals = calculateCartTotal(cart);
  res.json({ success: true, data: { ...cart, ...totals } });
}

export async function removeFromCartHandler(req: Request, res: Response): Promise<void> {
  const cart = await removeFromCart(req.user!.userId, req.params.productId);
  const totals = calculateCartTotal(cart);
  res.json({ success: true, data: { ...cart, ...totals } });
}

export async function clearCartHandler(req: Request, res: Response): Promise<void> {
  await clearCart(req.user!.userId);
  res.json({ success: true, message: 'Cart cleared' });
}
