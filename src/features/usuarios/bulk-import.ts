import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import type { Role } from '@/server/bootstrap/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { createUser } from './service';
import { USER_COUNTRY_SET, USER_JOB_ROLE_SET } from '@/lib/user-demographics';

/** Roles que la importación permite asignar. */
const IMPORTABLE_ROLES = new Set<Role>(['lider', 'mentor', 'gestor', 'invitado']);

/** Máximo de filas por importación: evita cargas descomunales que agoten recursos. */
export const BULK_IMPORT_MAX_ROWS = 500;

/** Una fila cruda tal como llega del archivo (claves ya normalizadas por el cliente). */
export interface BulkImportRow {
  correo?: string;
  nombres?: string;
  apellidos?: string;
  rol?: string;
  pais?: string;
  cargo?: string;
  profesion?: string;
}

export interface BulkImportRowResult {
  fila: number; // 1-indexado como en la hoja (sin contar el encabezado)
  correo: string;
  estado: 'creado' | 'error' | 'omitido';
  motivo?: string;
}

export interface BulkImportResult {
  total: number;
  creados: number;
  errores: number;
  omitidos: number;
  /** true si fue una validación (dry-run) sin crear nada. */
  dryRun: boolean;
  resultados: BulkImportRowResult[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normStr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

/** Traduce el rol escrito por el usuario a un Role válido (tolerante a mayúsculas/sinónimos). */
function parseRole(raw: string): Role | null {
  const v = raw.trim().toLowerCase();
  if (v === '' || v === 'líder' || v === 'lider') return 'lider';
  if (v === 'mentor' || v === 'advisor') return 'mentor';
  if (v === 'gestor') return 'gestor';
  if (v === 'invitado') return 'invitado';
  return null;
}

/**
 * Valida (y opcionalmente crea) un lote de usuarios desde un archivo.
 *
 * Diseño: cada fila se procesa de forma INDEPENDIENTE. Un error en una fila no
 * detiene ni revierte las demás — así el admin recibe un reporte completo y
 * puede corregir solo las filas fallidas y reintentarlas. La creación no va en
 * una sola transacción por la misma razón.
 */
export async function bulkImportUsers(
  client: PoolClient,
  actor: AuthUser,
  rows: BulkImportRow[],
  options: { dryRun: boolean; sendWelcomeEmail: boolean },
): Promise<BulkImportResult> {
  await requireModulePermission(client, 'usuarios', 'create');

  if (rows.length > BULK_IMPORT_MAX_ROWS) {
    throw new Error(`El archivo tiene ${rows.length} filas; el máximo por carga es ${BULK_IMPORT_MAX_ROWS}.`);
  }

  const resultados: BulkImportRowResult[] = [];
  const vistosEnArchivo = new Set<string>();
  let creados = 0;
  let errores = 0;
  let omitidos = 0;

  // Correos que ya existen en la BD, en una sola consulta (no una por fila).
  const correosArchivo = rows.map((r) => normStr(r.correo).toLowerCase()).filter(Boolean);
  const existentes = new Set<string>();
  if (correosArchivo.length > 0) {
    const { rows: dbRows } = await client.query<{ email: string }>(
      `SELECT email::text FROM app_core.users WHERE email = ANY($1::citext[])`,
      [correosArchivo],
    );
    for (const r of dbRows) existentes.add(r.email.toLowerCase());
  }

  for (let i = 0; i < rows.length; i++) {
    const fila = i + 1;
    const row = rows[i];
    const correo = normStr(row.correo).toLowerCase();
    const push = (estado: BulkImportRowResult['estado'], motivo?: string) => {
      resultados.push({ fila, correo, estado, motivo });
      if (estado === 'creado') creados++;
      else if (estado === 'error') errores++;
      else omitidos++;
    };

    // ── Validaciones ──────────────────────────────────────────────────────
    if (!correo) { push('error', 'Falta el correo.'); continue; }
    if (!EMAIL_RE.test(correo)) { push('error', 'Correo con formato inválido.'); continue; }
    if (vistosEnArchivo.has(correo)) { push('omitido', 'Correo repetido dentro del archivo.'); continue; }
    vistosEnArchivo.add(correo);
    if (existentes.has(correo)) { push('omitido', 'Ya existe una cuenta con ese correo.'); continue; }

    const nombres = normStr(row.nombres);
    const apellidos = normStr(row.apellidos);
    if (!nombres) { push('error', 'Falta el nombre.'); continue; }

    const role = parseRole(normStr(row.rol));
    if (role === null || !IMPORTABLE_ROLES.has(role)) {
      push('error', `Rol inválido: "${normStr(row.rol)}". Usa lider, mentor, gestor o invitado.`);
      continue;
    }

    const pais = normStr(row.pais);
    if (pais && !USER_COUNTRY_SET.has(pais)) {
      push('error', `País no reconocido: "${pais}".`);
      continue;
    }
    const cargo = normStr(row.cargo);
    if (cargo && !USER_JOB_ROLE_SET.has(cargo)) {
      push('error', `Cargo no reconocido: "${cargo}".`);
      continue;
    }

    // En dry-run solo se valida: no se crea nada.
    if (options.dryRun) { resultados.push({ fila, correo, estado: 'creado', motivo: 'Válido' }); creados++; continue; }

    // ── Creación ──────────────────────────────────────────────────────────
    try {
      // Contraseña temporal; el usuario la recibe en el correo de bienvenida y,
      // por must_change_password, la cambia en el primer ingreso.
      const tempPassword = `4S-${randomBytes(6).toString('base64url')}`;
      await createUser(client, actor, {
        email: correo,
        firstName: nombres,
        lastName: apellidos,
        primaryRole: role,
        password: tempPassword,
        country: pais || null,
        jobRole: (cargo || null) as never,
        profession: normStr(row.profesion) || null,
        sendWelcomeEmail: options.sendWelcomeEmail,
      });
      push('creado');
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Error desconocido al crear.');
    }
  }

  return {
    total: rows.length,
    creados,
    errores,
    omitidos,
    dryRun: options.dryRun,
    resultados,
  };
}
