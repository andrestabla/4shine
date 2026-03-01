import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const globalForPool = globalThis as unknown as {
  __4shine_pool__?: Pool;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export function getPool(): Pool {
  if (globalForPool.__4shine_pool__) {
    return globalForPool.__4shine_pool__;
  }

  const pool = createPool();
  if (process.env.NODE_ENV !== 'production') {
    globalForPool.__4shine_pool__ = pool;
  }

  return pool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withRoleContext<T>(
  client: PoolClient,
  userId: string,
  role: string,
  fn: () => Promise<T>,
): Promise<T> {
  await client.query('BEGIN');
  try {
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId]);
    await client.query('SELECT set_config($1, $2, true)', ['app.current_role', role]);
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export function mapRows<T extends QueryResultRow>(rows: QueryResultRow[]): T[] {
  return rows as T[];
}
