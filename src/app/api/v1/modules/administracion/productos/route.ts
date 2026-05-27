import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createProduct, listProducts } from '@/features/productos/service';
import type { CreateProductInput, ProductGroup } from '@/features/productos/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

const VALID_GROUPS: ProductGroup[] = ['discovery', 'mentoring_pack', 'program'];

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get('includeInactive') === '1';
  const groupsParam = url.searchParams.get('groups');
  const groups = groupsParam
    ? (groupsParam.split(',').filter((g) => VALID_GROUPS.includes(g as ProductGroup)) as ProductGroup[])
    : undefined;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listProducts(client, { includeInactive, groups }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list products');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateProductInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createProduct(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'create_product',
          entityTable: 'app_billing.product_catalog',
          entityId: result.productCode,
          changeSummary: {
            productCode: result.productCode,
            name: result.name,
            priceAmount: result.priceAmount,
          },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create product');
  }
}
