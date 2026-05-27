'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  getRolePermissionsMatrix,
  updateRolePermission,
} from '@/features/roles/client';
import type {
  RolePermissionCell,
  RolePermissionsMatrix,
} from '@/features/roles/client';
import {
  PERMISSION_FIELDS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  type PermissionField,
  type RoleCode,
} from '@/features/roles/types';

interface PendingChange {
  roleCode: RoleCode;
  moduleCode: string;
  field: PermissionField;
  value: boolean;
}

function keyOf(roleCode: RoleCode, moduleCode: string): string {
  return `${roleCode}::${moduleCode}`;
}

function emptyCell(roleCode: RoleCode, moduleCode: string): RolePermissionCell {
  return {
    roleCode,
    moduleCode,
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canModerate: false,
    canManage: false,
  };
}

export function RolesMatrixSection() {
  const [matrix, setMatrix] = useState<RolePermissionsMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; message: string } | null>(null);
  const [activeRole, setActiveRole] = useState<RoleCode>('admin');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getRolePermissionsMatrix();
      if (cancelled) return;
      if (res.ok && res.data) setMatrix(res.data);
      else setError(res.error ?? 'Error al cargar la matriz de roles.');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const permissionMap = useMemo(() => {
    const map = new Map<string, RolePermissionCell>();
    if (matrix) {
      for (const cell of matrix.permissions) {
        map.set(keyOf(cell.roleCode, cell.moduleCode), cell);
      }
    }
    return map;
  }, [matrix]);

  async function onTogglePermission(change: PendingChange) {
    if (!matrix) return;
    const key = keyOf(change.roleCode, change.moduleCode);
    setSaving(`${key}::${change.field}`);
    setFeedback(null);

    const res = await updateRolePermission({
      roleCode: change.roleCode,
      moduleCode: change.moduleCode,
      [change.field]: change.value,
    });

    if (res.ok && res.data) {
      setMatrix((prev) => {
        if (!prev) return prev;
        const others = prev.permissions.filter(
          (p) => !(p.roleCode === change.roleCode && p.moduleCode === change.moduleCode),
        );
        return { ...prev, permissions: [...others, res.data!] };
      });
      setFeedback({
        tone: 'ok',
        message: `${ROLE_LABELS[change.roleCode]} · ${change.moduleCode} · ${PERMISSION_LABELS[change.field]}: guardado.`,
      });
    } else {
      setFeedback({
        tone: 'err',
        message: res.error ?? 'No se pudo guardar el cambio.',
      });
    }
    setSaving(null);
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-[var(--app-muted)]">Cargando matriz de roles…</div>;
  }
  if (error || !matrix) {
    return (
      <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error ?? 'No disponible'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <span>
            Cada cambio se guarda al instante y aplica de inmediato a los usuarios con ese rol.
            Marca/desmarca los permisos por módulo para ajustar el alcance de cada rol del sistema.
          </span>
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {matrix.roles.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeRole === role
                ? 'bg-[var(--app-ink)] text-white'
                : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
            feedback.tone === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.tone === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-[1rem] border border-[var(--app-border)] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-[var(--app-surface-muted)]">
            <tr className="border-b border-[var(--app-border)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--app-ink)]">Módulo</th>
              {PERMISSION_FIELDS.map((field) => (
                <th
                  key={field}
                  className="px-2 py-3 text-center text-xs font-semibold text-[var(--app-ink)]"
                >
                  {PERMISSION_LABELS[field]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.modules.map((mod) => {
              const cell =
                permissionMap.get(keyOf(activeRole, mod.moduleCode)) ?? emptyCell(activeRole, mod.moduleCode);
              return (
                <tr
                  key={mod.moduleCode}
                  className="border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-surface-muted)]/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--app-ink)]">{mod.moduleName}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                      <code>{mod.moduleCode}</code>
                      {mod.isCore && (
                        <span className="ml-2 inline-block rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-800">
                          core
                        </span>
                      )}
                    </p>
                  </td>
                  {PERMISSION_FIELDS.map((field) => {
                    const checked = cell[field];
                    const busyKey = `${keyOf(activeRole, mod.moduleCode)}::${field}`;
                    return (
                      <td key={field} className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-[var(--app-ink)] disabled:opacity-40"
                          checked={checked}
                          disabled={saving !== null}
                          onChange={(event) =>
                            void onTogglePermission({
                              roleCode: activeRole,
                              moduleCode: mod.moduleCode,
                              field,
                              value: event.target.checked,
                            })
                          }
                          title={`${ROLE_LABELS[activeRole]} · ${mod.moduleName} · ${PERMISSION_LABELS[field]}`}
                        />
                        {saving === busyKey && (
                          <span className="ml-1 inline-block animate-pulse text-[10px] text-[var(--app-muted)]">
                            <Save size={10} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
