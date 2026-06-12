import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

export const dynamic = 'force-dynamic';

export interface PublicAdviser {
  userId: string;
  name: string;
  photoUrl: string;
  initial: string;
  profession: string;
  jobRole: string;
  bio: string;
  linkedinUrl: string;
}

interface AdviserRow {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  avatar_initial: string | null;
  profession: string | null;
  job_role: string | null;
  bio: string | null;
  linkedin_url: string | null;
}

/**
 * Perfiles públicos de advisers para el bloque "Advisers" del site builder.
 * Solo usuarios activos con rol mentor (adviser). Endpoint público: expone
 * únicamente los campos de perfil pensados para mostrarse en el sitio.
 */
export async function GET() {
  try {
    const rows = await withClient(async (client) => {
      const { rows } = await client.query<AdviserRow>(
        `SELECT u.user_id::text, u.display_name, u.first_name, u.last_name,
                u.avatar_url, u.avatar_initial,
                p.profession, p.job_role, p.bio, p.linkedin_url
         FROM app_core.users u
         LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
         WHERE u.primary_role = 'mentor' AND u.is_active = true
         ORDER BY u.display_name NULLS LAST, u.first_name
         LIMIT 60`,
      );
      return rows;
    });

    const data: PublicAdviser[] = rows.map((row) => {
      const name =
        row.display_name?.trim() || [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Adviser';
      return {
        userId: row.user_id,
        name,
        photoUrl: row.avatar_url?.trim() ?? '',
        initial: row.avatar_initial?.trim() || name.charAt(0).toUpperCase(),
        profession: row.profession?.trim() ?? '',
        jobRole: row.job_role?.trim() ?? '',
        bio: row.bio?.trim() ?? '',
        linkedinUrl: row.linkedin_url?.trim() ?? '',
      };
    });

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al cargar advisers', detail }, { status: 500 });
  }
}
