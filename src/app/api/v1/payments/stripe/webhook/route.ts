import { NextResponse } from "next/server";
import Stripe from "stripe";
import { withClient, withRoleContext } from "@/server/db/pool";
import { markOrderAsFailed, markOrderAsPaid } from "@/features/payments/service";

export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

async function recordDiscoveryPurchase(userId: string): Promise<void> {
  await withClient(async (client) => {
    await withRoleContext(client, userId, "lider", async () => {
      await client.query(
        `
          INSERT INTO app_billing.user_purchases (
            user_id,
            product_code,
            status,
            quantity,
            unit_price_amount,
            currency_code,
            metadata,
            purchased_at,
            activated_at
          )
          SELECT
            $1::uuid,
            'discovery_4shine',
            'active',
            1,
            COALESCE(pc.price_amount, 50),
            COALESCE(pc.currency_code, 'USD'),
            jsonb_build_object('source', 'stripe'),
            now(),
            now()
          FROM app_billing.product_catalog pc
          WHERE pc.product_code = 'discovery_4shine'
            AND NOT EXISTS (
              SELECT 1
              FROM app_billing.user_purchases up
              WHERE up.user_id = $1::uuid
                AND up.product_code = 'discovery_4shine'
                AND up.status = 'active'
            )
        `,
        [userId],
      );
    });
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Webhook not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const productCode = session.metadata?.productCode;
    const kind = session.metadata?.kind;

    if (userId && productCode === "discovery_4shine" && session.payment_status === "paid") {
      try {
        await recordDiscoveryPurchase(userId);
      } catch (error) {
        console.error("[Stripe webhook] Error recording purchase:", error);
        return NextResponse.json({ ok: false, error: "Error recording purchase." }, { status: 500 });
      }
    }

    if (kind === "mentorship_additional_order" && session.payment_status === "paid") {
      const ownerUserId = session.metadata?.userId;
      const reference = session.id;
      if (ownerUserId && reference) {
        try {
          await withClient(async (client) => {
            await withRoleContext(client, ownerUserId, "lider", async () => {
              await markOrderAsPaid(client, { provider: "stripe", reference });
            });
          });
        } catch (error) {
          console.error("[Stripe webhook] Error marking mentorship order paid:", error);
          return NextResponse.json({ ok: false, error: "Error updating order." }, { status: 500 });
        }
      }
    }
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.kind === "mentorship_additional_order") {
      const ownerUserId = session.metadata?.userId;
      if (ownerUserId && session.id) {
        try {
          await withClient(async (client) => {
            await withRoleContext(client, ownerUserId, "lider", async () => {
              await markOrderAsFailed(client, { provider: "stripe", reference: session.id });
            });
          });
        } catch (error) {
          console.error("[Stripe webhook] Error marking mentorship order failed:", error);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
