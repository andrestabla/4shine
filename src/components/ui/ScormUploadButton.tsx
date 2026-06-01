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

// Busca el archivo HTML de arranque en un ZIP que no es SCORM (paquetes
// HTML/web sin imsmanifest.xml). Prefiere el index.html más cercano a la
// raíz; si no hay index, devuelve el primer .html al nivel más superficial.
function findHtmlEntry(filePaths: string[]): string | null {
  const htmlFiles = filePaths.filter((p) => /\.html?$/i.test(p));
  if (htmlFiles.length === 0) return null;
  const byDepth = (path: string) => path.split('/').length;
  const sorted = [...htmlFiles].sort((a, b) => {
    const depthDiff = byDepth(a) - byDepth(b);
    if (depthDiff !== 0) return depthDiff;
    const aIsIndex = /(?:^|\/)index\.html?$/i.test(a) ? 0 : 1;
    const bIsIndex = /(?:^|\/)index\.html?$/i.test(b) ? 0 : 1;
    return aIsIndex - bIsIndex;
  });
  return sorted[0] ?? null;
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

      const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
      const fileCount = entries.length;

      // Detección de entry point:
      // 1) Si hay imsmanifest.xml -> paquete SCORM, parsear como antes.
      // 2) Si no, buscar el index.html (o cualquier .html) más cercano a
      //    la raíz -> paquete HTML/web exportado.
      let entryPoint: string;
      const manifestFile = zip.file('imsmanifest.xml');
      if (manifestFile) {
        const manifestXml = await manifestFile.async('text');
        entryPoint = parseEntryPoint(manifestXml);
      } else {
        const htmlEntry = findHtmlEntry(entries.map(([path]) => path));
        if (!htmlEntry) {
          throw new Error(
            'Archivo inválido: el ZIP no contiene imsmanifest.xml ni un index.html. Sube un paquete SCORM o un export HTML con un index.',
          );
        }
        entryPoint = htmlEntry;
      }
      setProgress({ uploading: true, done: 0, total: fileCount });

      // Step 1: allocate an upload session (prefix) on the server.
      // relay:true tells the server to skip presigned URL generation.
      const presignRes = await fetch('/api/v1/uploads/r2/scorm/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryPoint, relay: true }),
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

      const { prefix } = presignPayload.data;

      // Step 2: Relay files through the server API (avoids R2 S3-endpoint CORS restrictions).
      // One file per request (avoids Vercel 4.5 MB body limit), 4 concurrent uploads.
      const CONCURRENCY = 4;
      let done = 0;

      const VERCEL_BODY_LIMIT = 4.5 * 1024 * 1024; // 4.5 MB

      const uploadOne = async (zipPath: string, fileIndex: number): Promise<void> => {
        const zipFile = zip.file(zipPath);
        if (!zipFile) return;
        const body = await zipFile.async('arraybuffer');
        const sizeMb = (body.byteLength / (1024 * 1024)).toFixed(2);

        // Guard explícito antes de enviar: Vercel rechaza payloads > 4.5MB
        // y devuelve un 413 sin JSON, que el catch general no puede mapear
        // a un error útil para el usuario.
        if (body.byteLength > VERCEL_BODY_LIMIT) {
          throw new Error(
            `El archivo "${zipPath}" pesa ${sizeMb} MB y excede el límite de 4.5 MB por archivo del servidor. Reduce el tamaño del activo o divide el paquete.`,
          );
        }

        const fd = new FormData();
        fd.append('prefix', prefix);
        fd.append('count', '1');
        fd.append('file_0', new Blob([body], { type: mimeFor(zipPath) }), zipPath.split('/').pop() ?? zipPath);
        fd.append('path_0', zipPath);
        const res = await fetch('/api/v1/uploads/r2/scorm/relay', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!res.ok) {
          const payload = await safeJson<{ error?: string }>(res).catch(() => ({}));
          const serverError = (payload as { error?: string }).error;
          throw new Error(
            serverError
              ? `Archivo "${zipPath}" (${sizeMb} MB): ${serverError}`
              : `Error subiendo "${zipPath}" (${sizeMb} MB, archivo ${fileIndex + 1}/${fileCount}, status ${res.status})`,
          );
        }
      };

      // Process in windows of CONCURRENCY, updating progress after each window
      for (let i = 0; i < entries.length; i += CONCURRENCY) {
        const window = entries.slice(i, i + CONCURRENCY);
        await Promise.all(window.map(([zipPath], j) => uploadOne(zipPath, i + j)));
        done += window.length;
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
        title: 'Error al subir curso',
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
