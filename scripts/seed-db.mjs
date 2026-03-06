import process from 'node:process';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const organizations = [
  { name: '4Shine HQ', industry: 'Liderazgo', country_code: 'CO', city: 'Bogotá' },
  { name: 'FinTech Latam', industry: 'Tecnología Financiera', country_code: 'CO', city: 'Bogotá' },
  { name: 'Consultor Independiente', industry: 'Consultoría & RRHH', country_code: 'MX', city: 'Ciudad de México' },
  { name: 'Retail Global', industry: 'Retail', country_code: 'MX', city: 'Ciudad de México' },
  { name: 'BankCorp', industry: 'Banca', country_code: 'CL', city: 'Santiago' },
  { name: 'TechSolutions', industry: 'Tecnología', country_code: 'US', city: 'Miami' },
  { name: 'Logística SA', industry: 'Logística', country_code: 'PE', city: 'Lima' },
  { name: 'AgroTech', industry: 'Agricultura', country_code: 'AR', city: 'Buenos Aires' },
  { name: 'HealthCare Inc', industry: 'Salud', country_code: 'ES', city: 'Madrid' },
  { name: 'Constructora X', industry: 'Construcción', country_code: 'BR', city: 'São Paulo' },
  { name: 'Grupo Aval', industry: 'Finanzas', country_code: 'CO', city: 'Bogotá' },
  { name: 'StartUp X', industry: 'Tecnología', country_code: 'CO', city: 'Medellín' },
  { name: 'Pharma Inc', industry: 'Salud', country_code: 'MX', city: 'Ciudad de México' },
  { name: 'Solar Energy', industry: 'Energía', country_code: 'CL', city: 'Santiago' },
  { name: 'Freelance', industry: 'Consultoría', country_code: 'CO', city: 'Remoto' },
  { name: 'Rappi', industry: 'Tecnología', country_code: 'CO', city: 'Bogotá' },
];

