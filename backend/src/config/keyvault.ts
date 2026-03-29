import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { env } from './env';
import { logger } from '../utils/logger';

let secretClient: SecretClient | null = null;

function getSecretClient(): SecretClient | null {
  if (!env.azure.keyVaultUrl) return null;
  if (!secretClient) {
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(env.azure.keyVaultUrl, credential);
  }
  return secretClient;
}

export async function getSecret(secretName: string): Promise<string | undefined> {
  const client = getSecretClient();
  if (!client) {
    logger.warn('Key Vault not configured; falling back to env vars.');
    return undefined;
  }
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (err) {
    logger.error(`Failed to fetch secret "${secretName}" from Key Vault:`, err);
    return undefined;
  }
}

/**
 * Loads critical secrets from Azure Key Vault into process.env at startup.
 * Falls back gracefully if Key Vault is unavailable (local dev).
 */
export async function loadSecretsFromKeyVault(): Promise<void> {
  const client = getSecretClient();
  if (!client) {
    logger.info('Skipping Key Vault secret loading (URL not configured).');
    return;
  }

  const secretMap: Record<string, string> = {
    'jwt-secret': 'JWT_SECRET',
    'jwt-refresh-secret': 'JWT_REFRESH_SECRET',
    'db-password': 'DB_PASSWORD',
    'stripe-secret-key': 'STRIPE_SECRET_KEY',
    'stripe-webhook-secret': 'STRIPE_WEBHOOK_SECRET',
    'redis-password': 'REDIS_PASSWORD',
    'azure-storage-connection-string': 'AZURE_STORAGE_CONNECTION_STRING',
  };

  const results = await Promise.allSettled(
    Object.entries(secretMap).map(async ([kvName, envName]) => {
      const value = await getSecret(kvName);
      if (value) process.env[envName] = value;
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  logger.info(`Key Vault secrets loaded. Failed: ${failed}/${results.length}`);
}
