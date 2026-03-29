import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'Production-ready e-commerce REST API on Azure',
      contact: { name: 'API Support', email: 'support@yourdomain.com' },
    },
    servers: [
      { url: `http://localhost:${env.port}/api/v1`, description: 'Development' },
      { url: 'https://api.yourdomain.com/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['customer', 'admin'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            salePrice: { type: 'number', nullable: true },
            stockQuantity: { type: 'integer' },
            averageRating: { type: 'number' },
            reviewCount: { type: 'integer' },
            images: { type: 'string', description: 'JSON array of image URLs' },
            categoryId: { type: 'string', format: 'uuid' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
            totalAmount: { type: 'number' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
