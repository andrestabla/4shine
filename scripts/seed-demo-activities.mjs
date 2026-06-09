/**
 * Seed de 9 actividades demo, una por cada tipo de pregunta soportado.
 * Cada actividad vive en su propio content_item con content_type='activity'.
 *
 * Idempotente: si el content_item con el mismo title+scope ya existe,
 * actualiza la actividad y reemplaza las preguntas.
 */

import { randomUUID } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const ADMIN_USER_ID = '083d4298-ac29-423e-81c3-ab17f462d66f';
const SCOPE = 'aprendizaje';
const CATEGORY = 'Demo · Actividad';

// Helper UUIDs por pregunta/opción
const id = () => randomUUID();

const ACTIVITIES = [
  {
    title: 'Demo · Opción única',
    description: 'Quiz con preguntas de selección única (radio). 1 sola correcta por pregunta.',
    activity: {
      title: 'Liderazgo y comunicación',
      instructions: 'Selecciona la respuesta correcta en cada pregunta.',
      passingScore: 60,
      questions: [
        {
          type: 'single_choice',
          prompt: '¿Cuál es el pilar 4Shine que se enfoca en autoconocimiento y mentalidad?',
          points: 1,
          explanation: 'Shine Within trabaja la base personal del líder: identidad, creencias y mentalidad.',
          payload: () => {
            const optA = id(), optB = id(), optC = id(), optD = id();
            return {
              options: [
                { id: optA, text: 'Shine Within', isCorrect: true },
                { id: optB, text: 'Shine Out', isCorrect: false },
                { id: optC, text: 'Shine Up', isCorrect: false },
                { id: optD, text: 'Shine Beyond', isCorrect: false },
              ],
            };
          },
        },
        {
          type: 'single_choice',
          prompt: '¿Cuál es la mejor práctica al dar feedback negativo?',
          points: 1,
          explanation: 'Hablar en privado y centrarse en hechos observables protege la relación y la autoestima.',
          payload: () => {
            const a = id(), b = id(), c = id();
            return {
              options: [
                { id: a, text: 'Hacerlo público para que otros aprendan', isCorrect: false },
                { id: b, text: 'En privado y centrado en hechos observables', isCorrect: true },
                { id: c, text: 'Cuando estés enojado, así sale natural', isCorrect: false },
              ],
            };
          },
        },
      ],
    },
  },
  {
    title: 'Demo · Opción múltiple',
    description: 'Preguntas con varias respuestas correctas. Puntaje parcial.',
    activity: {
      title: 'Comunicación efectiva',
      instructions: 'Marca todas las opciones correctas.',
      passingScore: 60,
      questions: [
        {
          type: 'multiple_choice',
          prompt: '¿Cuáles de estos son hábitos de escucha activa? (marca todos los que apliquen)',
          points: 2,
          explanation: 'Parafrasear, validar emociones y hacer preguntas abiertas son hábitos de escucha activa.',
          payload: () => {
            const a = id(), b = id(), c = id(), d = id(), e = id();
            return {
              strictAll: false,
              options: [
                { id: a, text: 'Parafrasear lo que escuchaste', isCorrect: true },
                { id: b, text: 'Interrumpir para corregir', isCorrect: false },
                { id: c, text: 'Validar la emoción del otro', isCorrect: true },
                { id: d, text: 'Hacer preguntas abiertas', isCorrect: true },
                { id: e, text: 'Mirar el celular mientras habla', isCorrect: false },
              ],
            };
          },
        },
      ],
    },
  },
  {
    title: 'Demo · Verdadero / Falso',
    description: 'Verificación rápida de conceptos clave.',
    activity: {
      title: 'Mitos del liderazgo',
      instructions: 'Decide si cada afirmación es verdadera o falsa.',
      passingScore: 60,
      questions: [
        {
          type: 'true_false',
          prompt: 'Un buen líder siempre tiene la respuesta correcta antes que su equipo.',
          points: 1,
          explanation: 'Falso. Los buenos líderes hacen preguntas, escuchan y co-crean con su equipo. No necesitan saberlo todo.',
          payload: () => ({ correctAnswer: false }),
        },
        {
          type: 'true_false',
          prompt: 'El feedback negativo es más útil cuando es específico y a tiempo.',
          points: 1,
          explanation: 'Verdadero. La especificidad y la oportunidad maximizan el aprendizaje.',
          payload: () => ({ correctAnswer: true }),
        },
        {
          type: 'true_false',
          prompt: 'Delegar es lo mismo que descargar tareas.',
          points: 1,
          explanation: 'Falso. Delegar implica claridad de outcome, autonomía y accountability — no solo descargar.',
          payload: () => ({ correctAnswer: false }),
        },
      ],
    },
  },
  {
    title: 'Demo · Completar espacios',
    description: 'Respuestas escritas con tolerancia a tildes y mayúsculas.',
    activity: {
      title: 'Conceptos 4Shine',
      instructions: 'Escribe la palabra correcta. Se acepta con o sin tildes.',
      passingScore: 60,
      questions: [
        {
          type: 'fill_blank',
          prompt: 'El primer pilar 4Shine que trabaja autoconocimiento se llama "Shine ___".',
          points: 1,
          explanation: 'Shine Within = mentalidad, propósito, identidad.',
          payload: () => ({
            acceptedAnswers: ['within', 'Within', 'WITHIN'],
            caseInsensitive: true,
            accentInsensitive: true,
          }),
        },
        {
          type: 'fill_blank',
          prompt: 'La práctica de escuchar sin interrumpir, validando y parafraseando se llama "escucha ___".',
          points: 1,
          explanation: 'Escucha activa: parafrasear + validar + preguntar.',
          payload: () => ({
            acceptedAnswers: ['activa', 'active', 'Activa'],
            caseInsensitive: true,
            accentInsensitive: true,
          }),
        },
      ],
    },
  },
  {
    title: 'Demo · Respuesta numérica',
    description: 'Preguntas que aceptan un número con tolerancia.',
    activity: {
      title: 'Datos del liderazgo',
      instructions: 'Ingresa el número. Algunas preguntas aceptan tolerancia.',
      passingScore: 50,
      questions: [
        {
          type: 'numeric',
          prompt: '¿Cuántos pilares tiene el modelo 4Shine?',
          points: 1,
          explanation: 'Within, Out, Up, Beyond = 4 pilares.',
          payload: () => ({ correctValue: 4, tolerance: 0 }),
        },
        {
          type: 'numeric',
          prompt: 'Según estudios de Gallup, ¿qué porcentaje aproximado de empleados se sienten "engaged" en su trabajo? (tolerancia ±5%)',
          points: 1,
          explanation: 'Aproximadamente 23-32% según el año del estudio. Aceptamos rango amplio.',
          payload: () => ({ correctValue: 25, tolerance: 8 }),
        },
      ],
    },
  },
  {
    title: 'Demo · Ordenamiento',
    description: 'Ordenar pasos / etapas correctamente.',
    activity: {
      title: 'Modelo Tuckman de equipos',
      instructions: 'Ordena las etapas en la secuencia correcta del modelo Tuckman.',
      passingScore: 75,
      questions: [
        {
          type: 'ordering',
          prompt: 'Ordena las 5 etapas del modelo Tuckman de desarrollo de equipos:',
          points: 2,
          explanation: 'Forming → Storming → Norming → Performing → Adjourning.',
          payload: () => {
            const f = id(), s = id(), n = id(), p = id(), a = id();
            return {
              items: [
                { id: f, text: 'Forming (formación)' },
                { id: s, text: 'Storming (tormenta)' },
                { id: n, text: 'Norming (normalización)' },
                { id: p, text: 'Performing (desempeño)' },
                { id: a, text: 'Adjourning (cierre)' },
              ],
              correctOrder: [f, s, n, p, a],
            };
          },
        },
      ],
    },
  },
  {
    title: 'Demo · Emparejar',
    description: 'Unir conceptos con su definición o pareja.',
    activity: {
      title: 'Pilares 4Shine y su foco',
      instructions: 'Empareja cada pilar 4Shine con el área que trabaja.',
      passingScore: 75,
      questions: [
        {
          type: 'matching',
          prompt: 'Empareja cada pilar con su área de impacto:',
          points: 2,
          explanation: 'Within=mentalidad, Out=comunicación, Up=influencia, Beyond=legado.',
          payload: () => {
            const lW = id(), lO = id(), lU = id(), lB = id();
            const rW = id(), rO = id(), rU = id(), rB = id();
            return {
              leftItems: [
                { id: lW, text: 'Shine Within' },
                { id: lO, text: 'Shine Out' },
                { id: lU, text: 'Shine Up' },
                { id: lB, text: 'Shine Beyond' },
              ],
              rightItems: [
                { id: rW, text: 'Mentalidad y autoconocimiento' },
                { id: rO, text: 'Comunicación con el equipo' },
                { id: rU, text: 'Influencia con jefes y stakeholders' },
                { id: rB, text: 'Propósito y legado' },
              ],
              correctPairs: [
                [lW, rW],
                [lO, rO],
                [lU, rU],
                [lB, rB],
              ],
            };
          },
        },
      ],
    },
  },
  {
    title: 'Demo · Clasificar',
    description: 'Arrastrar items a la categoría correcta.',
    activity: {
      title: 'Estilos de liderazgo',
      instructions: 'Clasifica cada comportamiento según el estilo de liderazgo correspondiente.',
      passingScore: 70,
      questions: [
        {
          type: 'classification',
          prompt: 'Clasifica cada comportamiento por el estilo de liderazgo que representa:',
          points: 3,
          explanation: 'Autocrático = decisiones unilaterales, Democrático = consulta y co-decisión, Coach = preguntas y desarrollo.',
          payload: () => {
            const auto = id(), demo = id(), coach = id();
            return {
              buckets: [
                { id: auto, label: 'Autocrático' },
                { id: demo, label: 'Democrático' },
                { id: coach, label: 'Coach' },
              ],
              items: [
                { id: id(), text: '"Yo decido, ustedes ejecutan."', correctBucketId: auto },
                { id: id(), text: '"¿Qué opinan? Decidamos juntos."', correctBucketId: demo },
                { id: id(), text: '"¿Qué crees que deberíamos hacer y por qué?"', correctBucketId: coach },
                { id: id(), text: '"Hagan lo que les digo, sin preguntas."', correctBucketId: auto },
                { id: id(), text: '"Votemos para elegir el camino."', correctBucketId: demo },
                { id: id(), text: '"¿Cómo te sentirías si lo intentas y fallas?"', correctBucketId: coach },
              ],
            };
          },
        },
      ],
    },
  },
  {
    title: 'Demo · Identificar zona en imagen',
    description: 'Hotspot — click en zona de imagen.',
    activity: {
      title: 'Anatomía del cerebro: la corteza prefrontal',
      instructions: 'Haz click sobre la corteza prefrontal en la imagen.',
      passingScore: 100,
      questions: [
        {
          type: 'hotspot',
          prompt: 'Click sobre la zona del cerebro asociada a la toma de decisiones racionales y el autocontrol.',
          points: 1,
          explanation: 'La corteza prefrontal (lóbulo frontal) regula decisiones complejas, planificación y autocontrol.',
          payload: () => ({
            // Imagen ilustrativa pública de cerebro. Puede reemplazarse con upload R2.
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Sobo_1909_624.png/640px-Sobo_1909_624.png',
            correctRegion: { x: 0.22, y: 0.35, radius: 0.12 },
          }),
        },
      ],
    },
  },
];

