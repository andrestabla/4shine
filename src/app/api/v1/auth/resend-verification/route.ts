import { NextResponse, after } from 'next/server';
import { maybeResendVerificationEmail } from '@/features/usuarios/service';

interface ResendBody {
  email?: string;
}

// La lógica de lookup + cooldown + envío vive en maybeResendVerificationEmail
// (usuarios/service). El mismo helper lo usa el login cuando responde
// email_not_verified, para que ambos caminos se comporten idéntico.
export async function POST(request: Request) {
  let body: ResendBody;
  try {
    body = (await request.json()) as ResendBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Correo requerido' }, { status: 400 });
  }

  // Respuesta inmediata; el correo vuela en background. Silencioso por
  // diseño para no filtrar qué correos existen (anti user-enumeration).
  after(async () => {
    try {
      await maybeResendVerificationEmail(email);
    } catch (emailError) {
      console.error('Verification email (resend) failed (non-fatal)', emailError);
    }
  });

  return NextResponse.json({
    ok: true,
    message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.',
  });
}
