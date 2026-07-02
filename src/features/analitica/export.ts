import { utils, writeFile, type WorkSheet } from 'xlsx';
import { jsPDF } from 'jspdf';
import { formatDate } from '@/lib/format-date';
import type { AnalyticsResult, NameCount, SeriesPoint } from './types';

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}
function fmtRange(r: AnalyticsResult['range']): string {
  return `${formatDate(r.from)} — ${formatDate(r.to)}`;
}

type Row = (string | number)[];

function ncRows(title: string, data: NameCount[]): Row[] {
  return [[title], ['Etiqueta', 'Valor'], ...data.map((x) => [x.label, x.value]), []];
}
function seriesRows(title: string, data: SeriesPoint[]): Row[] {
  return [[title], ['Fecha', 'Valor'], ...data.map((x) => [x.date, x.value]), []];
}
function kpiRows(title: string, pairs: [string, string | number][]): Row[] {
  return [[title], ...pairs.map(([k, v]) => [k, v]), []];
}

function sheetFrom(aoa: Row[], colWidths: number[] = [34, 16]): WorkSheet {
  const sheet = utils.aoa_to_sheet(aoa);
  sheet['!cols'] = colWidths.map((wch) => ({ wch }));
  return sheet;
}

export function exportAnalyticsXlsx(d: AnalyticsResult): void {
  const wb = utils.book_new();
  const add = (name: string, aoa: Row[], cols?: number[]) =>
    utils.book_append_sheet(wb, sheetFrom(aoa, cols), name.slice(0, 31));

  add('Resumen', [
    ['Analítica 4Shine', '', ''],
    ['Periodo', fmtRange(d.range)],
    [],
    ...kpiRows('Indicadores clave', [
      ['Usuarios totales', d.usuarios.total],
      ['Usuarios activos', d.usuarios.active],
      ['Nuevos (periodo)', d.usuarios.newInRange],
      ['Sesiones de mentoría', d.mentorias.totalSessions],
      ['Sesiones completadas', d.mentorias.completedSessions],
      ['% asistencia mentorías', `${d.mentorias.attendanceRate}%`],
      ['Diagnósticos', d.descubrimiento.total],
      ['% completitud diagnóstico', `${d.descubrimiento.completionRate}%`],
      ['Avance promedio workbooks', `${d.aprendizaje.workbookAvgCompletion}%`],
      ['Conexiones', d.networking.totalConnections],
      ['Convocatorias', d.convocatorias.total],
      ['Aplicaciones a convocatorias', d.convocatorias.totalApplications],
      ['Workshops', d.workshops.total],
    ]),
  ]);

  add('Usuarios', [
    ...ncRows('Por rol', d.usuarios.byRole),
    ...ncRows('Líderes por plan', d.usuarios.byPlan),
    ...ncRows('Por país', d.usuarios.byCountry),
    ...ncRows('Vigencia de suscripción', d.usuarios.vigencia),
    ...seriesRows('Nuevos usuarios por día', d.usuarios.signupsSeries),
  ]);

  add('Mentorias', [
    ...ncRows('Por estado', d.mentorias.byStatus),
    ...ncRows('Individual vs Grupal', d.mentorias.individualVsGroup),
    ...ncRows('Participación grupal', d.mentorias.groupParticipation),
    ...seriesRows('Sesiones por día', d.mentorias.sessionsSeries),
  ]);

  add('Descubrimiento', [
    ...ncRows('Por estado', d.descubrimiento.byStatus),
    ...ncRows('Promedio por pilar (0-100)', d.descubrimiento.avgPillars),
    ...seriesRows('Completados por día', d.descubrimiento.completionsSeries),
  ]);

  add('Aprendizaje', [
    ...ncRows('Contenido por tipo', d.aprendizaje.contentByType),
    ...ncRows('Contenido por estado', d.aprendizaje.contentByStatus),
    ...seriesRows('Completados por día', d.aprendizaje.completionsSeries),
  ]);

  add('Networking', [
    ...ncRows('Conexiones por estado', d.networking.byStatus),
    ...seriesRows('Conexiones por día', d.networking.connectionsSeries),
  ]);

  add('Convocatorias', [
    ...ncRows('Por estado', d.convocatorias.byStatus),
    ...ncRows('Top por aplicaciones', d.convocatorias.topByApplications),
    ...seriesRows('Aplicaciones por día', d.convocatorias.applicationsSeries),
  ]);

  add('Workshops', [
    ...ncRows('Por estado', d.workshops.byStatus),
    ...ncRows('Por estado de asistencia', d.workshops.byAttendance),
    ...seriesRows('Inscripciones por día', d.workshops.registrationsSeries),
  ]);

  writeFile(wb, `analitica_${stamp()}.xlsx`, { bookType: 'xlsx' });
}

