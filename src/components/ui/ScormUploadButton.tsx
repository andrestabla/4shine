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

function parseEntryPoint(manifestXml: string): string {
  const patterns = [
    /adlcp:scormtype\s*=\s*"sco"[^>]*\bhref\s*=\s*"([^"]+)"/i,
    /\bhref\s*=\s*"([^"]+)"[^>]*adlcp:scormtype\s*=\s*"sco"/i,
    /\bhref\s*=\s*"([^"#][^"]*\.html?)"/i,
  ];
  for (const re of patterns) {
    const m = manifestXml.match(re);
    if (m?.[1]) return m[1];
  }
  return 'index.html';
}

const MIME_MAP: Record<string, string> = {
  html: 'text/html', htm: 'text/html', js: 'application/javascript',
  mjs: 'application/javascript', css: 'text/css', json: 'application/json',
  xml: 'application/xml', svg: 'image/svg+xml', png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', m4a: 'audio/mp4',
  pdf: 'application/pdf', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf',
  otf: 'font/otf', txt: 'text/plain',
};

function mimeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 120);
    throw new Error(
      res.status === 413
        ? 'El archivo es demasiado grande para esta operación.'
        : `Error del servidor (${res.status}): ${preview}`,
    );
  }
}

export function ScormUploadButton({ onUploaded, disabled, className }: ScormUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { alert } = useAppDialog();
  const [progress, setProgress] = React.useState({ uploading: false, done: 0, total: 0 });

  const handleFile = async (file: File) => {
    setProgress({ uploading: true, done: 0, total: 0 });
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);

      const manifestFile = zip.file('imsmanifest.xml');
      if (!manifestFile) {
        throw new Error('Archivo inválido: no se encontró imsmanifest.xml en el ZIP.');
      }
      const manifestXml = await manifestFile.async('text');
      const entryPoint = parseEntryPoint(manifestXml);

      const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
      const fileCount = entries.length;
      setProgress({ uploading: true, done: 0, total: fileCount });

      // Step 1: get presigned PUT URLs for every file in the ZIP
      const presignRes = await fetch('/api/v1/uploads/r2/scorm/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryPoint,
          files: entries.map(([zipPath]) => ({ zipPath, mimeType: mimeFor(zipPath) })),
        }),
      });

      const presignPayload = await safeJson<{
        ok: boolean;
        error?: string;
        data?: {
          prefix: string;
          entryPoint: string;
          files: Array<{ zipPath: string; uploadUrl: string; contentType: string }>;
        };
      }>(presignRes);

      if (!presignPayload.ok || !presignPayload.data) {
        throw new Error(presignPayload.error ?? 'Error al preparar la carga.');
      }

      const { prefix, files: signedFiles } = presignPayload.data;

      // Step 2: PUT each file directly to R2 (bypasses Vercel body limit)
      const BATCH = 6;
      let done = 0;
      for (let i = 0; i < signedFiles.length; i += BATCH) {
        const batch = signedFiles.slice(i, i + BATCH);
        await Promise.all(
          batch.map(async ({ zipPath, uploadUrl, contentType }) => {
            const zipFile = zip.file(zipPath);
            if (!zipFile) return;
            const body = await zipFile.async('arraybuffer');
            const res = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': contentType },
              body,
            });
            if (!res.ok) throw new Error(`Error subiendo ${zipPath} (${res.status})`);
          }),
        );
        done += batch.length;
        setProgress({ uploading: true, done, total: fileCount });
      }

      // Step 3: finalize — server builds the public entry URL
      const finalizeRes = await fetch('/api/v1/uploads/r2/scorm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, entryPoint, fileCount }),
      });

      const finalizePayload = await safeJson<{
        ok: boolean;
        error?: string;
        data?: ScormUploadResult;
      }>(finalizeRes);

      if (!finalizePayload.ok || !finalizePayload.data) {
        throw new Error(finalizePayload.error ?? 'Error al finalizar la carga.');
      }

      setProgress({ uploading: false, done: fileCount, total: fileCount });
      onUploaded(finalizePayload.data);
    } catch (err) {
      setProgress({ uploading: false, done: 0, total: 0 });
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

  const isUploading = progress.uploading;

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
          ? progress.total > 0
            ? `Subiendo ${progress.done}/${progress.total}…`
            : 'Preparando…'
          : 'Subir curso a R2'}
      </button>
    </>
  );
}
