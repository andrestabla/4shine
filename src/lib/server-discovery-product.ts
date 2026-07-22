import { withClient } from '@/server/db/pool';

export interface PublicDiscoveryProduct {
  priceLabel: string;
  currencyCode: string;
  checkoutUrl: string;
  ctaLabel: string;
}

/** Valores de reserva si el catálogo no responde: nunca dejar la página sin CTA. */
const FALLBACK: PublicDiscoveryProduct = {
  priceLabel: '$15',
  currencyCode: 'USD',
  checkoutUrl: '/acceso',
  ctaLabel: 'Activar diagnóstico',
};

/**
 * Precio y checkout del diagnóstico para la página pública.
 *
 * Se lee del catálogo (app_billing.product_catalog) en vez de escribirse en el
 * componente: la página anunciaba $50 mientras el catálogo cobraba $15, y un
 * visitante veía un precio y encontraba otro al entrar.
 */
export async function getPublicDiscoveryProduct(): Promise<PublicDiscoveryProduct> {
  try {
    const row = await withClient(async (client) => {
      const { rows } = await client.query<{
        price_amount: string | null;
        currency_code: string | null;
        checkout_url: string | null;
        cta_label: string | null;
      }>(
        `SELECT price_amount::text, currency_code, checkout_url, cta_label
           FROM app_billing.product_catalog
          WHERE product_code = 'discovery_4shine' AND is_active = true
          LIMIT 1`,
      );
      return rows[0] ?? null;
    });

    if (!row) return FALLBACK;

    const amount = Number(row.price_amount ?? 0);
    return {
      // Sin decimales cuando el precio es entero: "$15", no "$15.00".
      priceLabel: `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`,
      currencyCode: (row.currency_code ?? 'USD').toUpperCase(),
      checkoutUrl: row.checkout_url?.trim() || FALLBACK.checkoutUrl,
      ctaLabel: row.cta_label?.trim() || FALLBACK.ctaLabel,
    };
  } catch {
    return FALLBACK;
  }
}
