import { NextResponse } from 'next/server';
import { requestPasswordResetByEmail } from '@/features/usuarios/service';

interface RequestBody {
  email?: string;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Correo requerido' }, { status: 400 });
  }

  // Always succeed silently to avoid email enumeration. Errors are logged
  // server-side but never bubbled to the caller.
  try {
    await requestPasswordResetByEmail(email);
  } catch (error) {
    console.error('[request-password-reset] dispatch failed:', error);
  }

  return NextResponse.json({
    ok: true,
    message: 'Si el correo existe en nuestra plataforma, recibirás un enlace para restablecer tu contraseña en los próximos minutos.',
  });
}
