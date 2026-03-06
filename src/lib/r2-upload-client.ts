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
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('moduleCode', input.moduleCode);
  formData.append('action', input.action);
  if (input.pathPrefix) formData.append('pathPrefix', input.pathPrefix);
  if (input.entityTable) formData.append('entityTable', input.entityTable);
  if (input.fieldName) formData.append('fieldName', input.fieldName);

  const response = await fetch('/api/v1/uploads/r2', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  let payload: UploadEnvelope<R2UploadResponse> | null = null;
  try {
    payload = (await response.json()) as UploadEnvelope<R2UploadResponse>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(buildUploadError(payload, response.status));
  }

  return payload.data;
}
