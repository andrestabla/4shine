'use client';

import React from 'react';
import { Download, Upload, X, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  parseUsersFile,
  downloadTemplate,
  validateUsers,
  commitUsers,
  BULK_IMPORT_COLUMNS,
  type BulkImportRow,
  type BulkImportResult,
} from '@/features/usuarios/bulk-import-client';

type Step = 'subir' | 'revisar' | 'listo';

export function BulkImportWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { alert } = useAppDialog();
  const [step, setStep] = React.useState<Step>('subir');
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<BulkImportRow[]>([]);
  const [validation, setValidation] = React.useState<BulkImportResult | null>(null);
  const [commitResult, setCommitResult] = React.useState<BulkImportResult | null>(null);
  const [sendWelcome, setSendWelcome] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const parsed = await parseUsersFile(file);
      if (parsed.length === 0) {
        await alert({ title: 'Archivo vacío', message: 'No encontramos filas con datos. Revisa que la primera fila sean los encabezados.', tone: 'warning' });
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      const result = await validateUsers(parsed);
      setValidation(result);
      setStep('revisar');
    } catch (error) {
      await alert({ title: 'No se pudo leer el archivo', message: error instanceof Error ? error.message : 'Formato no reconocido. Usa XLSX o CSV.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    setBusy(true);
    try {
      const result = await commitUsers(rows, sendWelcome);
      setCommitResult(result);
      setStep('listo');
      onDone();
    } catch (error) {
      await alert({ title: 'No se pudo completar la carga', message: error instanceof Error ? error.message : 'Error desconocido.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const validCount = validation?.creados ?? 0; // en dry-run "creados" = válidos
  const skipCount = validation?.omitidos ?? 0;
  const errCount = validation?.errores ?? 0;
  const filas = (commitResult ?? validation)?.resultados ?? [];

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[rgba(22,10,38,0.58)] p-4 backdrop-blur-sm">
      <div className="mt-8 w-[min(96vw,860px)] rounded-[20px] border border-[var(--app-border)] bg-white shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-[var(--brand-primary)]" />
            <h2 className="text-lg font-black text-[var(--app-ink)]">Carga masiva de usuarios</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── Paso 1: subir ─────────────────────────────────────────── */}
          {step === 'subir' && (
            <div className="space-y-5">
              <div className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--app-ink)]">1. Descarga la plantilla</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Columnas: <code>{BULK_IMPORT_COLUMNS.join(', ')}</code>. Obligatorias: <strong>correo</strong> y{' '}
                  <strong>nombres</strong>. El rol por defecto es <strong>lider</strong>.
                </p>
                <button type="button" onClick={downloadTemplate} className="app-button-secondary mt-3">
                  <Download size={15} /> Descargar plantilla (.xlsx)
                </button>
              </div>

              <div className="rounded-[14px] border-2 border-dashed border-[var(--app-border)] p-8 text-center">
                <p className="text-sm font-semibold text-[var(--app-ink)]">2. Sube tu archivo</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">Formatos: XLSX o CSV. Máximo 500 filas por carga.</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }}
                />
                <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="app-button-primary mt-4 disabled:opacity-60">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {busy ? 'Leyendo…' : 'Seleccionar archivo'}
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 2: revisar ───────────────────────────────────────── */}
          {step === 'revisar' && validation && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--app-muted)]">
                Archivo <strong>{fileName}</strong> · {validation.total} filas.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Válidos" value={validCount} tone="emerald" />
                <Stat label="Se omiten" value={skipCount} tone="amber" />
                <Stat label="Con error" value={errCount} tone={errCount ? 'rose' : undefined} />
              </div>

              {(errCount > 0 || skipCount > 0) && (
                <div className="max-h-56 overflow-auto rounded-[12px] border border-[var(--app-border)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--app-surface-muted)]">
                      <tr className="text-left text-xs uppercase tracking-wide text-[var(--app-muted)]">
                        <th className="px-3 py-2">Fila</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.filter((r) => r.estado !== 'creado').map((r) => (
                        <tr key={r.fila} className="border-t border-[var(--app-border)]/60">
                          <td className="px-3 py-1.5 text-[var(--app-muted)]">{r.fila}</td>
                          <td className="px-3 py-1.5">{r.correo || '—'}</td>
                          <td className="px-3 py-1.5 text-[var(--app-muted)]">
                            <span className={r.estado === 'error' ? 'text-rose-700' : 'text-amber-700'}>{r.motivo}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
                <input type="checkbox" checked={sendWelcome} onChange={(e) => setSendWelcome(e.target.checked)} />
                Enviar correo de bienvenida con credenciales a cada usuario creado
              </label>

              <div className="flex justify-between gap-2 pt-1">
                <button type="button" onClick={() => setStep('subir')} className="app-button-secondary">Atrás</button>
                <button
                  type="button"
                  disabled={busy || validCount === 0}
                  onClick={() => void handleCommit()}
                  className="app-button-primary disabled:opacity-60"
                  title={validCount === 0 ? 'No hay filas válidas para crear' : undefined}
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Crear {validCount} usuario{validCount === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 3: listo ─────────────────────────────────────────── */}
          {step === 'listo' && commitResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <p className="text-sm text-emerald-900">
                  <strong>{commitResult.creados}</strong> usuario(s) creado(s)
                  {commitResult.errores > 0 && <> · <strong>{commitResult.errores}</strong> con error</>}
                  {commitResult.omitidos > 0 && <> · <strong>{commitResult.omitidos}</strong> omitido(s)</>}.
                </p>
              </div>
              {(commitResult.errores > 0 || commitResult.omitidos > 0) && (
                <div className="max-h-56 overflow-auto rounded-[12px] border border-[var(--app-border)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--app-surface-muted)]">
                      <tr className="text-left text-xs uppercase tracking-wide text-[var(--app-muted)]">
                        <th className="px-3 py-2">Fila</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commitResult.resultados.filter((r) => r.estado !== 'creado').map((r) => (
                        <tr key={r.fila} className="border-t border-[var(--app-border)]/60">
                          <td className="px-3 py-1.5 text-[var(--app-muted)]">{r.fila}</td>
                          <td className="px-3 py-1.5">{r.correo || '—'}</td>
                          <td className="px-3 py-1.5">
                            <span className={r.estado === 'error' ? 'text-rose-700' : 'text-amber-700'}>
                              <AlertTriangle size={12} className="mr-1 inline" />{r.motivo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end">
                <button type="button" onClick={onClose} className="app-button-primary">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'rose' }) {
  const color = tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : tone === 'rose' ? 'text-rose-700' : 'text-[var(--app-ink)]';
  return (
    <div className="rounded-[12px] border border-[var(--app-border)] p-3 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
    </div>
  );
}
