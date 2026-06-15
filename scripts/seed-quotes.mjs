/**
 * Seed: base de conocimiento de "Mensajes del día" (app_core.quotes).
 * Run: DATABASE_URL=<url> node scripts/seed-quotes.mjs
 * Idempotente: no duplica por quote_text.
 */

import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const QUOTES = [
  ['El liderazgo no es una posición o un título, es acción y ejemplo.', 'Carmenza Alarcón'],
  ['La innovación distingue a los líderes de los seguidores.', 'Steve Jobs'],
  ['No cuentes los días, haz que los días cuenten.', 'Muhammad Ali'],
  ['El éxito es la suma de pequeños esfuerzos repetidos día tras día.', 'Robert Collier'],
  ['Un líder es quien conoce el camino, anda el camino y muestra el camino.', 'John C. Maxwell'],
  ['El verdadero liderazgo empieza por liderarte a ti mismo.', '4Shine'],
  ['La disciplina es el puente entre las metas y los logros.', 'Jim Rohn'],
  ['No gestionamos personas, lideramos personas y gestionamos cosas.', 'Grace Hopper'],
  ['Crecer no es hacer más, es hacer lo correcto con más consciencia.', '4Shine'],
  ['El liderazgo es la capacidad de convertir una visión en realidad.', 'Warren Bennis'],
  ['Tu enfoque determina tu realidad.', 'Qui-Gon Jinn'],
  ['La claridad es poder: define hacia dónde vas y por qué.', '4Shine'],
  ['El que tiene un porqué para vivir puede soportar casi cualquier cómo.', 'Friedrich Nietzsche'],
  ['Las grandes cosas en los negocios nunca las hace una sola persona; las hace un equipo.', 'Steve Jobs'],
  ['Lidera con el ejemplo, porque tus acciones hablan más fuerte que tus palabras.', '4Shine'],
  ['La excelencia no es un acto, sino un hábito.', 'Aristóteles'],
  ['Rodéate de quienes te reten a crecer, no solo de quienes te aplaudan.', '4Shine'],
  ['El cambio es la ley de la vida; quien solo mira al pasado pierde el presente.', 'John F. Kennedy'],
  ['La mejor manera de predecir el futuro es crearlo.', 'Peter Drucker'],
  ['Un equipo no es un grupo de personas que trabajan juntas, es un grupo que confía entre sí.', 'Simon Sinek'],
  ['Hazlo con miedo, pero hazlo. La acción vence a la duda.', '4Shine'],
  ['El liderazgo y el aprendizaje son indispensables el uno para el otro.', 'John F. Kennedy'],
  ['No esperes el momento perfecto; toma el momento y hazlo perfecto.', '4Shine'],
  ['La calidad nunca es un accidente; siempre es el resultado de un esfuerzo inteligente.', 'John Ruskin'],
  ['Cuida tus pensamientos, se convierten en tus actos; cuida tus actos, se convierten en tu carácter.', 'Lao-Tsé'],
  ['El progreso constante, por pequeño que sea, vence al talento sin acción.', '4Shine'],
  ['Sé el cambio que quieres ver en el mundo.', 'Mahatma Gandhi'],
  ['Sigue avanzando con enfoque.', '4Shine'],
];

let inserted = 0;
for (const [text, author] of QUOTES) {
  const res = await pool.query(
    `INSERT INTO app_core.quotes (quote_text, author_name, is_active)
     SELECT $1, $2, true
     WHERE NOT EXISTS (SELECT 1 FROM app_core.quotes WHERE quote_text = $1)`,
    [text, author],
  );
  if (res.rowCount > 0) inserted += 1;
}

console.log(`Done. Inserted ${inserted} new quote(s) of ${QUOTES.length}.`);
await pool.end();
