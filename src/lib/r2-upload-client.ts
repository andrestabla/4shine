import type { ModuleCode, PermissionAction } from '@/lib/permissions';

interface UploadEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
  detail?: string;
}

export interface R2UploadResponse {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
  fileName: string;
}

export interface R2UploadPresignResponse extends R2UploadResponse {
  uploadUrl: string;
  expiresIn: number;
}

export interface UploadToR2Input {
  file: File;
  moduleCode: ModuleCode;
  action: PermissionAction;
  pathPrefix?: string;
  entityTable?: string;
  fieldName?: string;
}

function buildUploadError(payload: UploadEnvelope<unknown> | null, status: number): string {
  if (!payload) return `Upload failed (${status})`;
  if (payload.error && payload.detail) return `${payload.error}: ${payload.detail}`;
  if (payload.error) return payload.error;
  if (payload.detail) return payload.detail;
  return `Upload failed (${status})`;
}

export async function uploadToR2(input: UploadToR2Input): Promise<R2UploadResponse> {
  const presignResponse = await fetch('/api/v1/uploads/r2/presign', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: input.file.name,
      fileType: input.file.type,
      fileSize: input.file.size,
      moduleCode: input.moduleCode,
      action: input.action,
      pathPrefix: input.pathPrefix,
      entityTable: input.entityTable,
      fieldName: input.fieldName,
    }),
  });

  let presignPayload: UploadEnvelope<R2UploadPresignResponse> | null = null;
  try {
    presignPayload = (await presignResponse.json()) as UploadEnvelope<R2UploadPresignResponse>;
  } catch {
    presignPayload = null;
  }

  if (presignResponse.ok && presignPayload?.ok && presignPayload.data?.uploadUrl) {
    try {
      const putResponse = await fetch(presignPayload.data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': input.file.type || 'application/octet-stream',
        },
        body: input.file,
      });

      if (putResponse.ok) {
        const { uploadUrl, expiresIn, ...result } = presignPayload.data;
        void uploadUrl;
        void expiresIn;
        return result;
      }
    } catch {
      // Falls back to server upload when browser direct upload is blocked (e.g. CORS/network).
    }
  }

  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('moduleCode', input.moduleCode);
  formData.append('action', input.action);
  if (input.pathPrefix) formData.append('pathPrefix', input.pathPrefix);
  if (input.entityTable) formData.append('entityTable', input.entityTable);
  if (input.fieldName) formData.append('fieldName', input.fieldName);

  const fallbackResponse = await fetch('/api/v1/uploads/r2', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  let fallbackPayload: UploadEnvelope<R2UploadResponse> | null = null;
  try {
    fallbackPayload = (await fallbackResponse.json()) as UploadEnvelope<R2UploadResponse>;
  } catch {
    fallbackPayload = null;
  }

  if (!fallbackResponse.ok || !fallbackPayload?.ok || !fallbackPayload.data) {
    throw new Error(buildUploadError(fallbackPayload, fallbackResponse.status));
  }

  return fallbackPayload.data;
}
