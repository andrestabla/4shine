import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { errorResponse, parseJsonBody, unauthorizedResponse } from "../../../modules/_utils";
import { getViewerAccessState } from "@/features/access/service";

export const runtime = "nodejs";

interface CheckoutBody {
  productCode?: string;
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CheckoutBody>(request);
  const productCode = body?.productCode?.trim() ?? "discovery_4shine";

  if (productCode !== "discovery_4shine") {
    return NextResponse.json({ ok: false, error: "Producto no soportado." }, { status: 400 });
  }

  try {
    const product = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const access = await getViewerAccessState(client, identity, { includeCatalog: true });
        if (access.hasDiscoveryPurchase) {
          throw Object.assign(new Error("ALREADY_PURCHASED"), { code: "ALREADY_PURCHASED" });
        }
        const catalogProduct = access.catalog.find((p) => p.productCode === "discovery_4shine");
        if (!catalogProduct) throw new Error("Producto no encontrado en catálogo.");
        return catalogProduct;
      }),
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://www.4shine.co";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: identity.userId,
      metadata: {
        userId: identity.userId,
        productCode: "discovery_4shine",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currencyCode.toLowerCase(),
            unit_amount: Math.round(product.priceAmount * 100),
            product_data: {
              name: product.name,
              description: product.description ?? product.headline,
            },
          },
        },
      ],
      success_url: `${appUrl}/dashboard/descubrimiento?payment=success`,
      cancel_url: `${appUrl}/dashboard/descubrimiento`,
    });

    return NextResponse.json({ ok: true, data: { checkoutUrl: session.url } });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ALREADY_PURCHASED") {
      return NextResponse.json({ ok: false, error: "Ya tienes acceso a este diagnóstico." }, { status: 409 });
    }
    return errorResponse(error, "Error al crear la sesión de pago.");
  }
}
