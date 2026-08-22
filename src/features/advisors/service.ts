import type { PoolClient } from 'pg';

export interface PublicAdvisor {
  userId: string;
  name: string;
  photoUrl: string;
  initial: string;
  profession: string;
  jobRole: string;
  industry: string;
  bio: string;
  location: string;
  country: string;
  yearsExperience: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  /** Experiencia como advisor (texto del perfil de mentor) */
  experience: string;
  /** Temas que trabaja (mentor_topics) */
  topics: string[];
}

interface AdvisorRow {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  avatar_initial: string | null;
  profession: string | null;
  job_role: string | null;
  industry: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  years_experience: number | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  experiencia: string | null;
  topics: string[] | null;
}

/** Mismo formato de rangos que usa la vista de perfil ("Entre 11 y 15 años"). */
export function formatYearsExperience(years: number | null): string {
  if (typeof years !== 'number' || !Number.isFinite(years) || years <= 0) return '';
  if (years <= 5) return 'Entre 1 y 5 años';
  if (years <= 10) return 'Entre 6 y 10 años';
  if (years <= 15) return 'Entre 11 y 15 años';
  if (years <= 20) return 'Entre 16 y 20 años';
  return 'Más de 20 años';
}

/**
 * Perfiles públicos de advisors (mentores activos). Mismo dataset que alimenta
 * la página pública /advisors y el bloque "Advisors" del site builder.
 */
