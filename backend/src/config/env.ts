import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '5000'), 10),
  isProduction: process.env.NODE_ENV === 'production',

  db: {
    server: optional('DB_SERVER'),
    name: optional('DB_NAME', 'ecommerce'),
    user: optional('DB_USER'),
    password: optional('DB_PASSWORD'),
    url: optional('DATABASE_URL'),
  },

  jwt: {
    secret: optional('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: optional('JWT_EXPIRES_IN', '15m'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  azure: {
    storageConnectionString: optional('AZURE_STORAGE_CONNECTION_STRING'),
    storageContainerName: optional('AZURE_STORAGE_CONTAINER_NAME', 'product-images'),
    cdnEndpoint: optional('AZURE_CDN_ENDPOINT'),
    keyVaultUrl: optional('AZURE_KEY_VAULT_URL'),
    clientId: optional('AZURE_CLIENT_ID'),
    clientSecret: optional('AZURE_CLIENT_SECRET'),
    tenantId: optional('AZURE_TENANT_ID'),
    appInsightsConnectionString: optional('APPLICATIONINSIGHTS_CONNECTION_STRING'),
  },

  b2c: {
    tenantName: optional('AAD_B2C_TENANT_NAME'),
    clientId: optional('AAD_B2C_CLIENT_ID'),
    clientSecret: optional('AAD_B2C_CLIENT_SECRET'),
    policyName: optional('AAD_B2C_POLICY_NAME', 'B2C_1_signupsignin'),
  },

  redis: {
    connectionString: optional('REDIS_CONNECTION_STRING'),
    password: optional('REDIS_PASSWORD'),
  },

  stripe: {
    secretKey: optional('STRIPE_SECRET_KEY'),
    webhookSecret: optional('STRIPE_WEBHOOK_SECRET'),
  },

  cors: {
    allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
  },
};
