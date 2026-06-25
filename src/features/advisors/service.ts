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
