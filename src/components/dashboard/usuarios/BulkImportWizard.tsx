'use client';

import React from 'react';
import { Download, Upload, X, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, CreditCard } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { PlanPickerDialog } from './PlanPickerDialog';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
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

const STEPS: { key: Step; label: string }[] = [
  { key: 'subir', label: 'Archivo' },
  { key: 'revisar', label: 'Revisar' },
  { key: 'listo', label: 'Resultado' },
];

export function BulkImportWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { alert } = useAppDialog();
  const [step, setStep] = React.useState<Step>('subir');
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<BulkImportRow[]>([]);
  const [validation, setValidation] = React.useState<BulkImportResult | null>(null);
  const [commitResult, setCommitResult] = React.useState<BulkImportResult | null>(null);
  const [sendWelcome, setSendWelcome] = React.useState(true);
  const [plan, setPlan] = React.useState<SubscriptionPlanWithFeatures | null>(null);
  const [showPlanPicker, setShowPlanPicker] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
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
      setValidation(await validateUsers(parsed));
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
      const result = await commitUsers(rows, sendWelcome, plan?.planId ?? null);
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
  const activeStepIndex = STEPS.findIndex((s) => s.key === step);
  const problemas = (commitResult ?? validation)?.resultados.filter((r) => r.estado !== 'creado') ?? [];

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[rgba(22,10,38,0.6)] p-4 backdrop-blur-sm">
      <div className="mt-6 w-[min(96vw,880px)] overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-white shadow-2xl">
        {/* Cabecera con degradado de marca */}
        <div
          className="relative px-6 py-5"
          style={{ background: 'linear-gradient(120deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 78%, black))' }}
        >
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/15">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black">Carga masiva de usuarios</h2>
              <p className="text-sm text-white/70">Crea muchas cuentas desde un archivo XLSX o CSV.</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < activeStepIndex;
              const active = i === activeStepIndex;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      active ? 'bg-white text-[var(--brand-primary)]' : done ? 'bg-white/30 text-white' : 'bg-white/15 text-white/60'
                    }`}>
                      {done ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-white/60'}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`h-px w-8 ${done ? 'bg-white/40' : 'bg-white/15'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ── Paso 1 ─────────────────────────────────────────────── */}
          {step === 'subir' && (
            <div className="space-y-5">
              <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] text-xs font-bold text-white">1</span>
                  <p className="text-sm font-bold text-[var(--app-ink)]">Descarga la plantilla</p>
                </div>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  Columnas: <code className="rounded bg-white px-1.5 py-0.5 text-xs">{BULK_IMPORT_COLUMNS.join(', ')}</code>.
                  Obligatorias: <strong>correo</strong> y <strong>nombres</strong>. El rol por defecto es <strong>lider</strong>.
                </p>
                <button type="button" onClick={downloadTemplate} className="app-button-secondary mt-3">
                  <Download size={15} /> Descargar plantilla (.xlsx)
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-primary)] text-xs font-bold text-white">2</span>
                  <p className="text-sm font-bold text-[var(--app-ink)]">Sube tu archivo</p>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragging(false);
                    const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={`cursor-pointer rounded-[16px] border-2 border-dashed p-10 text-center transition ${
                    dragging ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--app-border)] hover:border-[var(--app-muted)]'
                  }`}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
                    {busy ? <Loader2 size={22} className="animate-spin text-[var(--brand-primary)]" /> : <Upload size={22} className="text-[var(--brand-primary)]" />}
                  </div>
                  <p className="text-sm font-semibold text-[var(--app-ink)]">
                    {busy ? 'Leyendo archivo…' : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">XLSX o CSV · máximo 500 filas</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Paso 2 ─────────────────────────────────────────────── */}
          {step === 'revisar' && validation && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--app-muted)]">
                Archivo <strong className="text-[var(--app-ink)]">{fileName}</strong> · {validation.total} fila(s).
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Se crearán" value={validCount} tone="emerald" />
                <Stat label="Se omiten" value={skipCount} tone={skipCount ? 'amber' : undefined} />
                <Stat label="Con error" value={errCount} tone={errCount ? 'rose' : undefined} />
              </div>

              {problemas.length > 0 && (
                <div className="max-h-52 overflow-auto rounded-[12px] border border-[var(--app-border)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--app-surface-muted)]">
                      <tr className="text-left text-xs uppercase tracking-wide text-[var(--app-muted)]">
                        <th className="px-3 py-2">Fila</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problemas.map((r, i) => (
                        <tr key={`${r.fila}-${i}`} className="border-t border-[var(--app-border)]/60">
                          <td className="px-3 py-1.5 text-[var(--app-muted)]">{r.fila}</td>
                          <td className="px-3 py-1.5">{r.correo || '—'}</td>
                          <td className="px-3 py-1.5"><span className={r.estado === 'error' ? 'text-rose-700' : 'text-amber-700'}>{r.motivo}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Opciones de creación */}
              <div className="space-y-3 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <label className="flex items-start gap-2 text-sm text-[var(--app-ink)]">
                  <input type="checkbox" className="mt-0.5" checked={sendWelcome} onChange={(e) => setSendWelcome(e.target.checked)} />
                  <span>Enviar correo de bienvenida con credenciales a cada usuario creado.</span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--app-border)] pt-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
                    <CreditCard size={15} className="text-[var(--app-muted)]" />
                    {plan ? (
                      <span>Plan para los líderes: <strong>{plan.name}</strong></span>
                    ) : (
                      <span className="text-[var(--app-muted)]">Sin plan asignado (opcional)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {plan && (
                      <button type="button" onClick={() => setPlan(null)} className="text-xs font-semibold text-[var(--app-muted)] underline">Quitar</button>
                    )}
                    <button type="button" onClick={() => setShowPlanPicker(true)} className="app-button-secondary text-xs">
                      {plan ? 'Cambiar plan' : 'Asignar plan'}
                    </button>
                  </div>
                </div>
              </div>

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

          {/* ── Paso 3 ─────────────────────────────────────────────── */}
          {step === 'listo' && commitResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <p className="text-sm text-emerald-900">
                  <strong>{commitResult.creados}</strong> usuario(s) creado(s)
                  {plan && <> con el plan <strong>{plan.name}</strong></>}
                  {commitResult.errores > 0 && <> · <strong>{commitResult.errores}</strong> con error</>}
                  {commitResult.omitidos > 0 && <> · <strong>{commitResult.omitidos}</strong> omitido(s)</>}.
                </p>
              </div>
              {problemas.length > 0 && (
                <div className="max-h-52 overflow-auto rounded-[12px] border border-[var(--app-border)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--app-surface-muted)]">
                      <tr className="text-left text-xs uppercase tracking-wide text-[var(--app-muted)]">
                        <th className="px-3 py-2">Fila</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problemas.map((r, i) => (
                        <tr key={`${r.fila}-${i}`} className="border-t border-[var(--app-border)]/60">
                          <td className="px-3 py-1.5 text-[var(--app-muted)]">{r.fila || '—'}</td>
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

      {showPlanPicker && (
        <PlanPickerDialog
          title="Plan para los líderes creados"
          description="Se aplicará a los usuarios con rol líder que se creen en esta carga. Es opcional."
          confirmLabel="Usar este plan"
          onConfirm={(p) => { setPlan(p); setShowPlanPicker(false); }}
          onClose={() => setShowPlanPicker(false)}
        />
      )}
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
