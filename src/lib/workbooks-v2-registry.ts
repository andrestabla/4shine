import { WB1_V3_CONFIG, type WB1Config } from './workbooks-v2-wb1';
import { WB2_V3_CONFIG } from './workbooks-v2-wb2';
import { WB3_V3_CONFIG } from './workbooks-v2-wb3';
import { WB4_V3_CONFIG } from './workbooks-v2-wb4';
import { WB5_V3_CONFIG } from './workbooks-v2-wb5';
import { WB6_V3_CONFIG } from './workbooks-v2-wb6';
import { WB7_V3_CONFIG } from './workbooks-v2-wb7';
import { WB8_V3_CONFIG } from './workbooks-v2-wb8';
import { WB9_V3_CONFIG } from './workbooks-v2-wb9';
import { WB10_V3_CONFIG } from './workbooks-v2-wb10';

/**
 * Registro de las estructuras de los 10 workbooks, utilizable desde el cliente.
 * Sirve para poner en contexto las respuestas guardadas: el estado del líder
 * solo tiene pares `id: texto`, y aquí está la pregunta que corresponde a cada
 * id, con su sección y su grupo.
 */
export const WORKBOOK_CONFIG_BY_CODE: Record<string, WB1Config> = {
  wb1: WB1_V3_CONFIG,
  wb2: WB2_V3_CONFIG as WB1Config,
  wb3: WB3_V3_CONFIG as WB1Config,
  wb4: WB4_V3_CONFIG as WB1Config,
  wb5: WB5_V3_CONFIG as WB1Config,
  wb6: WB6_V3_CONFIG as WB1Config,
  wb7: WB7_V3_CONFIG as WB1Config,
  wb8: WB8_V3_CONFIG as WB1Config,
  wb9: WB9_V3_CONFIG as WB1Config,
  wb10: WB10_V3_CONFIG as WB1Config,
};

export function getWorkbookConfig(code: string | null | undefined): WB1Config | null {
  if (!code) return null;
  return WORKBOOK_CONFIG_BY_CODE[code.trim().toLowerCase()] ?? null;
}

export interface WorkbookAnswer {
  fieldId: string;
  label: string;
  answer: string;
}

export interface WorkbookAnswerGroup {
  sectionLabel: string;
  groupTitle: string | null;
  answers: WorkbookAnswer[];
}

/**
 * Normaliza el estado guardado. Conviven dos formatos:
 *   A) una llave por campo:      { "wb1v3-1-1": "texto" }
 *   B) un blob de localStorage:  { "workbooks-v2-wb1-v3-state": "{\"values\":{…}}" }
 * Se leen ambos; si un id aparece en los dos, gana el que tenga texto.
 */
export function hasLegacyPayload(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload || typeof payload !== 'object') return false;
  return Object.entries(payload).some(([key, value]) => {
    if (!/^workbooks-v2-/.test(key) || typeof value !== 'string') return false;
    try {
      const blob = JSON.parse(value) as { values?: unknown };
      return !!blob && typeof blob === 'object' && !Array.isArray(blob) && !blob.values;
    } catch {
      return false;
    }
  });
}

export function normalizeWorkbookState(payload: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!payload || typeof payload !== 'object') return out;

  const asText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const text = (value as { text?: unknown }).text;
      if (typeof text === 'string') return text;
    }
    return '';
  };

  for (const [key, value] of Object.entries(payload)) {
    if (/^wb\d+v3-/.test(key)) {
      const text = asText(value).trim();
      if (text) out[key] = text;
      continue;
    }
    if (/^workbooks-v2-/.test(key) && typeof value === 'string') {
      try {
        const blob = JSON.parse(value) as Record<string, unknown>;
        if (blob && typeof blob === 'object' && !Array.isArray(blob)) {
          const values = (blob as { values?: Record<string, unknown> }).values;
          if (values && typeof values === 'object') {
            for (const [id, raw] of Object.entries(values)) {
              const text = asText(raw).trim();
              if (text && !out[id]) out[id] = text;
            }
          }
          // Estructura V2 antigua (secciones anidadas, sin `values`): sus
          // textos son andamiaje de la plantilla mezclado con respuestas y no
          // hay forma fiable de separarlos, así que no se inventan: se avisa
          // en la vista y se ofrece abrir el workbook.
        }
      } catch {
        // Un blob ilegible no debe romper la vista: se ignora.
      }
    }
  }

  return out;
}

/** Agrupa las respuestas por sección y grupo, en el orden del workbook. */
export function buildWorkbookAnswers(
  code: string | null | undefined,
  payload: Record<string, unknown> | null | undefined,
): { groups: WorkbookAnswerGroup[]; answered: number; total: number; orphan: WorkbookAnswer[]; legacy: boolean } {
  const config = getWorkbookConfig(code);
  const state = normalizeWorkbookState(payload);
  const used = new Set<string>();
  const groups: WorkbookAnswerGroup[] = [];
  let total = 0;

  if (config) {
    for (const section of config.sections ?? []) {
      for (const group of section.groups ?? []) {
        const answers: WorkbookAnswer[] = [];
        for (const field of group.fields ?? []) {
          total += 1;
          const answer = state[field.id];
          if (answer) {
            used.add(field.id);
            answers.push({ fieldId: field.id, label: field.label, answer });
          }
        }
        if (answers.length > 0) {
          groups.push({
            sectionLabel: section.label ?? section.shortLabel ?? '',
            groupTitle: group.title ?? null,
            answers,
          });
        }
      }
    }
  }

  // Respuestas cuyo id ya no existe en la estructura actual (workbooks viejos):
  // se muestran igual, porque son trabajo del líder.
  const orphan = Object.entries(state)
    .filter(([id]) => !used.has(id))
    .map(([fieldId, answer]) => ({ fieldId, label: fieldId, answer }));

  const answered = used.size + orphan.length;
  return { groups, answered, total: total || answered, orphan, legacy: hasLegacyPayload(payload) };
}