async function upsertContentItem(pool, def) {
  // Buscar content_item existente por (scope, title, category)
  const { rows: existing } = await pool.query(
    `SELECT content_id::text FROM app_learning.content_items
     WHERE scope = $1 AND title = $2 AND category = $3 LIMIT 1`,
    [SCOPE, def.title, CATEGORY],
  );
  let contentId;
  if (existing[0]) {
    contentId = existing[0].content_id;
    await pool.query(
      `UPDATE app_learning.content_items
       SET description = $2, content_type = 'activity', updated_at = now(), status = 'published'
       WHERE content_id = $1::uuid`,
      [contentId, def.description],
    );
    console.log(`  ↻ Actualizado content_item: ${def.title}`);
  } else {
    const r = await pool.query(
      `INSERT INTO app_learning.content_items
        (scope, title, description, content_type, category, status, created_by)
       VALUES ($1, $2, $3, 'activity', $4, 'published', $5::uuid)
       RETURNING content_id::text`,
      [SCOPE, def.title, def.description, CATEGORY, ADMIN_USER_ID],
    );
    contentId = r.rows[0].content_id;
    console.log(`  ✓ Creado content_item: ${def.title}`);
  }
  return contentId;
}

async function upsertActivity(pool, contentId, def) {
  // Upsert content_activities (unique en content_id)
  const r = await pool.query(
    `INSERT INTO app_learning.content_activities
       (content_id, title, instructions, passing_score, max_attempts, is_active, created_by)
     VALUES ($1::uuid, $2, $3, $4, 0, true, $5::uuid)
     ON CONFLICT (content_id) DO UPDATE SET
       title = EXCLUDED.title,
       instructions = EXCLUDED.instructions,
       passing_score = EXCLUDED.passing_score,
       is_active = EXCLUDED.is_active,
       updated_at = now()
     RETURNING activity_id::text`,
    [contentId, def.title, def.instructions, def.passingScore, ADMIN_USER_ID],
  );
  const activityId = r.rows[0].activity_id;

  // Delete + reinsert questions
  await pool.query(
    `DELETE FROM app_learning.activity_questions WHERE activity_id = $1::uuid`,
    [activityId],
  );
  for (let i = 0; i < def.questions.length; i++) {
    const q = def.questions[i];
    const payload = q.payload();
    await pool.query(
      `INSERT INTO app_learning.activity_questions
        (activity_id, sort_order, question_type, prompt, explanation, points, payload)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb)`,
      [activityId, i, q.type, q.prompt, q.explanation ?? null, q.points ?? 1, JSON.stringify(payload)],
    );
  }
  return activityId;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    console.log(`\nSeeding ${ACTIVITIES.length} demo activities…\n`);
    for (const def of ACTIVITIES) {
      const contentId = await upsertContentItem(pool, def);
      const activityId = await upsertActivity(pool, contentId, def.activity);
      console.log(`     activity_id: ${activityId.slice(0, 8)}…  · ${def.activity.questions.length} pregunta${def.activity.questions.length === 1 ? '' : 's'}\n`);
    }
    console.log('✅ Done.\n');
  } finally {
    await pool.end();
  }
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