interface PdfBranding {
  brandName?: string;
  primaryColor?: string;
}
function hexToRgb(hex: string | undefined): [number, number, number] {
  const fallback: [number, number, number] = [124, 58, 237];
  if (!hex) return fallback;
  const m = hex.replace('#', '');
  if (m.length !== 6) return fallback;
  const n = Number.parseInt(m, 16);
  if (Number.isNaN(n)) return fallback;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function exportAnalyticsPdf(d: AnalyticsResult, branding: PdfBranding = {}): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const [r, g, b] = hexToRgb(branding.primaryColor);
  const mx = 12;
  let y = 0;

  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, pageW, 20, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text(`${branding.brandName ?? '4Shine'} · Reporte de analítica`, mx, 9);
  pdf.setFontSize(9);
  pdf.text(`Periodo: ${fmtRange(d.range)} · Generado ${formatDate(new Date())}`, mx, 15);
  y = 28;

  const ensure = (need: number) => {
    if (y + need > pageH - 12) {
      pdf.addPage();
      y = 16;
    }
  };
  const section = (title: string) => {
    ensure(12);
    pdf.setTextColor(r, g, b);
    pdf.setFontSize(12);
    pdf.text(title, mx, y);
    y += 6;
    pdf.setDrawColor(225, 225, 225);
    pdf.line(mx, y, pageW - mx, y);
    y += 5;
  };
  const lines = (pairs: [string, string | number][]) => {
    pdf.setFontSize(9.5);
    for (const [k, v] of pairs) {
      ensure(6);
      pdf.setTextColor(90, 90, 90);
      pdf.text(String(k), mx, y);
      pdf.setTextColor(30, 30, 30);
      pdf.text(String(v), pageW - mx, y, { align: 'right' });
      y += 5.5;
    }
    y += 3;
  };
  const ncToPairs = (data: NameCount[]): [string, number][] =>
    data.length ? data.map((x) => [x.label, x.value] as [string, number]) : [['Sin datos', 0]];

  section('Resumen');
  lines([
    ['Usuarios activos / totales', `${d.usuarios.active} / ${d.usuarios.total}`],
    ['Nuevos en el periodo', d.usuarios.newInRange],
    ['Sesiones de mentoría (completadas)', `${d.mentorias.totalSessions} (${d.mentorias.completedSessions})`],
    ['% asistencia mentorías', `${d.mentorias.attendanceRate}%`],
    ['Diagnósticos · % completitud', `${d.descubrimiento.total} · ${d.descubrimiento.completionRate}%`],
    ['Avance promedio workbooks', `${d.aprendizaje.workbookAvgCompletion}%`],
    ['Conexiones', d.networking.totalConnections],
    ['Convocatorias · aplicaciones', `${d.convocatorias.total} · ${d.convocatorias.totalApplications}`],
    ['Workshops', d.workshops.total],
  ]);

  section('Usuarios por rol');
  lines(ncToPairs(d.usuarios.byRole));
  section('Líderes por plan');
  lines(ncToPairs(d.usuarios.byPlan));
  section('Vigencia de suscripción');
  lines(ncToPairs(d.usuarios.vigencia));
  section('Mentorías por estado');
  lines(ncToPairs(d.mentorias.byStatus));
  section('Descubrimiento · promedio por pilar');
  lines(ncToPairs(d.descubrimiento.avgPillars));
  section('Aprendizaje · contenido por tipo');
  lines(ncToPairs(d.aprendizaje.contentByType));
  section('Networking · conexiones por estado');
  lines(ncToPairs(d.networking.byStatus));
  section('Convocatorias por estado');
  lines(ncToPairs(d.convocatorias.byStatus));
  section('Workshops por estado');
  lines(ncToPairs(d.workshops.byStatus));

  pdf.save(`analitica_${stamp()}.pdf`);
}
