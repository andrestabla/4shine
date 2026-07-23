import { read, utils, writeFile } from 'xlsx';
import { requestApi } from '@/lib/api-client';
import type { BulkImportRow, BulkImportResult } from './bulk-import';

export type { BulkImportRow, BulkImportResult, BulkImportRowResult } from './bulk-import';

/** Columnas de la plantilla, en orden. La primera fila del archivo son estos títulos. */
export const BULK_IMPORT_COLUMNS = [
  'correo',
  'nombres',
  'apellidos',
  'rol',
  'pais',
  'cargo',
  'profesion',
] as const;

/** Sinónimos de encabezado aceptados → clave canónica. Tolerante a tildes/mayúsculas. */
const HEADER_ALIASES: Record<string, keyof BulkImportRow> = {
  correo: 'correo', email: 'correo', 'e-mail': 'correo', 'correo electronico': 'correo',
  nombres: 'nombres', nombre: 'nombres', 'first name': 'nombres', firstname: 'nombres',
  apellidos: 'apellidos', apellido: 'apellidos', 'last name': 'apellidos', lastname: 'apellidos',
  rol: 'rol', role: 'rol', perfil: 'rol',
  pais: 'pais', country: 'pais',
  cargo: 'cargo', 'job role': 'cargo', puesto: 'cargo',
  profesion: 'profesion', profession: 'profesion', profesión: 'profesion',
};

function normalizeHeader(raw: string): keyof BulkImportRow | null {
  const key = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .trim()
    .toLowerCase();
  return HEADER_ALIASES[key] ?? null;
}

/**
 * Lee un archivo XLSX o CSV en el navegador y devuelve las filas normalizadas.
 * Los encabezados desconocidos se ignoran; los conocidos se mapean por sinónimo.
 */
export async function parseUsersFile(file: File): Promise<BulkImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  // header:1 → matriz de celdas; la primera fila son los encabezados.
  const matrix = utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: '' });
  if (matrix.length < 2) return [];

  const headerRow = (matrix[0] ?? []).map((h) => normalizeHeader(String(h)));
  const rows: BulkImportRow[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i] ?? [];
    const row: BulkImportRow = {};
    let hasAny = false;
    headerRow.forEach((key, col) => {
      if (!key) return;
      const value = String(cells[col] ?? '').trim();
      if (value) hasAny = true;
      row[key] = value;
    });
    if (hasAny) rows.push(row);
  }
  return rows;
}

/** Descarga una plantilla XLSX con los encabezados y una fila de ejemplo. */
export function downloadTemplate(): void {
  const ejemplo = {
    correo: 'lider@empresa.com',
    nombres: 'Ana',
    apellidos: 'Pérez',
    rol: 'lider',
    pais: '',
    cargo: '',
    profesion: '',
  };
  const sheet = utils.json_to_sheet([ejemplo], { header: [...BULK_IMPORT_COLUMNS] });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheet, 'Usuarios');
  writeFile(wb, 'plantilla_carga_usuarios.xlsx');
}

/** Valida las filas en el servidor sin crear nada (dry-run). */
export function validateUsers(rows: BulkImportRow[]): Promise<BulkImportResult> {
  return requestApi<BulkImportResult>('/api/v1/modules/usuarios/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ rows, dryRun: true }),
  });
}

/** Crea las filas válidas. sendWelcomeEmail controla el correo con credenciales. */
export function commitUsers(
  rows: BulkImportRow[],
  sendWelcomeEmail: boolean,
  planId?: string | null,
): Promise<BulkImportResult> {
  return requestApi<BulkImportResult>('/api/v1/modules/usuarios/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ rows, dryRun: false, sendWelcomeEmail, planId: planId ?? null }),
  });
}
