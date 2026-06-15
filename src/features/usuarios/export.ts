import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import type { UserRecord } from './client';
import { deriveUserTypeSelection, userTypeLabel } from './user-types';
import { subscriptionStatus, formatExpiry } from './subscription-status';

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ExportRow {
  Nombre: string;
  Email: string;
  Tipo: string;
  Plan: string;
  Vigencia: string;
  'Estado vigencia': string;
  Estado: string;
  Políticas: string;
  'Aceptó políticas': string;
  Creado: string;
}

function toExportRow(u: UserRecord): ExportRow {
  const status = subscriptionStatus(u.subscriptionExpiresAt);
  return {
    Nombre: u.displayName,
    Email: u.email,
    Tipo: userTypeLabel(deriveUserTypeSelection(u)),
    Plan: u.subscriptionPlanName ?? 'Sin plan',
    Vigencia: formatExpiry(u.subscriptionExpiresAt),
    'Estado vigencia': status.label,
    Estado: u.isActive ? 'Activo' : 'Inactivo',
    Políticas: u.policyStatus === 'accepted' ? 'Aceptadas' : 'Pendiente',
    'Aceptó políticas': fmtDate(u.policyAcceptedAt),
    Creado: fmtDate(u.createdAt),
  };
}

export function exportUsersXlsx(rows: UserRecord[]): void {
  const data = rows.map(toExportRow);
  const sheet = utils.json_to_sheet(data);
  // Anchos de columna razonables.
  sheet['!cols'] = [
    { wch: 26 }, { wch: 30 }, { wch: 22 }, { wch: 22 }, { wch: 14 },
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
  ];
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheet, 'Usuarios');
  writeFile(wb, `usuarios_${stamp()}.xlsx`, { bookType: 'xlsx' });
}

interface PdfBranding {
  brandName?: string;
  primaryColor?: string; // hex
}

function hexToRgb(hex: string | undefined): [number, number, number] {
  const fallback: [number, number, number] = [79, 35, 96];
  if (!hex) return fallback;
  const m = hex.replace('#', '');
  if (m.length !== 6) return fallback;
  const n = Number.parseInt(m, 16);
  if (Number.isNaN(n)) return fallback;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function exportUsersPdf(rows: UserRecord[], branding: PdfBranding = {}): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const [r, g, b] = hexToRgb(branding.primaryColor);
  const marginX = 10;

  // Encabezado de marca
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, pageW, 18, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(13);
  pdf.text(`${branding.brandName ?? '4Shine'} · Reporte de usuarios`, marginX, 12);
  pdf.setFontSize(9);
  pdf.text(`${rows.length} usuarios · ${new Date().toLocaleDateString('es-CO')}`, pageW - marginX, 12, {
    align: 'right',
  });

  // Columnas
  const cols = [
    { key: 'Nombre', x: marginX, w: 50 },
    { key: 'Email', x: marginX + 50, w: 62 },
    { key: 'Plan', x: marginX + 112, w: 48 },
    { key: 'Vigencia', x: marginX + 160, w: 26 },
    { key: 'Estado vigencia', x: marginX + 186, w: 28 },
    { key: 'Estado', x: marginX + 214, w: 22 },
  ] as const;

  let y = 26;
  const drawHeader = () => {
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    for (const c of cols) pdf.text(c.key, c.x, y);
    y += 2;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(marginX, y, pageW - marginX, y);
    y += 4;
  };
  drawHeader();

  pdf.setFontSize(8);
  for (const u of rows) {
    if (y > pageH - 12) {
      pdf.addPage();
      y = 14;
      drawHeader();
    }
    const row = toExportRow(u);
    pdf.setTextColor(40, 40, 40);
    for (const c of cols) {
      const value = String((row as unknown as Record<string, string>)[c.key] ?? '');
      const text = pdf.splitTextToSize(value, c.w - 2)[0] ?? '';
      pdf.text(text, c.x, y);
    }
    y += 6;
  }

  pdf.save(`usuarios_${stamp()}.pdf`);
}
