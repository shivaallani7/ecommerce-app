import { Request, Response } from 'express';
import { body } from 'express-validator';
import { getSequelize } from '../config/database';
import { Order, OrderItem, OrderStatus, PaymentStatus, Product } from '../models';
import { AppError } from '../utils/AppError';
import { getPagination, buildPaginationResponse } from '../utils/pagination';
import { generateOrderNumber } from '../utils/slugify';
import { getCart, clearCart, calculateCartTotal } from '../services/cartService';
import { createPaymentIntent, confirmPaymentIntent } from '../services/stripeService';
import { trackEvent } from '../services/insights';

export const createOrderValidation = [
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.street').notEmpty(),
  body('shippingAddress.city').notEmpty(),
  body('shippingAddress.country').notEmpty(),
];

export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { shippingAddress, billingAddress, notes } = req.body as {
    shippingAddress: object;
    billingAddress?: object;
    notes?: string;
  };

  const cart = await getCart(userId);
  if (cart.items.length === 0) throw new AppError('Cart is empty', 400);

  const { subtotal, tax } = calculateCartTotal(cart);
  const shippingAmount = subtotal >= 50 ? 0 : 9.99;
  const totalAmount = parseFloat((subtotal + tax + shippingAmount).toFixed(2));

  const sequelize = getSequelize();
  const t = await sequelize.transaction();

  try {
    // Reserve stock
    for (const item of cart.items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: true });
      if (!product || !product.isActive) {
        throw new AppError(`Product ${item.name} is unavailable`, 400);
      }
      if (product.stockQuantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.name}`, 400);
      }
      await product.update(
        {
          stockQuantity: product.stockQuantity - item.quantity,
          salesCount: product.salesCount + item.quantity,
        },
        { transaction: t },
      );
    }

    const order = await Order.create(
      {
        orderNumber: generateOrderNumber(),
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        taxAmount: tax,
        shippingAmount,
        totalAmount,
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : null,
        notes: notes ?? null,
      },
      { transaction: t },
    );

    await OrderItem.bulkCreate(
      cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        productImageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
      })),
      { transaction: t },
    );

    // Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent(
      Math.round(totalAmount * 100),
      'usd',
      { orderId: order.id, orderNumber: order.orderNumber },
    );

    await order.update(
      { stripePaymentIntentId: paymentIntent.id },
      { transaction: t },
    );

    await t.commit();
    await clearCart(userId);

    trackEvent('order_created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: String(totalAmount),
    });

    res.status(201).json({
      success: true,
      data: {
        order,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

export async function confirmOrder(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const order = await Order.findOne({
    where: { id: orderId, userId: req.user!.userId },
  });
  if (!order) throw new AppError('Order not found', 404);

  if (order.stripePaymentIntentId) {
    const intent = await confirmPaymentIntent(order.stripePaymentIntentId);
    if (intent.status === 'succeeded') {
      await order.update({
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
      });
      trackEvent('order_paid', { orderId: order.id, orderNumber: order.orderNumber });
    }
  }

  res.json({ success: true, data: order });
}

export async function getUserOrders(req: Request, res: Response): Promise<void> {
  const { page, limit, offset } = getPagination(req);

  const { count, rows } = await Order.findAndCountAll({
    where: { userId: req.user!.userId },
    include: [{ model: OrderItem }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  res.json({ success: true, ...buildPaginationResponse(rows, count, { page, limit, offset }) });
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const order = await Order.findOne({
    where: { id: req.params.id, userId: req.user!.userId },
    include: [{ model: OrderItem }],
  });
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, data: order });
}

// ── Admin ──────────────────────────────────────────────────────────────
export async function getAllOrders(req: Request, res: Response): Promise<void> {
  const { page, limit, offset } = getPagination(req);
  const { status } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  res.json({ success: true, ...buildPaginationResponse(rows, count, { page, limit, offset }) });
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { status, trackingNumber } = req.body as {
    status: OrderStatus;
    trackingNumber?: string;
  };

  if (!Object.values(OrderStatus).includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  const order = await Order.findByPk(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const updates: Partial<Order> = { status };
  if (trackingNumber) (updates as Record<string, unknown>).trackingNumber = trackingNumber;
  if (status === OrderStatus.SHIPPED) (updates as Record<string, unknown>).shippedAt = new Date();
  if (status === OrderStatus.DELIVERED) (updates as Record<string, unknown>).deliveredAt = new Date();

  await order.update(updates);
  res.json({ success: true, data: order });
}
