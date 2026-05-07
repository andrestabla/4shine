import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { issueAuthTokens } from '@/server/auth/session';
import { setAuthCookies } from '@/server/auth/cookies';
import type { AuthUser } from '@/server/auth/types';
import { selfRegisterUser } from '@/features/usuarios/service';
import { buildRequestSummary, writeAuditLog } from '@/server/audit/service';

interface RegisterBody {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profession?: string;
  industry?: string;
  country?: string;
  jobRole?: string;
  googleIdToken?: string;
}

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const country = body.country?.trim();
  const jobRole = body.jobRole?.trim();

  if (!email || !firstName || !lastName || !country || !jobRole) {
    return NextResponse.json({ ok: false, error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const isGoogleRegistration = !!body.googleIdToken;

  if (!isGoogleRegistration && !body.password) {
    return NextResponse.json({ ok: false, error: 'La contraseña es obligatoria' }, { status: 400 });
  }

  if (isGoogleRegistration) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return NextResponse.json({ ok: false, error: 'Google SSO no configurado' }, { status: 503 });
    }
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.googleIdToken!)}`,
      );
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: 'Token de Google inválido' }, { status: 401 });
      }
      const info = (await res.json()) as { aud?: string; email?: string; exp?: string };
      if (info.aud !== googleClientId || !info.email) {
        return NextResponse.json({ ok: false, error: 'Token de Google inválido' }, { status: 401 });
      }
      if (Number(info.exp) * 1000 < Date.now()) {
        return NextResponse.json({ ok: false, error: 'Token de Google expirado' }, { status: 401 });
      }
      if (info.email.trim().toLowerCase() !== email) {
        return NextResponse.json(
          { ok: false, error: 'El correo no coincide con la cuenta de Google' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Error al verificar token de Google' },
        { status: 500 },
      );
    }
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

        const user = await selfRegisterUser(client, {
          email: email!,
          password: isGoogleRegistration ? undefined : body.password,
          firstName: firstName!,
          lastName: lastName!,
          profession: body.profession?.trim() || null,
          industry: body.industry?.trim() || null,
          country: country!,
          jobRole: jobRole!,
        });

        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', user.userId]);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', user.primaryRole]);

        const authUser: AuthUser = {
          userId: user.userId,
          email: user.email,
          name: user.displayName,
          role: user.primaryRole,
        };

        const tokens = await issueAuthTokens(
          client,
          authUser,
          request.headers.get('user-agent'),
          getIpAddress(request),
        );

        await writeAuditLog(client, {
          actorUserId: user.userId,
          action: 'auth_self_register',
          entityTable: 'app_core.users',
          entityId: user.userId,
          changeSummary: buildRequestSummary(request, {
            email: user.email,
            method: isGoogleRegistration ? 'google' : 'password',
          }),
        });

        await client.query('COMMIT');

        return {
          status: 201 as const,
          payload: {
            ok: true,
            user: {
              id: user.userId,
              email: user.email,
              name: user.displayName,
              role: user.primaryRole,
            },
          },
          tokens,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    const response = NextResponse.json(result.payload, { status: result.status });
    setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear la cuenta';
    const pgError = error as { code?: string };
    if (message.includes('ya está registrado') || pgError.code === '23505') {
      return NextResponse.json(
        { ok: false, error: 'Este correo ya está registrado.' },
        { status: 409 },
      );
    }
    if (message.includes('inválido') || message.includes('obligatorio')) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
