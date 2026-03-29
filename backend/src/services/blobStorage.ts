import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

let containerClient: ContainerClient | null = null;

function getContainerClient(): ContainerClient {
  if (!containerClient) {
    if (!env.azure.storageConnectionString) {
      throw new AppError('Azure Storage not configured', 500);
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      env.azure.storageConnectionString,
    );
    containerClient = blobServiceClient.getContainerClient(env.azure.storageContainerName);
  }
  return containerClient;
}

export async function uploadProductImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new AppError(`File type ${mimeType} not allowed`, 400);
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new AppError('File size exceeds 5 MB limit', 400);
  }

  const ext = originalName.split('.').pop() ?? 'jpg';
  const blobName = `products/${uuidv4()}.${ext}`;

  const client = getContainerClient();
  const blockBlobClient = client.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  // Return CDN URL if configured, otherwise direct blob URL
  if (env.azure.cdnEndpoint) {
    return `${env.azure.cdnEndpoint}/${env.azure.storageContainerName}/${blobName}`;
  }
  return blockBlobClient.url;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const client = getContainerClient();
    // Extract blob name from URL
    const blobName = imageUrl.split(`/${env.azure.storageContainerName}/`)[1];
    if (!blobName) return;
    const blockBlobClient = client.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (err) {
    logger.warn('Failed to delete blob:', err);
  }
}

export async function ensureContainerExists(): Promise<void> {
  const client = getContainerClient();
  await client.createIfNotExists({ access: 'blob' });
  logger.info(`Blob container "${env.azure.storageContainerName}" ready.`);
}
