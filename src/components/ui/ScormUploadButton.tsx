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

function normalizeEntryPath(raw: string): string {
  // Limpia paths que el manifest o nuestro detector de HTML pueden
  // devolver con leading `./` o `/`, espacios al borde, etc. — el
  // server construye entryUrl como `${prefix}/${entryPoint}` y un
  // leading slash dejaría doble separador.
  return raw
    .trim()
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');
}

function parseEntryPoint(manifestXml: string): string {
  const patterns = [
    /adlcp:scormtype\s*=\s*"sco"[^>]*\bhref\s*=\s*"([^"]+)"/i,
    /\bhref\s*=\s*"([^"]+)"[^>]*adlcp:scormtype\s*=\s*"sco"/i,
    /\bhref\s*=\s*"([^"#][^"]*\.html?)"/i,
  ];
  for (const re of patterns) {
    const m = manifestXml.match(re);
    if (m?.[1]) return normalizeEntryPath(m[1]);
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
  const picked = sorted[0];
  return picked ? normalizeEntryPath(picked) : null;
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
      const allPaths = entries.map(([path]) => path);
      const pathSet = new Set(allPaths);

      // Detección de entry point:
      // 1) Si hay imsmanifest.xml -> paquete SCORM, parsear y VERIFICAR
      //    que el path realmente existe en el ZIP. Algunos exporters
      //    referencian el SCO sin .html y dejan al runtime resolverlo;
      //    al pasarlo crudo a R2 da 404. Si no existe, caemos al
      //    fallback HTML.
      // 2) Si no hay manifest o el path del manifest es inválido,
      //    buscar el index.html (o cualquier .html) más cercano a la
      //    raíz -> paquete HTML/web exportado.
      let entryPoint: string;
      const manifestFile = zip.file('imsmanifest.xml');
      let manifestEntry: string | null = null;
      if (manifestFile) {
        const manifestXml = await manifestFile.async('text');
        manifestEntry = parseEntryPoint(manifestXml);
      }

      if (manifestEntry && pathSet.has(manifestEntry)) {
        entryPoint = manifestEntry;
      } else {
        const htmlEntry = findHtmlEntry(allPaths);
        if (!htmlEntry) {
          throw new Error(
            manifestEntry
              ? `El imsmanifest.xml apunta a "${manifestEntry}" pero ese archivo no existe en el ZIP, y no hay un index.html alternativo. Verifica el manifest del paquete o usa un export HTML válido.`
              : 'Archivo inválido: el ZIP no contiene imsmanifest.xml ni un index.html. Sube un paquete SCORM o un export HTML con un index.',
          );
        }
        entryPoint = htmlEntry;
      }
      setProgress({ uploading: true, done: 0, total: fileCount });

      // Step 1: pedir URLs presignadas directas a R2 (bypass Vercel 4.5 MB
      // body limit). El presign auto-configura CORS del bucket para que el
      // browser pueda PUT directamente.
      const filesList = entries.map(([path]) => ({ zipPath: path }));
      const presignRes = await fetch('/api/v1/uploads/r2/scorm/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryPoint, files: filesList }),
      });

      const presignPayload = await safeJson<{
        ok: boolean;
        error?: string;
        data?: {
          prefix: string;
          entryPoint: string;
          files: Array<{ zipPath: string; uploadUrl: string; contentType: string }>;
          corsConfigured?: boolean;
          corsError?: string | null;
        };
      }>(presignRes);

      if (!presignPayload.ok || !presignPayload.data) {
        throw new Error(presignPayload.error ?? 'Error al preparar la carga.');
      }

      const { prefix, files: presignedFiles, corsConfigured, corsError } = presignPayload.data;

      // Si el server no pudo autoconfigurar CORS, probablemente el token R2
      // no tiene s3:PutBucketCors. Asumimos que el admin configuró CORS
      // manualmente y procedemos. Si CORS realmente está mal, los PUTs
      // individuales fallarán y verás un error por archivo con el detalle.
      if (corsConfigured === false) {
        console.warn(
          `[scorm-upload] CORS no se pudo verificar automáticamente (${corsError ?? 'unknown'}). Procediendo asumiendo CORS configurado manualmente en R2.`,
        );
      }
      const urlByPath = new Map(
        presignedFiles.map((f) => [f.zipPath, { url: f.uploadUrl, contentType: f.contentType }]),
      );

      // Step 2: PUT directo de cada archivo a R2 vía la URL presignada.
      // Soporta archivos hasta el límite de R2 (5 GB) sin pasar por Vercel.
      const CONCURRENCY = 4;
      let done = 0;

      const uploadOne = async (zipPath: string, fileIndex: number): Promise<void> => {
        const zipFile = zip.file(zipPath);
        if (!zipFile) return;
        const presigned = urlByPath.get(zipPath);
        if (!presigned) {
          throw new Error(`Sin URL presignada para "${zipPath}".`);
        }
        const body = await zipFile.async('arraybuffer');
        const sizeMb = (body.byteLength / (1024 * 1024)).toFixed(2);

        const res = await fetch(presigned.url, {
          method: 'PUT',
          headers: { 'Content-Type': presigned.contentType },
          body,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          const detail = text.slice(0, 200).replace(/\s+/g, ' ').trim();
          throw new Error(
            `Error subiendo "${zipPath}" (${sizeMb} MB, ${fileIndex + 1}/${fileCount}, status ${res.status})${
              detail ? ` — ${detail}` : ''
            }`,
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
