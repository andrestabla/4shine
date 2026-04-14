import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { PoolClient } from 'pg';

interface OrganizationRow {
  organization_id: string | null;
}

interface R2IntegrationRow {
  integration_id: string;
  enabled: boolean;
  secret_value: string | null;
  wizard_data: Record<string, unknown> | null;
}

const DEFAULT_R2_MAX_FILE_SIZE_MB = 1000;
const ABSOLUTE_R2_MAX_FILE_SIZE_MB = 1000;

export interface R2StorageConfig {
  organizationId: string;
  integrationId: string;
  enabled: boolean;
  accountId: string;
  bucketName: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
}

export interface UploadR2Input {
  fileName: string;
  fileType: string;
  fileBuffer: Buffer;
  pathPrefix?: string;
}

export interface PrepareR2UploadInput {
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  pathPrefix?: string;
}

export interface UploadR2Result {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
  fileName: string;
}

export interface PreparedR2Upload {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
  fileName: string;
}

function sanitizeSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function normalizePrefix(value: string | undefined): string {
  if (!value) return 'uploads';

  const segments = value
    .split('/')
    .map((segment) => sanitizeSegment(segment.trim()))
    .filter((segment) => segment.length > 0);

  return segments.length > 0 ? segments.join('/') : 'uploads';
}

function normalizeFileName(value: string | undefined): string {
  const fallback = `file-${randomUUID().slice(0, 8)}`;
  if (!value || value.trim().length === 0) return fallback;

  const trimmed = value.trim();
  const dotIndex = trimmed.lastIndexOf('.');
  const rawName = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  const rawExt = dotIndex > 0 ? trimmed.slice(dotIndex + 1) : '';
  const name = sanitizeSegment(rawName).slice(0, 80) || fallback;
  const ext = sanitizeSegment(rawExt).slice(0, 12);
  return ext ? `${name}.${ext}` : name;
}

function parseWizardData(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const data = value as Record<string, unknown>;
  const output: Record<string, string> = {};
  for (const [key, currentValue] of Object.entries(data)) {
    if (currentValue === null || currentValue === undefined) continue;
    output[key] = String(currentValue).trim();
  }
  return output;
}

