/**
 * Seed script – populates the database with sample categories, products, and an admin user.
 * Usage: npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import 'express-async-errors';
import { connectDatabase } from '../src/config/database';
import { Category, Product, User, UserRole } from '../src/models';
import { logger } from '../src/utils/logger';

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets and tech products', sortOrder: 1 },
  { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', sortOrder: 2 },
  { name: 'Home & Garden', slug: 'home-garden', description: 'For your home and outdoor spaces', sortOrder: 3 },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear for every sport', sortOrder: 4 },
  { name: 'Books', slug: 'books', description: 'Physical and digital books', sortOrder: 5 },
  { name: 'Beauty & Health', slug: 'beauty-health', description: 'Personal care products', sortOrder: 6 },
];

async function seedCategories(): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const [category] = await Category.findOrCreate({
      where: { slug: cat.slug },
      defaults: { ...cat, isActive: true },
    });
    categoryMap.set(cat.slug, category.id);
    logger.info(`Category: ${category.name}`);
  }
  return categoryMap;
}

async function seedProducts(categoryMap: Map<string, string>): Promise<void> {
  const products = [
    {
      name: 'Wireless Noise-Cancelling Headphones',
      slug: 'wireless-noise-cancelling-headphones',
      shortDescription: 'Premium over-ear headphones with 30-hour battery life',
      description: 'Experience unparalleled sound quality with active noise cancellation. Features Bluetooth 5.0, 30-hour battery, foldable design, and built-in microphone for crystal-clear calls.',
      price: 299.99,
      salePrice: 249.99,
      sku: 'ELEC-WNC-001',
      stockQuantity: 50,
      categoryId: categoryMap.get('electronics')!,
      brand: 'SoundPro',
      isFeatured: true,
      images: JSON.stringify(['https://placehold.co/600x600?text=Headphones']),
    },
    {
      name: 'Smart Watch Series 5',
      slug: 'smart-watch-series-5',
      shortDescription: 'Advanced fitness tracking with AMOLED display',
      description: 'Track your health 24/7 with heart rate monitoring, sleep tracking, and GPS. Water-resistant up to 50m. Compatible with iOS and Android.',
      price: 399.99,
      sku: 'ELEC-SW-005',
      stockQuantity: 35,
      categoryId: categoryMap.get('electronics')!,
      brand: 'TechWear',
      isFeatured: true,
      images: JSON.stringify(['https://placehold.co/600x600?text=SmartWatch']),
    },
    {
      name: 'Premium Yoga Mat',
      slug: 'premium-yoga-mat',
      shortDescription: 'Non-slip 6mm thick eco-friendly yoga mat',
      description: 'Made from natural rubber with a moisture-wicking microfiber top layer. Ideal for hot yoga and daily practice. Includes carrying strap.',
      price: 79.99,
      salePrice: 59.99,
      sku: 'SPRT-YM-001',
      stockQuantity: 120,
      categoryId: categoryMap.get('sports-outdoors')!,
      brand: 'ZenFlex',
      isFeatured: true,
      images: JSON.stringify(['https://placehold.co/600x600?text=YogaMat']),
    },
    {
      name: 'Stainless Steel Water Bottle 32oz',
      slug: 'stainless-steel-water-bottle-32oz',
      shortDescription: 'Triple-insulated keeps drinks cold 24h, hot 12h',
      description: 'BPA-free food-grade stainless steel. Leak-proof lid. Wide mouth for easy cleaning and ice cubes. Available in 6 colors.',
      price: 34.99,
      sku: 'HOME-WB-032',
      stockQuantity: 200,
      categoryId: categoryMap.get('home-garden')!,
      brand: 'HydroLux',
      isFeatured: false,
      images: JSON.stringify(['https://placehold.co/600x600?text=WaterBottle']),
    },
    {
      name: 'Men\'s Classic Fit Oxford Shirt',
      slug: 'mens-classic-fit-oxford-shirt',
      shortDescription: '100% cotton Oxford weave, wrinkle-resistant',
      description: 'A timeless wardrobe staple crafted from premium Oxford cotton. Classic fit, button-down collar. Machine washable. Available in 8 colors and sizes S-XXL.',
      price: 59.99,
      sku: 'CLT-MOXF-001',
      stockQuantity: 80,
      categoryId: categoryMap.get('clothing')!,
      brand: 'ClassicWear',
      isFeatured: true,
      images: JSON.stringify(['https://placehold.co/600x600?text=OxfordShirt']),
    },
    {
      name: 'Vitamin C + Zinc Immune Support',
      slug: 'vitamin-c-zinc-immune-support',
      shortDescription: '60 gummies – tropical flavour, 1000mg Vitamin C',
      description: 'Supports immune health with 1000mg Vitamin C and 10mg Zinc per serving. No artificial colours or flavours. Vegan-friendly.',
      price: 24.99,
      salePrice: 19.99,
      sku: 'HLTH-VC-001',
      stockQuantity: 300,
      categoryId: categoryMap.get('beauty-health')!,
      brand: 'VitaBoost',
      isFeatured: false,
      images: JSON.stringify(['https://placehold.co/600x600?text=Vitamins']),
    },
    {
      name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      slug: 'clean-code-handbook-agile-software',
      shortDescription: 'Robert C. Martin – the definitive guide to writing clean code',
      description: 'A must-read for every software developer. Learn how to distinguish good code from bad code, write good code, and transform bad code into good code.',
      price: 44.99,
      sku: 'BOOK-CC-001',
      stockQuantity: 40,
      categoryId: categoryMap.get('books')!,
      brand: 'Prentice Hall',
      isFeatured: true,
      images: JSON.stringify(['https://placehold.co/600x600?text=CleanCode']),
    },
    {
      name: '4K Ultra HD Smart TV 55"',
      slug: '4k-ultra-hd-smart-tv-55',
      shortDescription: 'Crystal-clear 4K display with built-in streaming apps',
      description: 'Immersive 4K HDR display with Dolby Vision and Atmos. Built-in Wi-Fi, HDMI 2.1 ports, USB 3.0. Smart OS with Netflix, Prime Video and more pre-installed.',
      price: 799.99,
      salePrice: 699.99,
      sku: 'ELEC-TV-55',
      stockQuantity: 15,
      categoryId: categoryMap.get('electronics')!,
      brand: 'VisionTech',
      isFeatured: true,
      images: JSON.stringify(['https://placehold.co/600x600?text=SmartTV']),
    },
  ];

  for (const p of products) {
    const [product, created] = await Product.findOrCreate({
      where: { slug: p.slug },
      defaults: { ...p, isActive: true, averageRating: 0, reviewCount: 0, salesCount: 0 },
    });
    logger.info(`Product ${created ? 'created' : 'exists'}: ${product.name}`);
  }
}

async function seedAdminUser(): Promise<void> {
  const [admin, created] = await User.findOrCreate({
    where: { email: 'admin@shopazure.dev' },
    defaults: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@shopazure.dev',
      passwordHash: 'Admin@1234', // BeforeCreate hook will hash
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  logger.info(`Admin user ${created ? 'created' : 'already exists'}: ${admin.email}`);

  const [customer, cCreated] = await User.findOrCreate({
    where: { email: 'customer@shopazure.dev' },
    defaults: {
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'customer@shopazure.dev',
      passwordHash: 'Customer@1234',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });
  logger.info(`Customer ${cCreated ? 'created' : 'already exists'}: ${customer.email}`);
}

async function main(): Promise<void> {
  logger.info('🌱 Starting seed...');
  await connectDatabase();

  const categoryMap = await seedCategories();
  await seedProducts(categoryMap);
  await seedAdminUser();

  logger.info('✅ Seed complete!');
  logger.info('');
  logger.info('Admin credentials:');
  logger.info('  Email:    admin@shopazure.dev');
  logger.info('  Password: Admin@1234');
  logger.info('');
  logger.info('Customer credentials:');
  logger.info('  Email:    customer@shopazure.dev');
  logger.info('  Password: Customer@1234');
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
