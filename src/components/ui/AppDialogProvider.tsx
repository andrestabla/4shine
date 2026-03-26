'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';
import { getOnColorText, rgbaFromHex } from '@/lib/color-contrast';

type DialogTone = 'info' | 'success' | 'warning' | 'error';

interface DialogBaseOptions {
  title?: string;
  message: string;
  tone?: DialogTone;
}

interface AlertOptions extends DialogBaseOptions {
  confirmText?: string;
}

interface ConfirmOptions extends DialogBaseOptions {
  confirmText?: string;
  cancelText?: string;
}

interface PromptOptions extends ConfirmOptions {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
}

type DialogRequest =
  | { kind: 'alert'; options: AlertOptions; resolve: () => void }
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (result: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (result: string | null) => void };

interface AppDialogContextValue {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const AppDialogContext = React.createContext<AppDialogContextValue | undefined>(undefined);

const TONE_STYLES: Record<
  DialogTone,
  {
    icon: React.ReactNode;
    toneColor: string;
  }
> = {
  info: {
    icon: <Info size={18} />,
    toneColor: '#2563eb',
  },
  success: {
    icon: <CheckCircle2 size={18} />,
    toneColor: '#059669',
  },
  warning: {
    icon: <TriangleAlert size={18} />,
    toneColor: '#d97706',
  },
  error: {
    icon: <AlertCircle size={18} />,
    toneColor: '#dc2626',
  },
};

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const { tokens } = useBranding();
  const queueRef = React.useRef<DialogRequest[]>([]);
  const [activeDialog, setActiveDialog] = React.useState<DialogRequest | null>(null);
  const [promptValue, setPromptValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const showNextDialog = React.useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setActiveDialog(next);
  }, []);

  const enqueueDialog = React.useCallback((request: DialogRequest) => {
    queueRef.current.push(request);
    setActiveDialog((current) => {
      if (current) return current;
      return queueRef.current.shift() ?? null;
    });
  }, []);

  const alert = React.useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        enqueueDialog({
          kind: 'alert',
          options,
          resolve,
        });
      }),
    [enqueueDialog],
  );

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        enqueueDialog({
          kind: 'confirm',
          options,
          resolve,
        });
      }),
    [enqueueDialog],
  );

  const prompt = React.useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        enqueueDialog({
          kind: 'prompt',
          options,
          resolve,
        });
      }),
    [enqueueDialog],
  );

  React.useEffect(() => {
    if (activeDialog?.kind === 'prompt') {
      setPromptValue(activeDialog.options.defaultValue ?? '');
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return;
    }

    setPromptValue('');
  }, [activeDialog]);

  React.useEffect(() => {
    if (!activeDialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeDialog]);

  const closeWithCancel = React.useCallback(() => {
    if (!activeDialog) return;

    if (activeDialog.kind === 'alert') {
      activeDialog.resolve();
      showNextDialog();
      return;
    }

    if (activeDialog.kind === 'confirm') {
      activeDialog.resolve(false);
      showNextDialog();
      return;
    }

    activeDialog.resolve(null);
    showNextDialog();
  }, [activeDialog, showNextDialog]);

  const closeWithConfirm = React.useCallback(() => {
    if (!activeDialog) return;

    if (activeDialog.kind === 'alert') {
      activeDialog.resolve();
      showNextDialog();
      return;
    }

    if (activeDialog.kind === 'confirm') {
      activeDialog.resolve(true);
      showNextDialog();
      return;
    }

    activeDialog.resolve(promptValue);
    showNextDialog();
  }, [activeDialog, promptValue, showNextDialog]);

  React.useEffect(() => {
    if (!activeDialog) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWithCancel();
      }

      if (event.key === 'Enter' && activeDialog.kind !== 'alert') {
        const target = event.target as HTMLElement | null;
        if (
          activeDialog.kind === 'prompt' &&
          activeDialog.options.multiline &&
          target?.tagName === 'TEXTAREA' &&
          !event.ctrlKey
        ) {
          return;
        }
        event.preventDefault();
        closeWithConfirm();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDialog, closeWithCancel, closeWithConfirm]);

  const contextValue = React.useMemo<AppDialogContextValue>(
    () => ({
      alert,
      confirm,
      prompt,
    }),
    [alert, confirm, prompt],
  );

  const tone = activeDialog?.options.tone ?? 'info';
  const toneStyle = TONE_STYLES[tone];
  const accentText = getOnColorText(tokens.colors.accent);
  const modalRadius = `calc(${tokens.shape.borderRadiusRem}rem + 0.45rem)`;
  const overlayBackground = rgbaFromHex(tokens.colors.primary, 0.72);
  const panelBorder = rgbaFromHex(tokens.colors.primary, 0.2);
  const dividerBorder = rgbaFromHex(tokens.colors.primary, 0.1);
  const cancelButtonBg = rgbaFromHex(tokens.colors.primary, 0.04);
  const cancelButtonText = tokens.colors.primary;
  const iconBackground = rgbaFromHex(toneStyle.toneColor, 0.16);

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}

      {activeDialog && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: overlayBackground }}
        >
          <div
            className="w-full max-w-md overflow-hidden border bg-white shadow-[var(--app-shadow-raised)] animate-fade-in"
            style={{
              borderColor: panelBorder,
              borderRadius: modalRadius,
            }}
          >
            <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: dividerBorder }}>
              <span
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: iconBackground,
                  color: toneStyle.toneColor,
                }}
              >
                {toneStyle.icon}
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold" style={{ color: tokens.colors.primary }}>
                  {activeDialog.options.title ??
                    (activeDialog.kind === 'alert' ? 'Notificación' : activeDialog.kind === 'confirm' ? 'Confirmar' : 'Editar')}
                </h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: rgbaFromHex('#0f172a', 0.78) }}>
                  {activeDialog.options.message}
                </p>
              </div>
            </div>

            {activeDialog.kind === 'prompt' && (
              <div className="px-5 pt-4">
                <label
                  className="block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: rgbaFromHex('#0f172a', 0.62) }}
                >
                  {activeDialog.options.label ?? 'Valor'}
                </label>
                {activeDialog.options.multiline ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className="app-textarea mt-2 min-h-24"
                    style={{
                      borderColor: panelBorder,
                      borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.2rem)`,
                    }}
                    value={promptValue}
                    placeholder={activeDialog.options.placeholder}
                    onChange={(event) => setPromptValue(event.target.value)}
                  />
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    className="app-input mt-2"
                    style={{
                      borderColor: panelBorder,
                      borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.2rem)`,
                    }}
                    value={promptValue}
                    placeholder={activeDialog.options.placeholder}
                    onChange={(event) => setPromptValue(event.target.value)}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 px-5 py-4">
              {activeDialog.kind !== 'alert' && (
                <button
                  type="button"
                  className="app-button-secondary min-h-0 px-3 py-2 text-sm"
                  style={{
                    borderColor: panelBorder,
                    backgroundColor: cancelButtonBg,
                    color: cancelButtonText,
                    borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.15rem)`,
                  }}
                  onClick={closeWithCancel}
                >
                  {activeDialog.options.cancelText ?? 'Cancelar'}
                </button>
              )}
              <button
                type="button"
                className="app-button-primary min-h-0 px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: tokens.colors.accent,
                  color: accentText,
                  borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.15rem)`,
                }}
                onClick={closeWithConfirm}
              >
                {activeDialog.options.confirmText ??
                  (activeDialog.kind === 'alert' ? 'Aceptar' : activeDialog.kind === 'confirm' ? 'Confirmar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = React.useContext(AppDialogContext);
  if (!context) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }
  return context;
}
