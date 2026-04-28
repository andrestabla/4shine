'use client';

import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';

interface ScormUploadResult {
  entryUrl: string;
  entryPoint: string;
  fileCount: number;
}

interface ScormUploadButtonProps {
  onUploaded: (result: ScormUploadResult) => void;
  disabled?: boolean;
  className?: string;
}

export function ScormUploadButton({ onUploaded, disabled, className }: ScormUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { alert } = useAppDialog();
  const [state, setState] = React.useState<{ uploading: boolean; done: number; total: number }>({
    uploading: false,
    done: 0,
    total: 0,
  });

  const handleFile = async (file: File) => {
    setState({ uploading: true, done: 0, total: 0 });
    try {
      // Estimate file count by peeking at the ZIP locally
      const JSZip = (await import('jszip')).default;
      const localZip = await JSZip.loadAsync(file);
      const fileCount = Object.values(localZip.files).filter((f) => !f.dir).length;
      setState({ uploading: true, done: 0, total: fileCount });

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/uploads/r2/scorm', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const payload = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: ScormUploadResult;
      };

      if (!res.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error ?? `Error ${res.status}`);
      }

      setState({ uploading: false, done: payload.data.fileCount, total: payload.data.fileCount });
      onUploaded(payload.data);
    } catch (err) {
      setState({ uploading: false, done: 0, total: 0 });
      await alert({
        title: 'Error al subir curso SCORM',
        message: err instanceof Error ? err.message : 'No fue posible subir el paquete.',
        tone: 'error',
      });
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await handleFile(file);
  };

  const isUploading = state.uploading;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={onFileChange}
      />
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className={
          className ??
          'app-button-secondary inline-flex items-center justify-center gap-2 text-xs disabled:opacity-60'
        }
      >
        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {isUploading
          ? state.total > 0
            ? `Subiendo ${state.total} archivos…`
            : 'Procesando…'
          : 'Subir curso a R2'}
      </button>
    </>
  );
}
