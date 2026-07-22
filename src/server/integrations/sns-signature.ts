import { createVerify } from 'node:crypto';

/**
 * Verificación de la firma de un mensaje SNS de AWS.
 *
 * SNS firma cada mensaje con la clave privada de un certificado publicado en un
 * dominio de AWS. Sin esta comprobación, el endpoint acepta eventos de cualquiera:
 * bastaba un POST para marcar correos legítimos como rebotados, o para que el
 * servidor hiciera un GET a la URL que enviara el atacante (SSRF a ciegas).
 */

interface SnsMessage {
  Type?: string;
  MessageId?: string;
  TopicArn?: string;
  Subject?: string;
  Message?: string;
  Timestamp?: string;
  SubscribeURL?: string;
  Token?: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
}

/** Campos que entran en la cadena firmada, en el orden que exige AWS. */
const SIGNABLE_KEYS: Record<string, string[]> = {
  Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
  SubscriptionConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
  UnsubscribeConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
};

/** El certificado solo puede venir de AWS por HTTPS. */
export function isValidSigningCertUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return /^sns\.[a-z0-9-]+\.amazonaws\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

const certCache = new Map<string, string>();

async function fetchCertificate(url: string): Promise<string | null> {
  const cached = certCache.get(url);
  if (cached) return cached;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const pem = await res.text();
    certCache.set(url, pem);
    return pem;
  } catch {
    return null;
  }
}

function buildStringToSign(message: SnsMessage): string | null {
  const keys = SIGNABLE_KEYS[message.Type ?? ''];
  if (!keys) return null;
  let result = '';
  for (const key of keys) {
    const value = (message as Record<string, unknown>)[key];
    // Los campos ausentes (p. ej. Subject) simplemente se omiten.
    if (value === undefined || value === null) continue;
    result += `${key}\n${String(value)}\n`;
  }
  return result;
}

export async function verifySnsSignature(message: SnsMessage): Promise<boolean> {
  if (!message.Signature || !message.SigningCertURL) return false;
  if (!isValidSigningCertUrl(message.SigningCertURL)) return false;

  const stringToSign = buildStringToSign(message);
  if (!stringToSign) return false;

  const pem = await fetchCertificate(message.SigningCertURL);
  if (!pem) return false;

  // SignatureVersion 1 usa SHA1; la 2, SHA256.
  const algorithm = message.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
  try {
    const verifier = createVerify(algorithm);
    verifier.update(stringToSign, 'utf8');
    return verifier.verify(pem, message.Signature, 'base64');
  } catch {
    return false;
  }
}
