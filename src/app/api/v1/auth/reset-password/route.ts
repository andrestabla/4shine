import { NextResponse } from 'next/server';
import { validatePassword } from '@/server/auth/password-policy';
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
  const policy = validatePassword(password);
  if (!policy.ok) {
    return NextResponse.json({ ok: false, error: policy.error }, { status: 400 });
  }

  try {
    const result = await resetPasswordWithToken(token, password);
    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo restablecer la contraseña';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
