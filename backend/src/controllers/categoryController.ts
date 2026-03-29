import { Request, Response } from 'express';
import { body } from 'express-validator';
import { Category, Product } from '../models';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/slugify';
import { getCache, setCache, deleteCache } from '../config/redis';

const CACHE_TTL = 600;

export const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

export async function getCategories(req: Request, res: Response): Promise<void> {
  const cacheKey = 'categories:all';
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const categories = await Category.findAll({
    where: { isActive: true, parentId: null },
    include: [{ model: Category, as: 'children', where: { isActive: true }, required: false }],
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC'],
    ],
  });

  await setCache(cacheKey, categories, CACHE_TTL);
  res.json({ success: true, data: categories });
}

export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  const category = await Category.findOne({
    where: { slug: req.params.slug, isActive: true },
  });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, data: category });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, description, parentId, sortOrder, imageUrl } = req.body as {
    name: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
    imageUrl?: string;
  };

  let slug = slugify(name);
  const existing = await Category.findOne({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const category = await Category.create({
    name,
    slug,
    description: description ?? null,
    parentId: parentId ?? null,
    sortOrder: sortOrder ?? 0,
    imageUrl: imageUrl ?? null,
  });

  await deleteCache('categories:*');
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const updates = req.body as Partial<{
    name: string; description: string; isActive: boolean;
    sortOrder: number; imageUrl: string;
  }>;
  if (updates.name) (updates as Record<string, unknown>).slug = slugify(updates.name);

  await category.update(updates);
  await deleteCache('categories:*');
  res.json({ success: true, data: category });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const productCount = await Product.count({ where: { categoryId: category.id } });
  if (productCount > 0) {
    throw new AppError('Cannot delete category with associated products', 409);
  }

  await category.destroy();
  await deleteCache('categories:*');
  res.json({ success: true, message: 'Category deleted' });
}
