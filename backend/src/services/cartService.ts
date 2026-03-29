import { getCache, setCache, deleteCache } from '../config/redis';
import { Product } from '../models';
import { AppError } from '../utils/AppError';

const CART_TTL = 7 * 24 * 60 * 60; // 7 days

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

function cartKey(userId: string): string {
  return `cart:${userId}`;
}

export async function getCart(userId: string): Promise<Cart> {
  const cached = await getCache<Cart>(cartKey(userId));
  return cached ?? { userId, items: [], updatedAt: new Date().toISOString() };
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) throw new AppError('Product not found', 404);
  if (product.stockQuantity < quantity) {
    throw new AppError(`Only ${product.stockQuantity} units available`, 400);
  }

  const cart = await getCart(userId);
  const existing = cart.items.find((i) => i.productId === productId);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stockQuantity) {
      throw new AppError(`Only ${product.stockQuantity} units available`, 400);
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: product.effectivePrice,
      imageUrl: product.imageList[0] ?? '',
      quantity,
      stockQuantity: product.stockQuantity,
    });
  }

  cart.updatedAt = new Date().toISOString();
  await setCache(cartKey(userId), cart, CART_TTL);
  return cart;
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  if (quantity <= 0) return removeFromCart(userId, productId);

  const product = await Product.findByPk(productId);
  if (!product) throw new AppError('Product not found', 404);
  if (product.stockQuantity < quantity) {
    throw new AppError(`Only ${product.stockQuantity} units available`, 400);
  }

  const cart = await getCart(userId);
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) throw new AppError('Item not in cart', 404);

  item.quantity = quantity;
  item.stockQuantity = product.stockQuantity;
  cart.updatedAt = new Date().toISOString();
  await setCache(cartKey(userId), cart, CART_TTL);
  return cart;
}

export async function removeFromCart(userId: string, productId: string): Promise<Cart> {
  const cart = await getCart(userId);
  cart.items = cart.items.filter((i) => i.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  await setCache(cartKey(userId), cart, CART_TTL);
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  await deleteCache(cartKey(userId));
}

export function calculateCartTotal(cart: Cart): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = parseFloat((subtotal * 0.08).toFixed(2)); // 8% tax
  const total = parseFloat((subtotal + tax).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), tax, total };
}
