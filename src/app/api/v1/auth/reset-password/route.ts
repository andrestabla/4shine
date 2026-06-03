import { NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/features/usuarios/service';

interface ResetBody {
  token?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: ResetBody;
  try {
    body = (await request.json()) as ResetBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const token = body.token?.trim();
  const password = body.password ?? '';
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token requerido' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: 'La contraseña debe tener al menos 8 caracteres' },
      { status: 400 },
    );
  }

  try {
    const result = await resetPasswordWithToken(token, password);
    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo restablecer la contraseña';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
