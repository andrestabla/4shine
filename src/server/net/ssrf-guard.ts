import { lookup } from 'node:dns/promises';

/**
 * Defensa contra SSRF para los endpoints que descargan una URL elegida por el
 * usuario (previsualización de enlaces, proxy de imágenes).
 *
 * No basta con mirar el hostname: un dominio público puede resolver a una IP
 * interna (DNS rebinding) y una IP se puede escribir en decimal para esquivar
 * los patrones de texto. Por eso se resuelve el nombre y se valida la IP real.
 */

const BLOCKED_V4 = [
  /^0\./,                          // "this network"
  /^10\./,                         // privada
  /^127\./,                        // loopback
  /^169\.254\./,                   // link-local: metadatos de nube (169.254.169.254)
  /^172\.(1[6-9]|2\d|3[01])\./,    // privada
  /^192\.168\./,                   // privada
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
  /^198\.(1[89])\./,               // pruebas de red
  /^22[4-9]\./,                    // multicast y reservado
  /^2[3-5]\d\./,
];

function isBlockedIpv4(ip: string): boolean {
  return BLOCKED_V4.some((pattern) => pattern.test(ip));
}

function isBlockedIpv6(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === '::1' || value === '::') return true;
  if (value.startsWith('fe80')) return true;            // link-local
  if (/^f[cd]/.test(value)) return true;                // ULA
  // ::ffff:127.0.0.1 — IPv4 mapeada dentro de IPv6
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  return false;
}

export interface SsrfCheck {
  ok: boolean;
  reason?: string;
  url?: URL;
}

/**
 * Valida que la URL sea http(s) pública. Resuelve el DNS y rechaza si CUALQUIER
 * dirección devuelta es interna: si un nombre resuelve a varias, basta con una
 * mala para descartarlo.
 */
export async function assertPublicUrl(rawUrl: string): Promise<SsrfCheck> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'URL inválida' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Solo se permiten URLs http(s)' };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (/^localhost$/i.test(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    return { ok: false, reason: 'Host no permitido' };
  }

  try {
    const resolved = await lookup(hostname, { all: true, verbatim: true });
    if (resolved.length === 0) return { ok: false, reason: 'Host no resoluble' };
    for (const entry of resolved) {
      const blocked = entry.family === 6 ? isBlockedIpv6(entry.address) : isBlockedIpv4(entry.address);
      if (blocked) return { ok: false, reason: 'Host no permitido' };
    }
  } catch {
    return { ok: false, reason: 'Host no resoluble' };
  }

  return { ok: true, url: parsed };
}
