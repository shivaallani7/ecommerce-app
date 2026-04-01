import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { User, Order, Product, OrderStatus, PaymentStatus } from '../models';
import { AppError } from '../utils/AppError';
import { getPagination, buildPaginationResponse } from '../utils/pagination';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalOrders,
    pendingOrders,
    totalProducts,
    lowStockProducts,
    recentRevenue,
    weekRevenue,
  ] = await Promise.all([
    User.count(),
    Order.count(),
    Order.count({ where: { status: OrderStatus.PENDING } }),
    Product.count({ where: { isActive: true } }),
    Product.count({ where: { stockQuantity: { [Op.lt]: 10 }, isActive: true } }),
    Order.sum('totalAmount', {
      where: { paymentStatus: PaymentStatus.PAID, createdAt: { [Op.gte]: thirtyDaysAgo } },
    }),
    Order.sum('totalAmount', {
      where: { paymentStatus: PaymentStatus.PAID, createdAt: { [Op.gte]: sevenDaysAgo } },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockProducts,
      revenue: {
        last30Days: recentRevenue ?? 0,
        last7Days: weekRevenue ?? 0,
      },
    },
  });
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const { page, limit, offset } = getPagination(req);
  const { search, role } = req.query;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where[Op.or as unknown as string] = [
      { email: { [Op.like]: `%${search}%` } },
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['passwordHash', 'refreshToken'] },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.json({ success: true, ...buildPaginationResponse(rows, count, { page, limit, offset }) });
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const { isActive } = req.body as { isActive: boolean };
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.id === req.user!.userId) throw new AppError('Cannot modify your own account', 400);

  await user.update({ isActive });
  res.json({ success: true, data: user.toJSON() });
}

export async function getSalesReport(req: Request, res: Response): Promise<void> {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await Order.findAll({
    where: {
      paymentStatus: PaymentStatus.PAID,
      createdAt: { [Op.gte]: since },
    },
    attributes: [
      [fn('CAST', literal("CONVERT(date, createdAt)")), 'date'],
      [fn('COUNT', col('id')), 'orderCount'],
      [fn('SUM', col('totalAmount')), 'revenue'],
    ],
    group: [literal("CONVERT(date, createdAt)") as unknown as string],
    order: [[literal("CONVERT(date, createdAt)"), 'ASC']],
    raw: true,
  });

  res.json({ success: true, data: orders });
}

export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  const { uploadProductImage: upload } = await import('../services/blobStorage');
  if (!req.file) throw new AppError('No file uploaded', 400);

  const url = await upload(req.file.buffer, req.file.mimetype, req.file.originalname);
  res.json({ success: true, data: { url } });
}