function parseAllowedMimeTypes(input: string | undefined): string[] {
  if (!input) return [];

  // Some configurations persist escaped line breaks (e.g. "\\n") instead of actual newlines.
  const normalized = input
    .replace(/\\r\\n/gi, '\n')
    .replace(/\\n/gi, '\n')
    .replace(/\\r/gi, '\n')
    .replace(/\\t/gi, '\t');

  return normalized
    .split(/[\n,;]/g)
    .map((value) => value.trim().toLowerCase().replace(/^['"]|['"]$/g, ''))
    .filter((value) => value.length > 0);
}

function isMimeTypeAllowed(fileType: string, allowList: string[]): boolean {
  if (!fileType) return true;
  if (allowList.length === 0) return true;

  const normalized = fileType.toLowerCase();
  return allowList.some((allowed) => {
    if (allowed === normalized) return true;
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -1);
      return normalized.startsWith(prefix);
    }
    return false;
  });
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function buildObjectUrl(config: R2StorageConfig, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const publicBaseUrl = normalizeBaseUrl(config.publicBaseUrl);
  return `${publicBaseUrl}/${encodedKey}`;
}

async function resolveOrganizationId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<OrganizationRow>(
    `
      SELECT u.organization_id::text
      FROM app_core.users u
      WHERE u.user_id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  const organizationId = rows[0]?.organization_id;
  if (organizationId) return organizationId;

  const { rows: fallbackRows } = await client.query<{ organization_id: string }>(
    `
      SELECT o.organization_id::text
      FROM app_core.organizations o
      ORDER BY o.created_at
      LIMIT 1
    `,
  );

  const fallbackOrganizationId = fallbackRows[0]?.organization_id;
  if (!fallbackOrganizationId) {
    throw new Error('No organization found to resolve R2 configuration');
  }
  return fallbackOrganizationId;
}

export async function getR2StorageConfig(
  client: PoolClient,
  actorUserId: string,
): Promise<R2StorageConfig> {
  const organizationId = await resolveOrganizationId(client, actorUserId);
  const { rows } = await client.query<R2IntegrationRow>(
    `
      SELECT
        ic.integration_id::text,
        ic.enabled,
        ic.secret_value,
        ic.wizard_data
      FROM app_admin.integration_configs ic
      WHERE ic.organization_id = $1::uuid
        AND ic.integration_key = 'r2'
      LIMIT 1
    `,
    [organizationId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('R2 integration is not configured for this organization');
  }

  const wizardData = parseWizardData(row.wizard_data);
  const accountId = wizardData.accountId ?? '';
  const endpoint =
    wizardData.endpoint ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const bucketName = wizardData.bucketName ?? '';
  const accessKeyId = wizardData.accessKeyId ?? '';
  const secretAccessKey = row.secret_value?.trim() || wizardData.secretAccessKey || '';
  const region = wizardData.region || 'auto';
  const publicBaseUrl =
    wizardData.publicBaseUrl ||
    wizardData.publicUrl ||
    wizardData.assetsBaseUrl ||
    wizardData.bucketPublicUrl ||
    (bucketName ? `https://${bucketName}.r2.dev` : '') ||
    `${normalizeBaseUrl(endpoint)}/${bucketName}`;

  const parsedMaxFileSizeMb = Number.parseInt(
    wizardData.maxFileSizeMb || String(DEFAULT_R2_MAX_FILE_SIZE_MB),
    10,
  );
  const normalizedMaxFileSizeMb =
    Number.isFinite(parsedMaxFileSizeMb) && parsedMaxFileSizeMb > 0
      ? parsedMaxFileSizeMb
      : DEFAULT_R2_MAX_FILE_SIZE_MB;
  const safeMaxFileSizeMb = Math.min(normalizedMaxFileSizeMb, ABSOLUTE_R2_MAX_FILE_SIZE_MB);
  const allowedMimeTypes = parseAllowedMimeTypes(wizardData.allowedMimeTypes);

  if (!endpoint || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 configuration is incomplete. Please set bucket, endpoint, access key and secret key.',
    );
  }

  return {
    organizationId,
    integrationId: row.integration_id,
    enabled: row.enabled,
    accountId,
    bucketName,
    endpoint: normalizeBaseUrl(endpoint),
    region,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: normalizeBaseUrl(publicBaseUrl),
    maxFileSizeBytes: safeMaxFileSizeMb * 1024 * 1024,
    allowedMimeTypes,
  };
}

export async function uploadFileToR2(
  config: R2StorageConfig,
  input: UploadR2Input,
): Promise<UploadR2Result> {
  const prepared = prepareR2Upload(config, {
    fileName: input.fileName,
    fileType: input.fileType,
    fileSizeBytes: input.fileBuffer.byteLength,
    pathPrefix: input.pathPrefix,
  });

  const client = createR2S3Client(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: prepared.key,
      Body: input.fileBuffer,
      ContentType: prepared.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return prepared;
}

export function createR2S3Client(config: R2StorageConfig): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function prepareR2Upload(
  config: R2StorageConfig,
  input: PrepareR2UploadInput,
): PreparedR2Upload {
  const contentType = input.fileType?.trim() || 'application/octet-stream';
  if (!isMimeTypeAllowed(contentType, config.allowedMimeTypes)) {
    throw new Error(`MIME type not allowed for upload: ${contentType}`);
  }

  const fileSizeBytes = Number(input.fileSizeBytes ?? 0);
  if (Number.isFinite(fileSizeBytes) && fileSizeBytes > config.maxFileSizeBytes) {
    const maxMb = Math.round(config.maxFileSizeBytes / (1024 * 1024));
    throw new Error(`File too large. Max allowed: ${maxMb}MB`);
  }

  const safePrefix = normalizePrefix(input.pathPrefix);
  const safeFileName = normalizeFileName(input.fileName);
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const stamp = now.toISOString().replace(/[^\d]/g, '').slice(0, 14);
  const key = `${safePrefix}/${now.getUTCFullYear()}/${month}/${day}/${stamp}-${randomUUID().slice(0, 8)}-${safeFileName}`;

  return {
    key,
    bucket: config.bucketName,
    url: buildObjectUrl(config, key),
    size: Math.max(0, fileSizeBytes),
    contentType,
    fileName: safeFileName,
  };
}
