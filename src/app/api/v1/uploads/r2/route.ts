import { NextResponse } from 'next/server';
import { MODULE_CODES, PERMISSION_ACTIONS, type ModuleCode, type PermissionAction } from '@/lib/permissions';
import { buildRequestSummary, writeAuditLog } from '@/server/audit/service';
import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getR2StorageConfig, uploadFileToR2 } from '@/server/storage/r2-upload';

const VALID_MODULE_CODES = new Set<string>(MODULE_CODES);
const VALID_ACTIONS = new Set<string>(PERMISSION_ACTIONS);
const VALID_UPLOAD_ACTIONS = new Set<PermissionAction>(['create', 'update', 'manage']);

export const runtime = 'nodejs';

const DISCOVERY_CONTEXT_MIN_MAX_SIZE_MB = 200;
const DISCOVERY_CONTEXT_EXTRA_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function asString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid multipart form body' }, { status: 400 });
  }

  const fileEntry = formData.get('file');
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 });
  }

  const moduleCodeInput = asString(formData.get('moduleCode')) || 'usuarios';
  const actionInput = asString(formData.get('action')) || 'manage';
  const pathPrefix = asString(formData.get('pathPrefix')) || undefined;
  const entityTableInput = asString(formData.get('entityTable'));
  const entityTable = entityTableInput.length > 0 ? entityTableInput : 'r2.object_upload';
  const fieldName = asString(formData.get('fieldName')) || undefined;
  const isDiscoveryContextUpload =
    moduleCodeInput === 'descubrimiento' &&
    (fieldName === 'context_documents' ||
      (pathPrefix?.startsWith('descubrimiento/context') ?? false));

  if (!VALID_MODULE_CODES.has(moduleCodeInput)) {
    return NextResponse.json(
      { ok: false, error: `Invalid moduleCode: ${moduleCodeInput}` },
      { status: 400 },
    );
  }

  if (!VALID_ACTIONS.has(actionInput)) {
    return NextResponse.json(
      { ok: false, error: `Invalid action: ${actionInput}` },
      { status: 400 },
    );
  }

  const moduleCode = moduleCodeInput as ModuleCode;
  const action = actionInput as PermissionAction;
  if (!VALID_UPLOAD_ACTIONS.has(action)) {
    return NextResponse.json(
      { ok: false, error: `Invalid upload action: ${action}` },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, moduleCode, action);

        const config = await getR2StorageConfig(client, identity.userId);
        if (isDiscoveryContextUpload) {
          const expandedBytes = Math.max(
            config.maxFileSizeBytes,
            DISCOVERY_CONTEXT_MIN_MAX_SIZE_MB * 1024 * 1024,
          );
          const mergedMimeTypes = Array.from(
            new Set([
              ...config.allowedMimeTypes,
              ...DISCOVERY_CONTEXT_EXTRA_MIME_TYPES,
            ]),
          );
          config.maxFileSizeBytes = expandedBytes;
          config.allowedMimeTypes = mergedMimeTypes;
        }

        if (fileEntry.size > config.maxFileSizeBytes) {
          const maxMb = Math.round(config.maxFileSizeBytes / (1024 * 1024));
          throw new Error(`File too large. Max allowed: ${maxMb}MB`);
        }

        const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
        const uploaded = await uploadFileToR2(config, {
          fileName: fileEntry.name,
          fileType: fileEntry.type,
          fileBuffer,
          pathPrefix,
        });

        await writeAuditLog(client, {
          actorUserId: identity.userId,
          action: 'upload_r2_object',
          moduleCode,
          entityTable,
          changeSummary: buildRequestSummary(request, {
            fieldName,
            bucket: uploaded.bucket,
            key: uploaded.key,
            url: uploaded.url,
            size: uploaded.size,
            contentType: uploaded.contentType,
          }),
        });

        return uploaded;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    const detail = error instanceof Error ? error.message : 'Unknown error';
    const status = detail.toLowerCase().includes('file too large') ? 413 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to upload file to R2',
        detail,
      },
      { status },
    );
  }
}
