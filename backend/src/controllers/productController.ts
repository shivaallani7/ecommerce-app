import { Request, Response } from 'express';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import { Product, Category, Review, User } from '../models';
import { AppError } from '../utils/AppError';
import { getPagination, buildPaginationResponse } from '../utils/pagination';
import { slugify } from '../utils/slugify';
import { setCache, getCache, deleteCache } from '../config/redis';
import { trackEvent } from '../services/insights';

const CACHE_TTL = 300; // 5 min

export const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }),
];

export async function getProducts(req: Request, res: Response): Promise<void> {
  const { page, limit, offset } = getPagination(req);
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    featured,
    sort = 'createdAt',
    order = 'DESC',
  } = req.query as Record<string, string>;

  const cacheKey = `products:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, ...cached });
    return;
  }

  const where: Record<string, unknown> = { isActive: true };

  if (search) {
    where[Op.or as unknown as string] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice && { [Op.gte]: parseFloat(minPrice) }),
      ...(maxPrice && { [Op.lte]: parseFloat(maxPrice) }),
    };
  }
  if (minRating) where.averageRating = { [Op.gte]: parseFloat(minRating) };
  if (featured === 'true') where.isFeatured = true;

  const allowedSortFields = ['createdAt', 'price', 'averageRating', 'salesCount', 'name'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
    limit,
    offset,
    order: [[sortField, sortOrder]],
    distinct: true,
  });

  const result = buildPaginationResponse(rows, count, { page, limit, offset });
  await setCache(cacheKey, result, CACHE_TTL);

  res.json({ success: true, ...result });
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const cacheKey = `product:${slug}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const product = await Product.findOne({
    where: { slug, isActive: true },
    include: [
      { model: Category, attributes: ['id', 'name', 'slug'] },
      {
        model: Review,
        where: { isApproved: true },
        required: false,
        limit: 10,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
      },
    ],
  });

  if (!product) throw new AppError('Product not found', 404);

  trackEvent('product_view', { productId: product.id, productName: product.name });
  await setCache(cacheKey, product, CACHE_TTL);

  res.json({ success: true, data: product });
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const product = await Product.findByPk(req.params.id, {
    include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const {
    name, description, shortDescription, price, salePrice,
    sku, stockQuantity, categoryId, brand, tags, isFeatured, images,
  } = req.body as {
    name: string; description?: string; shortDescription?: string;
    price: number; salePrice?: number; sku?: string; stockQuantity?: number;
    categoryId: string; brand?: string; tags?: string;
    isFeatured?: boolean; images?: string[];
  };

  const category = await Category.findByPk(categoryId);
  if (!category) throw new AppError('Category not found', 404);

  let slug = slugify(name);
  const existing = await Product.findOne({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const product = await Product.create({
    name, description, shortDescription, price, salePrice: salePrice ?? null,
    sku: sku ?? null, stockQuantity: stockQuantity ?? 0, categoryId, brand: brand ?? null,
    tags: tags ?? null, isFeatured: isFeatured ?? false,
    images: JSON.stringify(images ?? []), slug,
  });

  await deleteCache('products:*');
  res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  const updateData = req.body as Partial<{
    name: string; description: string; price: number; salePrice: number;
    stockQuantity: number; isActive: boolean; isFeatured: boolean;
    categoryId: string; images: string[]; brand: string; tags: string;
  }>;

  if (updateData.images) {
    (updateData as Record<string, unknown>).images = JSON.stringify(updateData.images);
  }
  if (updateData.name) {
    (updateData as Record<string, unknown>).slug = slugify(updateData.name);
  }

  await product.update(updateData);
  await deleteCache(`product:${product.slug}`);
  await deleteCache('products:*');

  res.json({ success: true, data: product });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  await product.destroy(); // soft delete (paranoid)
  await deleteCache(`product:${product.slug}`);
  await deleteCache('products:*');

  res.json({ success: true, message: 'Product deleted' });
}

export async function getFeaturedProducts(req: Request, res: Response): Promise<void> {
  const cacheKey = 'products:featured';
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const products = await Product.findAll({
    where: { isFeatured: true, isActive: true },
    include: [{ model: Category, attributes: ['id', 'name', 'slug'] }],
    limit: 12,
    order: [['salesCount', 'DESC']],
  });

  await setCache(cacheKey, products, CACHE_TTL);
  res.json({ success: true, data: products });
}