const users = [
  {
    email: 'sofia.martinez@4shine.co',
    first_name: 'Sofía',
    last_name: 'Martínez',
    display_name: 'Sofía Martínez',
    primary_role: 'lider',
    organization: 'FinTech Latam',
    profile: {
      profession: 'Gerente de Innovación',
      industry: 'Tecnología Financiera',
      plan_type: 'vip',
      seniority_level: 'director',
      bio: 'Apasionada por la transformación digital y el liderazgo inclusivo.',
      location: 'Bogotá',
      linkedin_url: 'linkedin.com/in/sofia-martinez',
      twitter_url: '@sofia_tech',
      website_url: null,
    },
  },
  {
    email: 'carlos.ruiz@4shine.co',
    first_name: 'Carlos',
    last_name: 'Ruiz',
    display_name: 'Dr. Carlos Ruiz',
    primary_role: 'mentor',
    organization: 'Consultor Independiente',
    profile: {
      profession: 'Estratega de Liderazgo',
      industry: 'Consultoría & RRHH',
      plan_type: 'premium',
      seniority_level: 'vp',
      bio: 'Doctor en Psicología Organizacional y mentor ejecutivo.',
      location: 'Ciudad de México',
      linkedin_url: 'linkedin.com/in/carlosruiz-mentor',
      twitter_url: null,
      website_url: 'www.carlosruiz.com',
    },
  },
  {
    email: 'laura.gestion@4shine.co',
    first_name: 'Laura',
    last_name: 'Gestión',
    display_name: 'Laura Gestión',
    primary_role: 'gestor',
    organization: '4Shine HQ',
    profile: {
      profession: 'Program Manager',
      industry: 'EdTech',
      plan_type: 'premium',
      seniority_level: 'director',
      bio: 'Responsable de la operación del programa 4Shine.',
      location: 'Bogotá',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'admin@4shine.co',
    first_name: 'Admin',
    last_name: 'Sistema',
    display_name: 'Admin Sistema',
    primary_role: 'admin',
    organization: '4Shine HQ',
    profile: {
      profession: 'Platform Administrator',
      industry: 'Tecnología',
      plan_type: 'premium',
      seniority_level: 'c_level',
      bio: 'Administrador técnico de la plataforma.',
      location: 'Cloud',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'jorge.ramirez@4shine.co',
    first_name: 'Jorge',
    last_name: 'Ramírez',
    display_name: 'Jorge Ramírez',
    primary_role: 'lider',
    organization: 'Retail Global',
    profile: {
      profession: 'Director Comercial',
      industry: 'Retail',
      plan_type: 'premium',
      seniority_level: 'manager',
      bio: 'Director comercial con foco en crecimiento regional.',
      location: 'Ciudad de México',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'ana.torres@4shine.co',
    first_name: 'Ana',
    last_name: 'Torres',
    display_name: 'Ana Torres',
    primary_role: 'lider',
    organization: 'BankCorp',
    profile: {
      profession: 'Directora de RRHH',
      industry: 'Banca',
      plan_type: 'empresa_elite',
      seniority_level: 'vp',
      bio: 'Líder de talento y cultura organizacional.',
      location: 'Santiago',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'luis.vega@4shine.co',
    first_name: 'Luis',
    last_name: 'Vega',
    display_name: 'Luis Vega',
    primary_role: 'lider',
    organization: 'TechSolutions',
    profile: {
      profession: 'CEO',
      industry: 'Tecnología',
      plan_type: 'vip',
      seniority_level: 'c_level',
      bio: 'CEO en proceso de expansión internacional.',
      location: 'Miami',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'maria.lopez@4shine.co',
    first_name: 'María',
    last_name: 'Lopez',
    display_name: 'María Lopez',
    primary_role: 'lider',
    organization: 'Logística SA',
    profile: {
      profession: 'Gerente de Operaciones',
      industry: 'Logística',
      plan_type: 'standard',
      seniority_level: 'manager',
      bio: 'Lidera operaciones regionales de logística.',
      location: 'Lima',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'carlos.duarte@4shine.co',
    first_name: 'Carlos',
    last_name: 'Duarte',
    display_name: 'Carlos D.',
    primary_role: 'lider',
    organization: 'AgroTech',
    profile: {
      profession: 'Director de Producto',
      industry: 'Agricultura',
      plan_type: 'premium',
      seniority_level: 'director',
      bio: 'Transformación tecnológica del agro.',
      location: 'Buenos Aires',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'elena.ferrer@4shine.co',
    first_name: 'Elena',
    last_name: 'Ferrer',
    display_name: 'Elena F.',
    primary_role: 'lider',
    organization: 'HealthCare Inc',
    profile: {
      profession: 'VP Operaciones',
      industry: 'Salud',
      plan_type: 'vip',
      seniority_level: 'vp',
      bio: 'Ejecución operativa en ecosistemas de salud.',
      location: 'Madrid',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'pedro.herrera@4shine.co',
    first_name: 'Pedro',
    last_name: 'Herrera',
    display_name: 'Pedro H.',
    primary_role: 'lider',
    organization: 'Constructora X',
    profile: {
      profession: 'Manager de Proyectos',
      industry: 'Construcción',
      plan_type: 'empresa_elite',
      seniority_level: 'manager',
      bio: 'Gestiona proyectos de infraestructura.',
      location: 'São Paulo',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'ana.garcia@4shine.co',
    first_name: 'Ana',
    last_name: 'García',
    display_name: 'Ana García',
    primary_role: 'mentor',
    organization: '4Shine HQ',
    profile: {
      profession: 'Mentora Senior',
      industry: 'Liderazgo',
      plan_type: 'premium',
      seniority_level: 'director',
      bio: 'Especialista en comunicación y escucha activa.',
      location: 'Bogotá',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'patricia.gomez@4shine.co',
    first_name: 'Patricia',
    last_name: 'Gómez',
    display_name: 'Patricia Gómez',
    primary_role: 'lider',
    organization: 'Grupo Aval',
    profile: {
      profession: 'HR Manager',
      industry: 'Finanzas',
      plan_type: 'premium',
      seniority_level: 'director',
      bio: 'Gestión de talento humano y cultura organizacional.',
      location: 'Bogotá',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'roberto.diaz@4shine.co',
    first_name: 'Roberto',
    last_name: 'Diaz',
    display_name: 'Roberto Diaz',
    primary_role: 'lider',
    organization: 'StartUp X',
    profile: {
      profession: 'CTO',
      industry: 'Tecnología',
      plan_type: 'standard',
      seniority_level: 'director',
      bio: 'Tecnología y metodologías ágiles.',
      location: 'Medellín',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'elena.white@4shine.co',
    first_name: 'Elena',
    last_name: 'White',
    display_name: 'Elena White',
    primary_role: 'lider',
    organization: 'Pharma Inc',
    profile: {
      profession: 'VP Ventas',
      industry: 'Salud',
      plan_type: 'premium',
      seniority_level: 'vp',
      bio: 'Líder comercial en industria farmacéutica.',
      location: 'Ciudad de México',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'fernando.sol@4shine.co',
    first_name: 'Fernando',
    last_name: 'Sol',
    display_name: 'Fernando Sol',
    primary_role: 'lider',
    organization: 'Solar Energy',
    profile: {
      profession: 'CEO',
      industry: 'Energía',
      plan_type: 'vip',
      seniority_level: 'c_level',
      bio: 'Energías renovables y estrategia corporativa.',
      location: 'Santiago',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'monica.perez@4shine.co',
    first_name: 'Mónica',
    last_name: 'Perez',
    display_name: 'Mónica P.',
    primary_role: 'lider',
    organization: 'Freelance',
    profile: {
      profession: 'Consultora',
      industry: 'Consultoría',
      plan_type: 'standard',
      seniority_level: 'senior',
      bio: 'Consultora en marketing y branding.',
      location: 'Remoto',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
  {
    email: 'david.klein@4shine.co',
    first_name: 'David',
    last_name: 'Klein',
    display_name: 'David K.',
    primary_role: 'lider',
    organization: 'Rappi',
    profile: {
      profession: 'Head of Product',
      industry: 'Tecnología',
      plan_type: 'premium',
      seniority_level: 'director',
      bio: 'Producto y experiencia de usuario.',
      location: 'Bogotá',
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
    },
  },
];

function avatarInitial(displayName) {
  return (displayName || 'U').trim().slice(0, 1).toUpperCase();
}

async function upsertOrganization(org) {
  const { rows } = await client.query(
    `
      INSERT INTO app_core.organizations (name, industry, country_code, city)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO UPDATE
      SET industry = EXCLUDED.industry,
          country_code = EXCLUDED.country_code,
          city = EXCLUDED.city
      RETURNING organization_id
    `,
    [org.name, org.industry, org.country_code, org.city],
  );
  return rows[0].organization_id;
}

async function upsertUser(user, organizationId) {
  const { rows } = await client.query(
    `
      INSERT INTO app_core.users (
        email,
        first_name,
        last_name,
        display_name,
        avatar_initial,
        primary_role,
        organization_id,
        timezone,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'America/Bogota', true)
      ON CONFLICT (email) DO UPDATE
      SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        display_name = EXCLUDED.display_name,
        avatar_initial = EXCLUDED.avatar_initial,
        primary_role = EXCLUDED.primary_role,
        organization_id = EXCLUDED.organization_id,
        is_active = true
      RETURNING user_id
    `,
    [
      user.email,
      user.first_name,
      user.last_name,
      user.display_name,
      avatarInitial(user.display_name),
      user.primary_role,
      organizationId,
    ],
  );

  const userId = rows[0].user_id;

  await client.query(
    `
      INSERT INTO app_core.user_profiles (
        user_id,
        profession,
        industry,
        plan_type,
        seniority_level,
        bio,
        location,
        linkedin_url,
        twitter_url,
        website_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE
      SET
        profession = EXCLUDED.profession,
        industry = EXCLUDED.industry,
        plan_type = EXCLUDED.plan_type,
        seniority_level = EXCLUDED.seniority_level,
        bio = EXCLUDED.bio,
        location = EXCLUDED.location,
        linkedin_url = EXCLUDED.linkedin_url,
        twitter_url = EXCLUDED.twitter_url,
        website_url = EXCLUDED.website_url
    `,
    [
      userId,
      user.profile.profession,
      user.profile.industry,
      user.profile.plan_type,
      user.profile.seniority_level,
      user.profile.bio,
      user.profile.location,
      user.profile.linkedin_url,
      user.profile.twitter_url,
      user.profile.website_url,
    ],
  );

  await client.query(
    `
      INSERT INTO app_auth.user_roles (user_id, role_code, is_default)
      VALUES ($1, $2, true)
      ON CONFLICT (user_id, role_code) DO UPDATE
      SET is_default = true
    `,
    [userId, user.primary_role],
  );

  await client.query(
    `
      UPDATE app_auth.user_roles
      SET is_default = false
      WHERE user_id = $1
        AND role_code <> $2
        AND is_default = true
    `,
    [userId, user.primary_role],
  );

  return userId;
}

async function ensureChallenge(title, description, challengeType, createdBy) {
  const existing = await client.query(
    `SELECT challenge_id FROM app_core.challenges WHERE title = $1 LIMIT 1`,
    [title],
  );

  if (existing.rowCount > 0) {
    const challengeId = existing.rows[0].challenge_id;
    await client.query(
      `
        UPDATE app_core.challenges
        SET description = $2,
            challenge_type = $3,
            created_by = COALESCE(created_by, $4),
            is_active = true
        WHERE challenge_id = $1
      `,
      [challengeId, description, challengeType, createdBy],
    );
    return challengeId;
  }

  const inserted = await client.query(
    `
      INSERT INTO app_core.challenges (title, description, challenge_type, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING challenge_id
    `,
    [title, description, challengeType, createdBy],
  );

  return inserted.rows[0].challenge_id;
}

async function ensureContentItem(item) {
  const existing = await client.query(
    `
      SELECT content_id
      FROM app_learning.content_items
      WHERE scope = $1
        AND title = $2
      LIMIT 1
    `,
    [item.scope, item.title],
  );

  if (existing.rowCount > 0) {
    const contentId = existing.rows[0].content_id;
    await client.query(
      `
        UPDATE app_learning.content_items
        SET
          description = $2,
          content_type = $3,
          category = $4,
          duration_minutes = $5,
          duration_label = $6,
          url = $7,
          author_user_id = $8,
          author_name = $9,
          status = 'published',
          is_recommended = $10,
          published_at = COALESCE(published_at, $11::timestamptz)
        WHERE content_id = $1
      `,
      [
        contentId,
        item.description,
        item.content_type,
        item.category,
        item.duration_minutes,
        item.duration_label,
        item.url,
        item.author_user_id,
        item.author_name,
        item.is_recommended,
        item.published_at,
      ],
    );
    return contentId;
  }

  const inserted = await client.query(
    `
      INSERT INTO app_learning.content_items (
        scope,
        title,
        description,
        content_type,
        category,
        duration_minutes,
        duration_label,
        url,
        author_user_id,
        author_name,
        status,
        is_recommended,
        created_by,
        published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', $11, $12, $13::timestamptz)
      RETURNING content_id
    `,
    [
      item.scope,
      item.title,
      item.description,
      item.content_type,
      item.category,
      item.duration_minutes,
      item.duration_label,
      item.url,
      item.author_user_id,
      item.author_name,
      item.is_recommended,
      item.created_by,
      item.published_at,
    ],
  );

  return inserted.rows[0].content_id;
}

async function run() {
  await client.connect();
  await client.query('BEGIN');

  try {
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;
    if (!defaultPassword || defaultPassword.trim().length < 10) {
      throw new Error('SEED_DEFAULT_PASSWORD is required and must be at least 10 characters long');
    }
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 12);

    const orgIds = new Map();
    for (const org of organizations) {
      const id = await upsertOrganization(org);
      orgIds.set(org.name, id);
    }

    const userIds = new Map();
    for (const user of users) {
      const organizationId = orgIds.get(user.organization);
      const userId = await upsertUser(user, organizationId);
      userIds.set(user.email, userId);

      await client.query(
        `
          INSERT INTO app_auth.user_credentials (user_id, password_hash, failed_attempts, locked_until)
          VALUES ($1, $2, 0, NULL)
          ON CONFLICT (user_id) DO UPDATE
          SET
            password_hash = EXCLUDED.password_hash,
            failed_attempts = 0,
            locked_until = NULL,
            password_updated_at = now()
        `,
        [userId, defaultPasswordHash],
      );
    }

    const gestorId = userIds.get('laura.gestion@4shine.co');
    const leaderSofiaId = userIds.get('sofia.martinez@4shine.co');
    const mentorCarlosId = userIds.get('carlos.ruiz@4shine.co');
    const mentorAnaId = userIds.get('ana.garcia@4shine.co');

    const interests = [
      'Transformación Digital',
      'Liderazgo Femenino',
      'Blockchain',
      'Sostenibilidad',
      'Innovación',
      'Estrategia',
      'Comunicación',
      'Talento',
      'Cultura',
      'Agile',
      'Producto',
      'UX',
      'Negociación',
    ];

    const interestIds = new Map();
    for (const interest of interests) {
      const { rows } = await client.query(
        `
          INSERT INTO app_core.interests (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING interest_id
        `,
        [interest],
      );
      interestIds.set(interest, rows[0].interest_id);
    }

    const userInterestsMap = {
      'sofia.martinez@4shine.co': ['Transformación Digital', 'Liderazgo Femenino', 'Blockchain'],
      'carlos.ruiz@4shine.co': ['Comunicación', 'Talento', 'Cultura'],
      'jorge.ramirez@4shine.co': ['Innovación', 'Estrategia'],
      'ana.torres@4shine.co': ['Talento', 'Cultura'],
      'david.klein@4shine.co': ['Producto', 'UX', 'Agile'],
      'elena.white@4shine.co': ['Negociación', 'Estrategia'],
    };

    for (const [email, userInterestValues] of Object.entries(userInterestsMap)) {
      const userId = userIds.get(email);
      if (!userId) continue;

      await client.query(`DELETE FROM app_core.user_interests WHERE user_id = $1`, [userId]);
      for (const interest of userInterestValues) {
        await client.query(
          `
            INSERT INTO app_core.user_interests (user_id, interest_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, interest_id) DO NOTHING
          `,
          [userId, interestIds.get(interest)],
        );
      }
    }

    await client.query(
      `
        DELETE FROM app_core.user_projects
        WHERE user_id IN ($1, $2)
      `,
      [leaderSofiaId, mentorCarlosId],
    );

    await client.query(
      `
        INSERT INTO app_core.user_projects (user_id, title, description, project_role)
        VALUES
          ($1, 'Lanzamiento Billetera Digital', 'Lideró el lanzamiento de una wallet regional con 1M de usuarios.', 'Product Owner'),
          ($1, 'Programa Mentoring Interno', 'Diseñó e implementó mentoring para jóvenes talentos.', 'Co-Lead'),
          ($2, 'Transformación Cultural Banco Global', 'Programa de cambio cultural para 500 ejecutivos.', 'Lead Consultant'),
          ($2, 'Programa Executive Women', 'Programa de aceleración para mujeres en alta dirección.', 'Mentor Principal')
      `,
      [leaderSofiaId, mentorCarlosId],
    );

    const cohortResult = await client.query(
      `
        INSERT INTO app_core.cohorts (cohort_code, name, status, starts_at, ends_at, created_by)
        VALUES ('C5-2026', 'Cohorte 5 - 2026', 'active', DATE '2026-01-15', DATE '2026-06-30', $1)
        ON CONFLICT (cohort_code) DO UPDATE
        SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          created_by = EXCLUDED.created_by
        RETURNING cohort_id
      `,
      [gestorId],
    );

    const cohortId = cohortResult.rows[0].cohort_id;

    for (const user of users) {
      const userId = userIds.get(user.email);
      if (!userId) continue;

      await client.query(
        `
          INSERT INTO app_core.cohort_memberships (cohort_id, user_id, role_code)
          VALUES ($1, $2, $3)
          ON CONFLICT (cohort_id, user_id) DO UPDATE
          SET role_code = EXCLUDED.role_code,
              left_at = NULL
        `,
        [cohortId, userId, user.primary_role],
      );
    }

    const challengeVisionId = await ensureChallenge(
      'Visualizar el Futuro',
      'Define tu visión a 5 años usando la metodología 4Shine.',
      'strategic',
      gestorId,
    );

    const challengeFeedbackId = await ensureChallenge(
      'Feedback 360',
      'Solicita feedback a 3 pares y consolida hallazgos.',
      'social',
      gestorId,
    );

    await client.query(
      `
        INSERT INTO app_core.user_challenges (user_id, challenge_id, status, assigned_at)
        VALUES
          ($1, $2, 'in_progress', now() - interval '10 days'),
          ($1, $3, 'assigned', now() - interval '2 days')
        ON CONFLICT (user_id, challenge_id) DO UPDATE
        SET status = EXCLUDED.status,
            assigned_at = EXCLUDED.assigned_at
      `,
      [leaderSofiaId, challengeVisionId, challengeFeedbackId],
    );

    await client.query(
      `
        DELETE FROM app_core.trajectory_events
        WHERE source_module = 'seed_v1'
      `,
    );

    const trajectorySeed = [
      ['Diagnóstico Inicial (Shine Test)', 'test', 'completed', '2026-01-15 10:00:00+00', '2026-01-15 10:35:00+00'],
      ['Test: Shine Within (Autoliderazgo)', 'test', 'completed', '2026-02-15 10:00:00+00', '2026-02-15 10:40:00+00'],
      ['Test: Shine Out (Comunicación)', 'test', 'current', '2026-03-15 10:00:00+00', null],
      ['Test: Shine Up (Estrategia)', 'test', 'locked', '2026-04-15 10:00:00+00', null],
      ['Test: Shine Beyond (Legado)', 'test', 'locked', '2026-05-15 10:00:00+00', null],
    ];

    for (const [title, type, status, plannedAt, completedAt] of trajectorySeed) {
      await client.query(
        `
          INSERT INTO app_core.trajectory_events (
            user_id,
            cohort_id,
            title,
            event_type,
            status,
            planned_at,
            completed_at,
            source_module
          )
          VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, 'seed_v1')
        `,
        [leaderSofiaId, cohortId, title, type, status, plannedAt, completedAt],
      );
    }

    const testDefinitions = [
      ['diagnostico_inicial', 'Diagnóstico Inicial 4Shine', 'Evaluación base del programa.', null, 1],
      ['shine_within', 'Shine Within', 'Autoliderazgo y autenticidad.', 'shine_within', 2],
      ['shine_out', 'Shine Out', 'Comunicación e influencia.', 'shine_out', 3],
      ['shine_up', 'Shine Up', 'Pensamiento estratégico.', 'shine_up', 4],
      ['shine_beyond', 'Shine Beyond', 'Impacto y legado.', 'shine_beyond', 5],
    ];

    const testIds = new Map();
    for (const [code, title, description, pillar, sequence] of testDefinitions) {
      const { rows } = await client.query(
        `
          INSERT INTO app_assessment.tests (test_code, title, description, pillar_code, sequence_no, is_active, created_by)
          VALUES ($1, $2, $3, $4, $5, true, $6)
          ON CONFLICT (test_code) DO UPDATE
          SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            pillar_code = EXCLUDED.pillar_code,
            sequence_no = EXCLUDED.sequence_no,
            is_active = true
          RETURNING test_id
        `,
        [code, title, description, pillar, sequence, gestorId],
      );
      testIds.set(code, rows[0].test_id);
    }

    await client.query(
      `
        DELETE FROM app_assessment.test_attempts
        WHERE user_id = $1
          AND test_id = ANY($2::uuid[])
      `,
      [leaderSofiaId, Array.from(testIds.values())],
    );

    const insertAttempt = async (testCode, score, pillarScores = []) => {
      const inserted = await client.query(
        `
          INSERT INTO app_assessment.test_attempts (
            test_id,
            user_id,
            status,
            started_at,
            completed_at,
            overall_score
          )
          VALUES ($1, $2, 'completed', now() - interval '30 days', now() - interval '29 days', $3)
          RETURNING attempt_id
        `,
        [testIds.get(testCode), leaderSofiaId, score],
      );

      const attemptId = inserted.rows[0].attempt_id;
      for (const [pillarCode, pillarScore] of pillarScores) {
        await client.query(
          `
            INSERT INTO app_assessment.test_attempt_scores (attempt_id, pillar_code, score)
            VALUES ($1, $2, $3)
            ON CONFLICT (attempt_id, pillar_code) DO UPDATE
            SET score = EXCLUDED.score
          `,
          [attemptId, pillarCode, pillarScore],
        );
      }
    };

    await insertAttempt('diagnostico_inicial', 65, [
      ['shine_within', 62],
      ['shine_out', 60],
      ['shine_up', 68],
      ['shine_beyond', 55],
    ]);
    await insertAttempt('shine_within', 85, [['shine_within', 85]]);
    await insertAttempt('shine_out', 72, [['shine_out', 72]]);

    await client.query(
      `
        INSERT INTO app_mentoring.mentors (mentor_user_id, specialty, rating_avg, rating_count)
        VALUES
          ($1, 'Shine Within', 4.9, 24),
          ($2, 'Shine Out', 4.8, 17)
        ON CONFLICT (mentor_user_id) DO UPDATE
        SET
          specialty = EXCLUDED.specialty,
          rating_avg = EXCLUDED.rating_avg,
          rating_count = EXCLUDED.rating_count
      `,
      [mentorCarlosId, mentorAnaId],
    );

    await client.query(
      `
        INSERT INTO app_mentoring.mentor_specialties (mentor_user_id, pillar_code)
        VALUES
          ($1, 'shine_within'),
          ($1, 'shine_up'),
          ($2, 'shine_out')
        ON CONFLICT (mentor_user_id, pillar_code) DO NOTHING
      `,
      [mentorCarlosId, mentorAnaId],
    );

    await client.query(
      `
        INSERT INTO app_mentoring.mentor_availability (mentor_user_id, starts_at, ends_at, is_booked)
        VALUES
          ($1, '2026-04-10 09:00:00-05', '2026-04-10 10:00:00-05', false),
          ($1, '2026-04-10 11:00:00-05', '2026-04-10 12:00:00-05', false),
          ($1, '2026-04-12 14:00:00-05', '2026-04-12 15:00:00-05', false),
          ($2, '2026-04-11 10:00:00-05', '2026-04-11 11:00:00-05', false),
          ($2, '2026-04-11 15:00:00-05', '2026-04-11 16:00:00-05', false)
        ON CONFLICT (mentor_user_id, starts_at, ends_at) DO UPDATE
        SET is_booked = EXCLUDED.is_booked
      `,
      [mentorCarlosId, mentorAnaId],
    );

    const mentorAssignmentsData = [
      [mentorCarlosId, leaderSofiaId, gestorId],
      [mentorCarlosId, userIds.get('jorge.ramirez@4shine.co'), gestorId],
      [mentorCarlosId, userIds.get('ana.torres@4shine.co'), gestorId],
      [mentorCarlosId, userIds.get('luis.vega@4shine.co'), gestorId],
    ];

    for (const [mentorId, menteeId, assignedBy] of mentorAssignmentsData) {
      if (!menteeId) continue;
      await client.query(
        `
          INSERT INTO app_mentoring.mentor_assignments (
            mentor_user_id,
            mentee_user_id,
            assigned_by,
            status,
            assigned_at
          )
          VALUES ($1, $2, $3, 'active', now() - interval '25 days')
          ON CONFLICT (mentor_user_id, mentee_user_id, status) DO NOTHING
        `,
        [mentorId, menteeId, assignedBy],
      );
    }

    const mentorshipSessionsSeed = [
      {
        title: 'Sesión de Estrategia Personal',
        mentor: mentorCarlosId,
        startsAt: '2026-04-15 09:00:00-05',
        endsAt: '2026-04-15 10:00:00-05',
        type: 'individual',
        status: 'scheduled',
        meetingUrl: 'https://zoom.us/j/123456789',
        mentees: ['sofia.martinez@4shine.co'],
      },
      {
        title: 'Revisión de Objetivos Q1',
        mentor: mentorCarlosId,
        startsAt: '2026-03-10 14:00:00-05',
        endsAt: '2026-03-10 15:00:00-05',
        type: 'individual',
        status: 'completed',
        meetingUrl: 'https://zoom.us/j/123456789',
        mentees: ['jorge.ramirez@4shine.co'],
        feedback: 'Excelente sesión, muy clara.',
        rating: 5,
        privateNote:
          'Jorge mejoró su comunicación estratégica. Siguiente foco: delegación efectiva.',
      },
      {
        title: 'Mastermind: Liderazgo Ágil',
        mentor: mentorCarlosId,
        startsAt: '2026-04-20 16:00:00-05',
        endsAt: '2026-04-20 17:30:00-05',
        type: 'grupal',
        status: 'scheduled',
        meetingUrl: 'https://zoom.us/j/987654321',
        mentees: ['sofia.martinez@4shine.co', 'jorge.ramirez@4shine.co', 'ana.torres@4shine.co', 'luis.vega@4shine.co'],
      },
      {
        title: 'Solicitud: Coaching Ejecutivo',
        mentor: mentorCarlosId,
        startsAt: '2026-04-22 11:00:00-05',
        endsAt: '2026-04-22 12:00:00-05',
        type: 'individual',
        status: 'pending_approval',
        meetingUrl: null,
        mentees: ['luis.vega@4shine.co'],
      },
    ];

    for (const session of mentorshipSessionsSeed) {
      let sessionId;
      const existing = await client.query(
        `
          SELECT session_id
          FROM app_mentoring.mentorship_sessions
          WHERE title = $1
            AND starts_at = $2::timestamptz
          LIMIT 1
        `,
        [session.title, session.startsAt],
      );

      if (existing.rowCount > 0) {
        sessionId = existing.rows[0].session_id;
        await client.query(
          `
            UPDATE app_mentoring.mentorship_sessions
            SET
              mentor_user_id = $2,
              ends_at = $3::timestamptz,
              session_type = $4,
              status = $5,
              meeting_url = $6,
              created_by = $7
            WHERE session_id = $1
          `,
          [
            sessionId,
            session.mentor,
            session.endsAt,
            session.type,
            session.status,
            session.meetingUrl,
            gestorId,
          ],
        );
      } else {
        const inserted = await client.query(
          `
            INSERT INTO app_mentoring.mentorship_sessions (
              mentor_user_id,
              title,
              starts_at,
              ends_at,
              session_type,
              status,
              meeting_url,
              created_by
            )
            VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6, $7, $8)
            RETURNING session_id
          `,
          [
            session.mentor,
            session.title,
            session.startsAt,
            session.endsAt,
            session.type,
            session.status,
            session.meetingUrl,
            gestorId,
          ],
        );
        sessionId = inserted.rows[0].session_id;
      }

      await client.query(`DELETE FROM app_mentoring.session_participants WHERE session_id = $1`, [sessionId]);
      await client.query(
        `
          INSERT INTO app_mentoring.session_participants (session_id, user_id, participant_role)
          VALUES ($1, $2, 'mentor')
          ON CONFLICT (session_id, user_id) DO UPDATE SET participant_role = EXCLUDED.participant_role
        `,
        [sessionId, session.mentor],
      );

      for (const menteeEmail of session.mentees) {
        const menteeId = userIds.get(menteeEmail);
        if (!menteeId) continue;
        await client.query(
          `
            INSERT INTO app_mentoring.session_participants (session_id, user_id, participant_role)
            VALUES ($1, $2, 'mentee')
            ON CONFLICT (session_id, user_id) DO UPDATE SET participant_role = EXCLUDED.participant_role
          `,
          [sessionId, menteeId],
        );
      }

      if (session.feedback) {
        const firstMenteeId = userIds.get(session.mentees[0]);
        if (firstMenteeId) {
          await client.query(
            `
              INSERT INTO app_mentoring.session_feedback (session_id, rater_user_id, ratee_user_id, rating, feedback_text)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (session_id, rater_user_id, ratee_user_id) DO UPDATE
              SET rating = EXCLUDED.rating,
                  feedback_text = EXCLUDED.feedback_text
            `,
            [sessionId, firstMenteeId, session.mentor, session.rating ?? 5, session.feedback],
          );
        }
      }

      if (session.privateNote) {
        await client.query(
          `
            INSERT INTO app_mentoring.session_private_notes (session_id, mentor_user_id, note_text)
            VALUES ($1, $2, $3)
            ON CONFLICT (session_id, mentor_user_id) DO UPDATE
            SET note_text = EXCLUDED.note_text
          `,
          [sessionId, session.mentor, session.privateNote],
        );
      }
    }

    const contentSeed = [
      {
        scope: 'metodologia',
        title: 'Dossier Maestro 4Shine (Whitepaper)',
        description:
          'Marco conceptual definitivo con pilares, definiciones y diferenciadores.',
        content_type: 'pdf',
        category: 'Fundamentos',
        duration_minutes: 30,
        duration_label: '30 min',
        url: '#',
        author_name: 'Carmenza Alarcón',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Fundamentos', 'Teoría', 'Visión'],
        published_at: '2024-01-10T09:00:00Z',
      },
      {
        scope: 'metodologia',
        title: 'Manual Metodológico',
        description: 'Guía paso a paso de aplicación de sesiones.',
        content_type: 'pdf',
        category: 'Fundamentos',
        duration_minutes: 35,
        duration_label: '35 min',
        url: '#',
        author_name: 'Equipo Académico',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Guía', 'Procesos', 'Sesiones'],
        published_at: '2024-01-15T09:00:00Z',
      },
      {
        scope: 'metodologia',
        title: 'Guía de Facilitación',
        description: 'Scripts y dinámicas para facilitadores.',
        content_type: 'pdf',
        category: 'Herramientas',
        duration_minutes: 20,
        duration_label: '20 min',
        url: '#',
        author_name: 'Carmenza Alarcón',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Facilitación', 'Soft Skills'],
        published_at: '2024-01-20T09:00:00Z',
      },
      {
        scope: 'metodologia',
        title: 'Assessment Baseline 4Shine',
        description: 'Herramienta interactiva para medición inicial por pilar.',
        content_type: 'scorm',
        category: 'Evaluación',
        duration_minutes: 25,
        duration_label: '25 min',
        url: '#',
        author_name: 'Tech Team',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Diagnóstico', 'Métricas'],
        published_at: '2024-01-05T09:00:00Z',
      },
      {
        scope: 'aprendizaje',
        title: 'Liderazgo Adaptativo en la Era Digital',
        description: 'Introducción a liderazgo adaptativo.',
        content_type: 'scorm',
        category: 'Liderazgo',
        duration_minutes: 45,
        duration_label: '45 min',
        url: '#',
        author_name: '4Shine Academy',
        author_user_id: mentorCarlosId,
        is_recommended: true,
        tags: ['Liderazgo', 'Digital'],
        published_at: '2024-02-01T09:00:00Z',
      },
      {
        scope: 'aprendizaje',
        title: 'Comunicación Asertiva y Feedback Efectivo',
        description: 'Comunicación ejecutiva para líderes.',
        content_type: 'scorm',
        category: 'Comunicación',
        duration_minutes: 55,
        duration_label: '55 min',
        url: '#',
        author_name: 'Ana García',
        author_user_id: mentorAnaId,
        is_recommended: true,
        tags: ['Feedback', 'Comunicación'],
        published_at: '2024-02-15T09:00:00Z',
      },
      {
        scope: 'aprendizaje',
        title: 'Toma de Decisiones Estratégicas',
        description: 'Framework práctico para decisiones de alto impacto.',
        content_type: 'scorm',
        category: 'Estrategia',
        duration_minutes: 70,
        duration_label: '70 min',
        url: '#',
        author_name: 'Global Strategy Unit',
        author_user_id: mentorCarlosId,
        is_recommended: true,
        tags: ['Estrategia', 'Decisiones'],
        published_at: '2024-03-01T09:00:00Z',
      },
      {
        scope: 'aprendizaje',
        title: 'Bienestar y Salud Mental en el Trabajo',
        description: 'Herramientas de wellbeing para equipos.',
        content_type: 'scorm',
        category: 'Bienestar',
        duration_minutes: 35,
        duration_label: '35 min',
        url: '#',
        author_name: 'Wellness Program',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Wellbeing', 'Salud'],
        published_at: '2024-04-20T09:00:00Z',
      },
      {
        scope: 'aprendizaje',
        title: 'Diversidad e Inclusión en el Liderazgo',
        description: 'Buenas prácticas de inclusión en alta dirección.',
        content_type: 'scorm',
        category: 'Inclusión',
        duration_minutes: 50,
        duration_label: '50 min',
        url: '#',
        author_name: 'D&I Committee',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Diversidad', 'Inclusión'],
        published_at: '2024-05-01T09:00:00Z',
      },
      {
        scope: 'formacion_mentores',
        title: 'Fundamentos del Mentoring 4Shine',
        description: 'Ruta base de certificación de mentores.',
        content_type: 'scorm',
        category: 'Metodología',
        duration_minutes: 45,
        duration_label: '45 min',
        url: '#',
        author_name: '4Shine Academy',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Mentoring', 'Fundamentos'],
        published_at: '2024-01-01T09:00:00Z',
      },
      {
        scope: 'formacion_mentores',
        title: 'Escucha Activa y Comunicación',
        description: 'Técnicas avanzadas de escucha en sesiones.',
        content_type: 'scorm',
        category: 'Habilidades Blandas',
        duration_minutes: 30,
        duration_label: '30 min',
        url: '#',
        author_name: '4Shine Academy',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Comunicación', 'Soft Skills'],
        published_at: '2024-01-01T09:00:00Z',
      },
      {
        scope: 'formacion_mentores',
        title: 'Feedback Efectivo y Constructivo',
        description: 'Modelos prácticos de feedback para mentores.',
        content_type: 'scorm',
        category: 'Habilidades Blandas',
        duration_minutes: 35,
        duration_label: '35 min',
        url: '#',
        author_name: '4Shine Academy',
        author_user_id: gestorId,
        is_recommended: true,
        tags: ['Feedback', 'Comunicación'],
        published_at: '2024-01-01T09:00:00Z',
      },
      {
        scope: 'formacion_lideres',
        title: 'Marketing Digital para Líderes',
        description: 'Estrategias de posicionamiento digital ejecutivo.',
        content_type: 'scorm',
        category: 'Marketing',
        duration_minutes: 60,
        duration_label: '60 min',
        url: '#',
        author_name: 'Marketing Team',
        author_user_id: mentorAnaId,
        is_recommended: false,
        tags: ['Marketing', 'Digital'],
        published_at: '2024-04-05T09:00:00Z',
      },
      {
        scope: 'formacion_lideres',
        title: 'Gestión del Cambio Organizacional',
        description: 'Implementación de cambios de alto impacto.',
        content_type: 'scorm',
        category: 'Gestión del Cambio',
        duration_minutes: 55,
        duration_label: '55 min',
        url: '#',
        author_name: 'Change Management',
        author_user_id: mentorCarlosId,
        is_recommended: true,
        tags: ['Cambio', 'Transformación'],
        published_at: '2024-04-10T09:00:00Z',
      },
      {
        scope: 'formacion_lideres',
        title: 'Presentaciones de Alto Impacto',
        description: 'Comunicación oral para comité directivo.',
        content_type: 'scorm',
        category: 'Comunicación',
        duration_minutes: 55,
        duration_label: '55 min',
        url: '#',
        author_name: 'Comms Team',
        author_user_id: mentorAnaId,
        is_recommended: true,
        tags: ['Public Speaking', 'Presentaciones'],
        published_at: '2024-05-10T09:00:00Z',
      },
    ];

    const contentIds = new Map();
    for (const item of contentSeed) {
      const contentId = await ensureContentItem({
        ...item,
        created_by: gestorId,
      });
      contentIds.set(`${item.scope}::${item.title}`, contentId);

      for (const tagName of item.tags) {
        const tagResult = await client.query(
          `
            INSERT INTO app_learning.tags (tag_name)
            VALUES ($1)
            ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name
            RETURNING tag_id
          `,
          [tagName],
        );
        await client.query(
          `
            INSERT INTO app_learning.content_tags (content_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (content_id, tag_id) DO NOTHING
          `,
          [contentId, tagResult.rows[0].tag_id],
        );
      }
    }

    const learningTargets = [
      'Liderazgo Adaptativo en la Era Digital',
      'Comunicación Asertiva y Feedback Efectivo',
      'Toma de Decisiones Estratégicas',
      'Bienestar y Salud Mental en el Trabajo',
      'Diversidad e Inclusión en el Liderazgo',
    ];

    for (const title of learningTargets) {
      const contentId = contentIds.get(`aprendizaje::${title}`);
      if (!contentId) continue;
      await client.query(
        `
          INSERT INTO app_learning.content_progress (content_id, user_id, progress_percent, seen, started_at, last_viewed_at)
          VALUES
            ($1, $2, 45, true, now() - interval '20 days', now() - interval '1 day'),
            ($1, $3, 20, true, now() - interval '15 days', now() - interval '2 days'),
            ($1, $4, 75, true, now() - interval '12 days', now() - interval '12 hours')
          ON CONFLICT (content_id, user_id) DO UPDATE
          SET progress_percent = EXCLUDED.progress_percent,
              seen = EXCLUDED.seen,
              last_viewed_at = EXCLUDED.last_viewed_at
        `,
        [
          contentId,
          leaderSofiaId,
          userIds.get('jorge.ramirez@4shine.co'),
          userIds.get('ana.torres@4shine.co'),
        ],
      );

      await client.query(
        `
          INSERT INTO app_learning.content_likes (content_id, user_id)
          VALUES ($1, $2), ($1, $3)
          ON CONFLICT (content_id, user_id) DO NOTHING
        `,
        [contentId, leaderSofiaId, mentorCarlosId],
      );
    }

    const whitepaperId = contentIds.get('metodologia::Dossier Maestro 4Shine (Whitepaper)');
    if (whitepaperId) {
      await client.query(
        `
          INSERT INTO app_learning.content_comments (content_id, author_user_id, comment_text)
          VALUES
            ($1, $2, 'Fundamental para entender la base del programa.'),
            ($1, $3, 'Excelente estructura metodológica para cohortes ejecutivas.')
        `,
        [whitepaperId, mentorAnaId, mentorCarlosId],
      );
    }

    const mentorCourse1 = contentIds.get('formacion_mentores::Fundamentos del Mentoring 4Shine');
    const mentorCourse2 = contentIds.get('formacion_mentores::Escucha Activa y Comunicación');
    const mentorCourse3 = contentIds.get('formacion_mentores::Feedback Efectivo y Constructivo');

    const mentorAssignmentSeed = [
      [mentorCourse1, mentorCarlosId, gestorId, 'completed', 100],
      [mentorCourse2, mentorCarlosId, gestorId, 'in_progress', 45],
      [mentorCourse1, mentorAnaId, gestorId, 'not_started', 0],
      [mentorCourse3, mentorAnaId, gestorId, 'in_progress', 30],
    ];

    for (const [contentId, assigneeUserId, assignedBy, status, progress] of mentorAssignmentSeed) {
      if (!contentId || !assigneeUserId) continue;
      await client.query(
        `
          INSERT INTO app_learning.content_assignments (
            content_id,
            assignee_user_id,
            assigned_by,
            status,
            progress_percent,
            last_accessed_at
          )
          VALUES ($1, $2, $3, $4, $5, now() - interval '1 day')
          ON CONFLICT (content_id, assignee_user_id) DO UPDATE
          SET status = EXCLUDED.status,
              progress_percent = EXCLUDED.progress_percent,
              last_accessed_at = EXCLUDED.last_accessed_at
        `,
        [contentId, assigneeUserId, assignedBy, status, progress],
      );
    }

    const connectionsSeed = [
      ['sofia.martinez@4shine.co', 'patricia.gomez@4shine.co', 'connected'],
      ['sofia.martinez@4shine.co', 'david.klein@4shine.co', 'connected'],
      ['sofia.martinez@4shine.co', 'elena.white@4shine.co', 'pending'],
      ['sofia.martinez@4shine.co', 'roberto.diaz@4shine.co', 'pending'],
      ['sofia.martinez@4shine.co', 'fernando.sol@4shine.co', 'connected'],
      ['sofia.martinez@4shine.co', 'monica.perez@4shine.co', 'pending'],
    ];

    for (const [requesterEmail, addresseeEmail, status] of connectionsSeed) {
      const requester = userIds.get(requesterEmail);
      const addressee = userIds.get(addresseeEmail);
      if (!requester || !addressee) continue;

      await client.query(
        `
          INSERT INTO app_networking.connections (
            requester_user_id,
            addressee_user_id,
            status,
            requested_at,
            responded_at
          )
          VALUES ($1, $2, $3, now() - interval '7 days', now() - interval '2 days')
          ON CONFLICT (
            LEAST(requester_user_id, addressee_user_id),
            GREATEST(requester_user_id, addressee_user_id)
          )
          DO UPDATE
          SET status = EXCLUDED.status,
              responded_at = EXCLUDED.responded_at
        `,
        [requester, addressee, status],
      );
    }

    const groupsSeed = [
      {
        name: 'Liderazgo Femenino',
        description: 'Espacio para compartir experiencias y empoderar mujeres líderes.',
        category: 'Social',
        members: ['sofia.martinez@4shine.co', 'ana.torres@4shine.co', 'patricia.gomez@4shine.co'],
      },
      {
        name: 'Innovación & Tech',
        description: 'Debates sobre tendencias tecnológicas y su impacto.',
        category: 'Tecnología',
        members: ['sofia.martinez@4shine.co', 'david.klein@4shine.co', 'roberto.diaz@4shine.co'],
      },
      {
        name: 'Sostenibilidad Corp',
        description: 'Estrategias para prácticas sostenibles empresariales.',
        category: 'Negocios',
        members: ['fernando.sol@4shine.co', 'sofia.martinez@4shine.co', 'luis.vega@4shine.co'],
      },
    ];

    for (const group of groupsSeed) {
      const groupResult = await client.query(
        `
          INSERT INTO app_networking.interest_groups (name, description, category, created_by, is_active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (name) DO UPDATE
          SET description = EXCLUDED.description,
              category = EXCLUDED.category,
              is_active = true
          RETURNING group_id
        `,
        [group.name, group.description, group.category, gestorId],
      );

      const groupId = groupResult.rows[0].group_id;
      await client.query(`DELETE FROM app_networking.group_memberships WHERE group_id = $1`, [groupId]);

      for (let i = 0; i < group.members.length; i += 1) {
        const email = group.members[i];
        const userId = userIds.get(email);
        if (!userId) continue;
        await client.query(
          `
            INSERT INTO app_networking.group_memberships (group_id, user_id, membership_role)
            VALUES ($1, $2, $3)
            ON CONFLICT (group_id, user_id) DO UPDATE
            SET membership_role = EXCLUDED.membership_role
          `,
          [groupId, userId, i === 0 ? 'owner' : 'member'],
        );
      }
    }

    const jobsSeed = [
      {
        title: 'Gerente Regional',
        company_name: 'Alimentos del Valle',
        location: 'Cali, CO',
        work_mode: 'presencial',
        description:
          'Buscamos líder estratégico para dirigir operaciones en el suroccidente.',
        posted_at: '2026-02-27T09:00:00Z',
        tags: ['Ventas', 'Operaciones'],
      },
      {
        title: 'Líder de Transformación Digital',
        company_name: 'Seguros Bolívar',
        location: 'Bogotá, CO',
        work_mode: 'hibrido',
        description: 'Lidera la evolución digital de una organización líder.',
        posted_at: '2026-02-24T09:00:00Z',
        tags: ['Transformación', 'Agile'],
      },
      {
        title: 'Board Member (Externo)',
        company_name: 'Fundación Crecer',
        location: 'Remoto',
        work_mode: 'voluntariado',
        description: 'Únete a junta directiva para aportar visión estratégica.',
        posted_at: '2026-02-21T09:00:00Z',
        tags: ['Estrategia', 'ONG'],
      },
    ];

    const jobIds = [];
    for (const job of jobsSeed) {
      const existing = await client.query(
        `
          SELECT job_post_id
          FROM app_networking.job_posts
          WHERE title = $1
            AND company_name = $2
          LIMIT 1
        `,
        [job.title, job.company_name],
      );

      let jobPostId;
      if (existing.rowCount > 0) {
        jobPostId = existing.rows[0].job_post_id;
        await client.query(
          `
            UPDATE app_networking.job_posts
            SET location = $2,
                work_mode = $3,
                description = $4,
                posted_by = $5,
                posted_at = $6::timestamptz,
                is_active = true
            WHERE job_post_id = $1
          `,
          [jobPostId, job.location, job.work_mode, job.description, gestorId, job.posted_at],
        );
      } else {
        const inserted = await client.query(
          `
            INSERT INTO app_networking.job_posts (
              title,
              company_name,
              location,
              work_mode,
              description,
              posted_by,
              posted_at,
              is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, true)
            RETURNING job_post_id
          `,
          [job.title, job.company_name, job.location, job.work_mode, job.description, gestorId, job.posted_at],
        );
        jobPostId = inserted.rows[0].job_post_id;
      }

      jobIds.push(jobPostId);
      await client.query(`DELETE FROM app_networking.job_post_tags WHERE job_post_id = $1`, [jobPostId]);

      for (const tagName of job.tags) {
        const tagRes = await client.query(
          `
            INSERT INTO app_networking.job_tags (tag_name)
            VALUES ($1)
            ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name
            RETURNING tag_id
          `,
          [tagName],
        );

        await client.query(
          `
            INSERT INTO app_networking.job_post_tags (job_post_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (job_post_id, tag_id) DO NOTHING
          `,
          [jobPostId, tagRes.rows[0].tag_id],
        );
      }
    }

    await client.query(
      `
        INSERT INTO app_networking.job_applications (job_post_id, applicant_user_id, status, applied_at)
        VALUES
          ($1, $3, 'applied', now() - interval '1 day'),
          ($2, $3, 'reviewing', now() - interval '2 days'),
          ($2, $4, 'applied', now() - interval '3 days')
        ON CONFLICT (job_post_id, applicant_user_id) DO UPDATE
        SET status = EXCLUDED.status,
            applied_at = EXCLUDED.applied_at
      `,
      [jobIds[0], jobIds[1], leaderSofiaId, userIds.get('jorge.ramirez@4shine.co')],
    );

    const ensureDirectThread = async (a, b, createdBy) => {
      const existing = await client.query(
        `
          SELECT ct.thread_id
          FROM app_networking.chat_threads ct
          JOIN app_networking.thread_participants p1 ON p1.thread_id = ct.thread_id AND p1.user_id = $1
          JOIN app_networking.thread_participants p2 ON p2.thread_id = ct.thread_id AND p2.user_id = $2
          WHERE ct.thread_type = 'direct'
          LIMIT 1
        `,
        [a, b],
      );

      if (existing.rowCount > 0) {
        return existing.rows[0].thread_id;
      }

      const inserted = await client.query(
        `
          INSERT INTO app_networking.chat_threads (thread_type, created_by)
          VALUES ('direct', $1)
          RETURNING thread_id
        `,
        [createdBy],
      );

      const threadId = inserted.rows[0].thread_id;
      await client.query(
        `
          INSERT INTO app_networking.thread_participants (thread_id, user_id)
          VALUES ($1, $2), ($1, $3)
          ON CONFLICT (thread_id, user_id) DO NOTHING
        `,
        [threadId, a, b],
      );

      return threadId;
    };

    const thread1 = await ensureDirectThread(leaderSofiaId, userIds.get('patricia.gomez@4shine.co'), leaderSofiaId);
    const thread2 = await ensureDirectThread(leaderSofiaId, userIds.get('david.klein@4shine.co'), leaderSofiaId);

    await client.query(`DELETE FROM app_networking.messages WHERE thread_id IN ($1, $2)`, [thread1, thread2]);

    await client.query(
      `
        INSERT INTO app_networking.messages (thread_id, sender_user_id, message_text, created_at)
        VALUES
          ($1, $3, 'Hola Patricia, vi tu perfil y me interesa mucho tu trabajo en Grupo Aval.', now() - interval '2 days'),
          ($1, $4, 'Hola! Muchas gracias.', now() - interval '1 day 2 hours'),
          ($1, $4, '¡Claro! Me encantaría compartir mi experiencia sobre cultura organizacional.', now() - interval '1 day'),
          ($2, $5, 'Hola, ¿cómo estás?', now() - interval '18 hours'),
          ($2, $3, 'Todo bien, gracias. ¿Listo para la sesión?', now() - interval '17 hours'),
          ($2, $5, 'Te envío el link de la reunión para el viernes.', now() - interval '16 hours')
      `,
      [
        thread1,
        thread2,
        leaderSofiaId,
        userIds.get('patricia.gomez@4shine.co'),
        userIds.get('david.klein@4shine.co'),
      ],
    );

    await client.query(
      `
        UPDATE app_networking.thread_participants
        SET last_read_at = now() - interval '20 hours'
        WHERE thread_id = $1
          AND user_id = $2
      `,
      [thread1, leaderSofiaId],
    );

    const workshopsSeed = [
      {
        title: 'Networking de Alto Impacto',
        description:
          'Sesión quincenal para conectar con líderes y compartir experiencias.',
        workshop_type: 'relacionamiento',
        status: 'upcoming',
        starts_at: '2026-03-15T18:00:00Z',
        ends_at: '2026-03-15T19:30:00Z',
        facilitator_name: 'Laura Gestión',
        meeting_url: 'https://zoom.us/j/workshop1',
        attendees: ['sofia.martinez@4shine.co', 'carlos.ruiz@4shine.co'],
      },
      {
        title: 'Taller de Innovación Abierta',
        description: 'Metodologías ágiles para fomentar innovación en equipos.',
        workshop_type: 'innovacion',
        status: 'upcoming',
        starts_at: '2026-03-22T10:00:00Z',
        ends_at: '2026-03-22T11:30:00Z',
        facilitator_name: 'Roberto Innova',
        meeting_url: 'https://zoom.us/j/workshop2',
        attendees: ['sofia.martinez@4shine.co'],
      },
      {
        title: 'Liderazgo Consciente',
        description: 'Herramientas de mindfulness para decisiones estratégicas.',
        workshop_type: 'wellbeing',
        status: 'completed',
        starts_at: '2026-02-01T19:00:00Z',
        ends_at: '2026-02-01T20:00:00Z',
        facilitator_name: 'Sandra Peace',
        meeting_url: null,
        attendees: ['jorge.ramirez@4shine.co', 'ana.torres@4shine.co'],
      },
    ];

    for (const workshop of workshopsSeed) {
      const existing = await client.query(
        `
          SELECT workshop_id
          FROM app_networking.workshops
          WHERE title = $1
            AND starts_at = $2::timestamptz
          LIMIT 1
        `,
        [workshop.title, workshop.starts_at],
      );

      let workshopId;
      if (existing.rowCount > 0) {
        workshopId = existing.rows[0].workshop_id;
        await client.query(
          `
            UPDATE app_networking.workshops
            SET
              description = $2,
              workshop_type = $3,
              status = $4,
              ends_at = $5::timestamptz,
              facilitator_name = $6,
              meeting_url = $7,
              created_by = $8
            WHERE workshop_id = $1
          `,
          [
            workshopId,
            workshop.description,
            workshop.workshop_type,
            workshop.status,
            workshop.ends_at,
            workshop.facilitator_name,
            workshop.meeting_url,
            gestorId,
          ],
        );
      } else {
        const inserted = await client.query(
          `
            INSERT INTO app_networking.workshops (
              title,
              description,
              workshop_type,
              status,
              starts_at,
              ends_at,
              facilitator_name,
              meeting_url,
              created_by
            )
            VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9)
            RETURNING workshop_id
          `,
          [
            workshop.title,
            workshop.description,
            workshop.workshop_type,
            workshop.status,
            workshop.starts_at,
            workshop.ends_at,
            workshop.facilitator_name,
            workshop.meeting_url,
            gestorId,
          ],
        );
        workshopId = inserted.rows[0].workshop_id;
      }

      await client.query(`DELETE FROM app_networking.workshop_attendees WHERE workshop_id = $1`, [workshopId]);
      for (const attendeeEmail of workshop.attendees) {
        const attendeeId = userIds.get(attendeeEmail);
        if (!attendeeId) continue;
        await client.query(
          `
            INSERT INTO app_networking.workshop_attendees (workshop_id, user_id, attendance_status)
            VALUES ($1, $2, 'registered')
            ON CONFLICT (workshop_id, user_id) DO UPDATE
            SET attendance_status = EXCLUDED.attendance_status
          `,
          [workshopId, attendeeId],
        );
      }
    }

    const notificationsSeed = [
      [leaderSofiaId, 'Nuevo Mensaje', 'Carmen te ha enviado un mensaje.', 'message'],
      [leaderSofiaId, 'Mentoría Confirmada', 'Tu sesión con Dr. Carlos está lista.', 'success'],
      [leaderSofiaId, 'Alerta de Progreso', 'Recuerda completar el Test de Liderazgo.', 'alert'],
      [leaderSofiaId, 'Bienvenida', 'Bienvenida a la plataforma 4Shine.', 'info'],
      [mentorCarlosId, 'Nueva Asignación', 'Se asignó un nuevo líder a tu portafolio.', 'info'],
      [gestorId, 'Contenido Pendiente', 'Tienes recursos por aprobar.', 'alert'],
    ];

    for (const [userId, title, message, type] of notificationsSeed) {
      await client.query(
        `
          DELETE FROM app_core.notifications
          WHERE user_id = $1
            AND title = $2
        `,
        [userId, title],
      );

      await client.query(
        `
          INSERT INTO app_core.notifications (user_id, notification_type, title, message)
          VALUES ($1, $2, $3, $4)
        `,
        [userId, type, title, message],
      );
    }

    const quotesSeed = [
      ['El liderazgo no es una posición o un título, es acción y ejemplo.', 'CARMENZA ALARCÓN'],
      ['La innovación distingue a los líderes de los seguidores.', 'STEVE JOBS'],
      ['No cuentes los días, haz que los días cuenten.', 'MUHAMMAD ALI'],
      ['El éxito es la suma de pequeños esfuerzos repetidos día tras día.', 'ROBERT COLLIER'],
    ];

    for (const [quoteText, authorName] of quotesSeed) {
      await client.query(
        `
          INSERT INTO app_core.quotes (quote_text, author_name, is_active)
          SELECT $1, $2, true
          WHERE NOT EXISTS (
            SELECT 1
            FROM app_core.quotes
            WHERE quote_text = $1
          )
        `,
        [quoteText, authorName],
      );
    }

    const newsSeed = [
      ['Lanzamiento Cohorte 5', 'Comunidad', 'Damos la bienvenida a 50 nuevos líderes de LATAM.', 42],
      ['Tendencias 2026: IA y Liderazgo', 'Blog', 'Cómo la IA está transformando las capacidades del C-Level.', 128],
      ['Nuevo módulo: Presencia Estratégica', 'Producto', 'Ya está habilitado para líderes y mentores.', 65],
    ];

    for (const [title, category, summary, likesCount] of newsSeed) {
      await client.query(
        `
          INSERT INTO app_core.news_updates (title, category, summary, likes_count, created_by)
          SELECT $1, $2, $3, $4, $5
          WHERE NOT EXISTS (
            SELECT 1
            FROM app_core.news_updates
            WHERE title = $1
          )
        `,
        [title, category, summary, likesCount, gestorId],
      );
    }

    await client.query('COMMIT');

    const checks = await client.query(
      `
        SELECT
          (SELECT COUNT(*)::int FROM app_core.users WHERE is_active = true) AS users,
          (SELECT COUNT(*)::int FROM app_core.cohorts WHERE status = 'active') AS active_cohorts,
          (SELECT COUNT(*)::int FROM app_learning.content_items WHERE status = 'published') AS published_content,
          (SELECT COUNT(*)::int FROM app_mentoring.mentorship_sessions) AS mentorship_sessions,
          (SELECT COUNT(*)::int FROM app_networking.job_posts WHERE is_active = true) AS active_jobs,
          (SELECT COUNT(*)::int FROM app_networking.workshops) AS workshops
      `,
    );

    console.log('Seed completed successfully');
    console.table(checks.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

await run();
