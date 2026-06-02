'use client';

import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';

interface ScormUploadResult {
  entryUrl: string;
  entryPoint: string;
  fileCount: number;
  packageKind: 'scorm' | 'html';
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

// Extrae TODOS los hrefs del manifest que apunten a HTML/SCO. Devuelve
// una lista ordenada por confianza: primero los que están en un
// <resource scormtype="sco">, luego cualquier .html referenciado en
// <file href="...">.
function extractManifestEntries(manifestXml: string): string[] {
  const candidates: string[] = [];

  // Resource elements con adlcp:scormtype="sco" — el SCO principal.
  const resourceRe =
    /<resource\b[^>]*adlcp:scormtype\s*=\s*"sco"[^>]*>/gi;
  let resourceMatch: RegExpExecArray | null;
  while ((resourceMatch = resourceRe.exec(manifestXml)) !== null) {
    const tag = resourceMatch[0];
    const hrefMatch = tag.match(/\bhref\s*=\s*"([^"]+)"/i);
    if (hrefMatch?.[1]) candidates.push(normalizeEntryPath(hrefMatch[1]));
  }

  // Cualquier href .html dentro del manifest (file refs).
  const htmlHrefRe = /\bhref\s*=\s*"([^"#]+\.html?)"/gi;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = htmlHrefRe.exec(manifestXml)) !== null) {
    if (htmlMatch[1]) candidates.push(normalizeEntryPath(htmlMatch[1]));
  }

  // Dedupe preservando orden de confianza.
  return Array.from(new Set(candidates));
}

// Busca el archivo HTML de arranque en un ZIP (paquetes HTML/web o
// fallback cuando el manifest SCORM no apunta a un archivo válido).
// Prefiere el index.html más cercano a la raíz; si no hay index,
// devuelve el primer .html al nivel más superficial.
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

type PackageDetection =
  | { kind: 'scorm'; entryPoint: string }
  | { kind: 'html'; entryPoint: string }
  | {
      kind: 'invalid';
      reason: string;
    };

// Clasifica el paquete y resuelve el entryPoint contra los archivos
// reales del ZIP. Reglas:
// - SCORM: hay imsmanifest.xml Y al menos un candidato del manifest
//   existe en el ZIP. Si el manifest apunta a algo que no existe,
//   intentamos cada candidato; si ninguno coincide, degradamos a HTML.
// - HTML: no hay manifest, o el manifest está roto. Si hay un .html
//   navegable -> kind 'html'.
// - Invalid: ni manifest válido ni .html alguno.
function detectPackage(
  manifestXml: string | null,
  allPaths: string[],
): PackageDetection {
  const pathSet = new Set(allPaths);

  if (manifestXml) {
    const candidates = extractManifestEntries(manifestXml);
    for (const candidate of candidates) {
      if (pathSet.has(candidate)) {
        return { kind: 'scorm', entryPoint: candidate };
      }
    }
    // Manifest existe pero ningún candidato matchea con un archivo.
    // Degradamos a HTML fallback con un warning implícito.
    const htmlFallback = findHtmlEntry(allPaths);
    if (htmlFallback) {
      return { kind: 'html', entryPoint: htmlFallback };
    }
    return {
      kind: 'invalid',
      reason: candidates.length
        ? `El imsmanifest.xml referencia ${candidates
            .slice(0, 3)
            .map((c) => `"${c}"`)
            .join(', ')} pero ninguno de esos archivos existe en el ZIP y tampoco hay un index.html alternativo.`
        : 'El imsmanifest.xml no tiene un SCO ni hrefs HTML detectables, y el ZIP no contiene un index.html alternativo.',
    };
  }

  // Sin manifest -> intentar como paquete HTML/web.
  const htmlEntry = findHtmlEntry(allPaths);
  if (htmlEntry) {
    return { kind: 'html', entryPoint: htmlEntry };
  }
  return {
    kind: 'invalid',
    reason:
      'El ZIP no contiene imsmanifest.xml ni un index.html. Sube un paquete SCORM o un export HTML con un index.',
  };
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

      // Clasificación automática del paquete: SCORM (manifest válido +
      // entry existe), HTML (sin manifest pero con un .html navegable),
      // o inválido. La detección se hace contra los archivos reales del
      // ZIP, así no se guarda un entryPoint que apunte a un archivo
      // inexistente.
      const manifestFile = zip.file('imsmanifest.xml');
      const manifestXml = manifestFile ? await manifestFile.async('text') : null;
      const detection = detectPackage(manifestXml, allPaths);

      if (detection.kind === 'invalid') {
        throw new Error(`Archivo inválido: ${detection.reason}`);
      }

      const entryPoint = detection.entryPoint;
      const packageKind = detection.kind; // 'scorm' | 'html'
      console.info(
        `[scorm-upload] Paquete clasificado como ${packageKind.toUpperCase()}. Entry: "${entryPoint}"`,
      );
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

      // PUTs directos a R2 pueden recibir errores transient (502
      // InternalError, network blips). Retry con backoff exponencial
      // antes de fallar definitivamente.
      const MAX_RETRIES = 4;
      const isRetryableStatus = (status: number) =>
        status === 0 || status === 408 || status === 429 || status >= 500;
      const sleep = (ms: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, ms));

      const uploadOne = async (zipPath: string, fileIndex: number): Promise<void> => {
        const zipFile = zip.file(zipPath);
        if (!zipFile) return;
        const presigned = urlByPath.get(zipPath);
        if (!presigned) {
          throw new Error(`Sin URL presignada para "${zipPath}".`);
        }
        const body = await zipFile.async('arraybuffer');
        const sizeMb = (body.byteLength / (1024 * 1024)).toFixed(2);

        let lastStatus = 0;
        let lastDetail = '';
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            // 500ms, 1s, 2s, 4s
            await sleep(500 * 2 ** (attempt - 1));
          }
          try {
            const res = await fetch(presigned.url, {
              method: 'PUT',
              headers: { 'Content-Type': presigned.contentType },
              body,
            });
            if (res.ok) return;
            lastStatus = res.status;
            const text = await res.text().catch(() => '');
            lastDetail = text.slice(0, 200).replace(/\s+/g, ' ').trim();
            if (!isRetryableStatus(res.status)) break;
          } catch (err) {
            // Network/CORS abort — tratable como retryable.
            lastStatus = 0;
            lastDetail = err instanceof Error ? err.message : String(err);
          }
        }

        throw new Error(
          `Error subiendo "${zipPath}" (${sizeMb} MB, ${fileIndex + 1}/${fileCount}, status ${lastStatus} tras ${MAX_RETRIES} intentos)${
            lastDetail ? ` — ${lastDetail}` : ''
          }`,
        );
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
      onUploaded({ ...finalizePayload.data, packageKind });
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
