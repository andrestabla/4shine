import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deleteProduct, getProductByCode, updateProduct } from '@/features/productos/service';
import type { UpdateProductInput } from '@/features/productos/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { code } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () => getProductByCode(client, code)),
    );
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load product');
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { code } = await context.params;

  const body = await parseJsonBody<UpdateProductInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateProduct(client, identity, code, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_product',
          entityTable: 'app_billing.product_catalog',
          entityId: code,
          changeSummary: body as Record<string, unknown>,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update product');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { code } = await context.params;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await deleteProduct(client, identity, code);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_product',
          entityTable: 'app_billing.product_catalog',
          entityId: code,
        });
      }),
    );
    return NextResponse.json({ ok: true, data: { deleted: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete product');
  }
}
