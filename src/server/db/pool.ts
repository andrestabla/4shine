import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const DEFAULT_RUNTIME_ROLE = 'app_runtime';
const ROLE_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/i;

const globalForPool = globalThis as unknown as {
  __4shine_pool__?: Pool;
};

const configuredRuntimeRole = process.env.DB_RUNTIME_ROLE?.trim();
const runtimeRole = configuredRuntimeRole === '' ? null : configuredRuntimeRole ?? DEFAULT_RUNTIME_ROLE;

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function applyRuntimeRole(client: PoolClient): Promise<void> {
  if (!runtimeRole) {
    return;
  }

  if (!ROLE_NAME_PATTERN.test(runtimeRole)) {
    throw new Error(`Invalid DB_RUNTIME_ROLE: ${runtimeRole}`);
  }

  await client.query(`SET ROLE ${quoteIdentifier(runtimeRole)}`);
}

async function resetRuntimeRole(client: PoolClient): Promise<void> {
  if (!runtimeRole) {
    return;
  }

  try {
    await client.query('RESET ROLE');
  } catch {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors when no transaction is active.
    }
    await client.query('RESET ROLE');
  }
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new Pool({
    connectionString,
    max: 100,
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
    await applyRuntimeRole(client);
    return await fn(client);
  } finally {
    let resetError: Error | null = null;
    try {
      await resetRuntimeRole(client);
    } catch (error) {
      resetError = error instanceof Error ? error : new Error('Failed to reset runtime role');
    }

    if (resetError) {
      client.release(resetError);
    } else {
      client.release();
    }
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
