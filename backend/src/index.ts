// Must initialize Application Insights FIRST before other imports
import { initAppInsights } from './services/insights';
initAppInsights();

import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { loadSecretsFromKeyVault } from './config/keyvault';
import { ensureContainerExists } from './services/blobStorage';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app = express();

// ── Security headers ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }),
);

// ── CORS ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Body parsing ───────────────────────────────────────────────────────
// Raw body for Stripe webhooks
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ── Logging ────────────────────────────────────────────────────────────
app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ── Rate limiting ──────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── API Docs ───────────────────────────────────────────────────────────
if (!env.isProduction) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  logger.info('Swagger UI available at /api-docs');
}

// ── Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 + Error handlers ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // Load secrets from Key Vault (no-op if not configured)
  await loadSecretsFromKeyVault();

  // Database
  await connectDatabase();

  // Redis (eager connect)
  getRedisClient();

  // Ensure Azure Blob container exists (non-fatal)
  if (env.azure.storageConnectionString) {
    try {
      await ensureContainerExists();
    } catch (err) {
      logger.warn('Blob storage container setup failed (non-fatal):', err);
    }
  }

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