export async function listPublicAdvisors(client: PoolClient, limit = 60): Promise<PublicAdvisor[]> {
  const { rows } = await client.query<AdvisorRow>(
    `SELECT u.user_id::text, u.display_name, u.first_name, u.last_name,
            u.avatar_url, u.avatar_initial,
            p.profession, p.job_role, p.industry, p.bio, p.location, p.country,
            p.years_experience, p.linkedin_url, p.twitter_url, p.website_url,
            m.experiencia,
            COALESCE(
              (SELECT array_agg(t.topic_label ORDER BY t.sort_order, t.topic_label)
               FROM app_mentoring.mentor_topics t
               WHERE t.mentor_user_id = u.user_id),
              '{}'
            ) AS topics
     FROM app_core.users u
     LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
     LEFT JOIN app_mentoring.mentors m ON m.mentor_user_id = u.user_id
     WHERE u.primary_role = 'mentor' AND u.is_active = true
     ORDER BY u.display_name NULLS LAST, u.first_name
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 200)],
  );

  return rows.map((row) => {
    const name =
      row.display_name?.trim() || [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Advisor';
    return {
      userId: row.user_id,
      name,
      photoUrl: row.avatar_url?.trim() ?? '',
      initial: row.avatar_initial?.trim() || name.charAt(0).toUpperCase(),
      profession: row.profession?.trim() ?? '',
      jobRole: row.job_role?.trim() ?? '',
      industry: row.industry?.trim() ?? '',
      bio: row.bio?.trim() ?? '',
      location: row.location?.trim() ?? '',
      country: row.country?.trim() ?? '',
      yearsExperience: formatYearsExperience(row.years_experience),
      linkedinUrl: row.linkedin_url?.trim() ?? '',
      twitterUrl: row.twitter_url?.trim() ?? '',
      websiteUrl: row.website_url?.trim() ?? '',
      experience: row.experiencia?.trim() ?? '',
      topics: Array.isArray(row.topics) ? row.topics.filter((t): t is string => typeof t === 'string') : [],
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Ficha de Advisor (edición)

   Quién edita qué:
     · El propio advisor, el gestor y el admin editan los datos de perfil.
     · Categoría, precio de sesión y link de pago SOLO los cambian gestor y
       admin: son datos comerciales, no del perfil profesional.
   La regla se aplica aquí, en el servidor, no en la interfaz.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';

export interface AdvisorCategory {
  categoryId: string;
  label: string;
  sortOrder: number;
}

export interface AdvisorProfileRecord {
  userId: string;
  displayName: string;
  email: string;
  /** Datos de perfil: los edita el advisor, el gestor o el admin. */
  profession: string;
  bio: string;
  location: string;
  country: string;
  yearsExperience: number | null;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  topics: string[];
  /** Datos comerciales: solo gestor y admin. */
  category: string | null;
  sessionPriceAmount: number | null;
  sessionPriceCurrency: string;
  paymentLinkUrl: string;
  /** true si quien consulta puede tocar los tres campos comerciales. */
  canEditCommercial: boolean;
  /** true si quien consulta puede tocar el perfil. */
  canEditProfile: boolean;
}

export interface UpdateAdvisorProfileInput {
  profession?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  yearsExperience?: number | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  topics?: string[];
  category?: string | null;
  sessionPriceAmount?: number | null;
  sessionPriceCurrency?: string | null;
  paymentLinkUrl?: string | null;
}

const STAFF_ROLES = new Set(['admin', 'gestor']);
const COMMERCIAL_FIELDS = [
  'category',
  'sessionPriceAmount',
  'sessionPriceCurrency',
  'paymentLinkUrl',
] as const;

export async function listAdvisorCategories(client: PoolClient): Promise<AdvisorCategory[]> {
  const { rows } = await client.query<{ category_id: string; label: string; sort_order: number }>(
    `SELECT category_id::text, label, sort_order
     FROM app_admin.advisor_categories
     WHERE is_active = true
     ORDER BY sort_order, label`,
  );
  return rows.map((row) => ({
    categoryId: row.category_id,
    label: row.label,
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

/** Agrega una categoría nueva a la lista desplegable. Solo gestor y admin. */
export async function createAdvisorCategory(
  client: PoolClient,
  actor: AuthUser,
  label: string,
): Promise<AdvisorCategory[]> {
  if (!STAFF_ROLES.has(actor.role)) {
    throw new ForbiddenError('Solo gestor o admin pueden agregar categorías de advisor.');
  }
  const clean = label.trim();
  if (clean.length < 3 || clean.length > 60) {
    throw new Error('La categoría debe tener entre 3 y 60 caracteres.');
  }
  await client.query(
    `INSERT INTO app_admin.advisor_categories (label, sort_order, created_by)
     VALUES ($1, COALESCE((SELECT MAX(sort_order) + 1 FROM app_admin.advisor_categories), 1), $2::uuid)
     ON CONFLICT DO NOTHING`,
    [clean, actor.userId],
  );
  return listAdvisorCategories(client);
}

function assertAdvisorAccess(actor: AuthUser, advisorUserId: string) {
  const isSelf = actor.userId === advisorUserId;
  if (!isSelf && !STAFF_ROLES.has(actor.role)) {
    throw new ForbiddenError('Solo el propio advisor, un gestor o un admin pueden ver esta ficha.');
  }
  return { isSelf, isStaff: STAFF_ROLES.has(actor.role) };
}

export async function getAdvisorProfileRecord(
  client: PoolClient,
  actor: AuthUser,
  advisorUserId: string,
): Promise<AdvisorProfileRecord> {
  const { isStaff } = assertAdvisorAccess(actor, advisorUserId);
  await requireModulePermission(client, 'perfil', 'view');

  const { rows } = await client.query<{
    user_id: string; display_name: string; email: string;
    profession: string | null; bio: string | null; location: string | null; country: string | null;
    years_experience: number | null; linkedin_url: string | null; twitter_url: string | null;
    website_url: string | null; advisor_category: string | null;
    session_price_amount: string | null; session_price_currency: string | null;
    payment_link_url: string | null; primary_role: string; topics: string[] | null;
  }>(
    `SELECT u.user_id::text, u.display_name, u.email::text, u.primary_role,
            p.profession, p.bio, p.location, p.country, p.years_experience,
            p.linkedin_url, p.twitter_url, p.website_url,
            p.advisor_category, p.session_price_amount::text, p.session_price_currency,
            p.payment_link_url,
            (SELECT array_agg(t.topic_label ORDER BY t.sort_order, t.topic_label)
               FROM app_mentoring.mentor_topics t
              WHERE t.mentor_user_id = u.user_id) AS topics
     FROM app_core.users u
     LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
     WHERE u.user_id = $1::uuid
     LIMIT 1`,
    [advisorUserId],
  );

  const row = rows[0];
  if (!row) throw new Error('Advisor no encontrado');
  if (row.primary_role !== 'mentor') {
    throw new Error('Esta ficha solo aplica a cuentas de advisor.');
  }

  return {
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    profession: row.profession?.trim() ?? '',
    bio: row.bio?.trim() ?? '',
    location: row.location?.trim() ?? '',
    country: row.country?.trim() ?? '',
    yearsExperience: row.years_experience,
    linkedinUrl: row.linkedin_url?.trim() ?? '',
    twitterUrl: row.twitter_url?.trim() ?? '',
    websiteUrl: row.website_url?.trim() ?? '',
    topics: Array.isArray(row.topics) ? row.topics.filter((t): t is string => typeof t === 'string') : [],
    category: row.advisor_category,
    sessionPriceAmount: row.session_price_amount === null ? null : Number(row.session_price_amount),
    sessionPriceCurrency: row.session_price_currency?.trim() || 'COP',
    paymentLinkUrl: row.payment_link_url?.trim() ?? '',
    canEditCommercial: isStaff,
    canEditProfile: true,
  };
}

const trimOrNull = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const clean = value.trim();
  return clean.length > 0 ? clean : null;
};

export async function updateAdvisorProfileRecord(
  client: PoolClient,
  actor: AuthUser,
  advisorUserId: string,
  input: UpdateAdvisorProfileInput,
): Promise<AdvisorProfileRecord> {
  const { isStaff } = assertAdvisorAccess(actor, advisorUserId);
  await requireModulePermission(client, 'perfil', 'update');

  // Un advisor que intenta tocar sus propios datos comerciales recibe un no
  // explícito, en vez de un guardado que aparenta funcionar y no cambia nada.
  if (!isStaff) {
    const intento = COMMERCIAL_FIELDS.find((field) => input[field] !== undefined);
    if (intento) {
      throw new ForbiddenError(
        'La categoría, el precio de la sesión y el link de pago solo los puede cambiar un gestor o un admin.',
      );
    }
  }

  await client.query(
    `INSERT INTO app_core.user_profiles (user_id) VALUES ($1::uuid)
     ON CONFLICT (user_id) DO NOTHING`,
    [advisorUserId],
  );

  const sets: string[] = [];
  const params: unknown[] = [advisorUserId];
  const push = (column: string, value: unknown) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };

  const perfil: Array<[string, string | null | undefined]> = [
    ['profession', trimOrNull(input.profession)],
    ['bio', trimOrNull(input.bio)],
    ['location', trimOrNull(input.location)],
    ['country', trimOrNull(input.country)],
    ['linkedin_url', trimOrNull(input.linkedinUrl)],
    ['twitter_url', trimOrNull(input.twitterUrl)],
    ['website_url', trimOrNull(input.websiteUrl)],
  ];
  for (const [column, value] of perfil) if (value !== undefined) push(column, value);

  if (input.yearsExperience !== undefined) {
    const years = input.yearsExperience;
    if (years !== null && (!Number.isFinite(years) || years < 0 || years > 80)) {
      throw new Error('Los años de experiencia deben estar entre 0 y 80.');
    }
    push('years_experience', years);
  }

  if (isStaff) {
    if (input.category !== undefined) push('advisor_category', trimOrNull(input.category));
    if (input.sessionPriceAmount !== undefined) {
      const price = input.sessionPriceAmount;
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        throw new Error('El precio de la sesión no puede ser negativo.');
      }
      push('session_price_amount', price);
    }
    if (input.sessionPriceCurrency !== undefined) {
      push('session_price_currency', trimOrNull(input.sessionPriceCurrency) ?? 'COP');
    }
    if (input.paymentLinkUrl !== undefined) {
      const link = trimOrNull(input.paymentLinkUrl);
      if (link && !/^https?:\/\//i.test(link)) {
        throw new Error('El link de pago debe empezar por http:// o https://');
      }
      push('payment_link_url', link);
    }
  }

  if (sets.length > 0) {
    await client.query(
      `UPDATE app_core.user_profiles SET ${sets.join(', ')}, updated_at = now() WHERE user_id = $1::uuid`,
      params,
    );
  }

  // Áreas de experticia: se reemplazan por completo, respetando el orden.
  if (input.topics !== undefined) {
    const topics = input.topics.map((t) => t.trim()).filter(Boolean).slice(0, 12);
    await client.query(`DELETE FROM app_mentoring.mentor_topics WHERE mentor_user_id = $1::uuid`, [advisorUserId]);
    for (let index = 0; index < topics.length; index += 1) {
      await client.query(
        `INSERT INTO app_mentoring.mentor_topics (mentor_user_id, topic_label, sort_order)
         VALUES ($1::uuid, $2, $3)`,
        [advisorUserId, topics[index], index + 1],
      );
    }
  }

  return getAdvisorProfileRecord(client, actor, advisorUserId);
}
