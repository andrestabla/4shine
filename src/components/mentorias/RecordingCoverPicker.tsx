'use client';

import React from 'react';
import { Camera, Loader2 } from 'lucide-react';

/**
 * Elige la portada de una grabación tomando un fotograma del propio video.
 *
 * Se reproduce el video en un reproductor aparte, se avanza hasta la escena
 * deseada y se captura ese fotograma a un canvas; la imagen resultante se sube
 * a nuestro almacenamiento y queda como portada. Así la miniatura sale del
 * contenido real de la sesión y no de una imagen genérica.
 *
 * La captura exige que el servidor del video permita CORS. Cuando no lo
 * permite, el navegador "contamina" el canvas y no deja leerlo: en ese caso se
 * dice con claridad en vez de fallar en silencio.
 */
export function RecordingCoverPicker({
  recordingUrl,
  currentCoverUrl,
  onCaptured,
}: {
  recordingUrl: string;
  currentCoverUrl?: string | null;
  onCaptured: (url: string) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(currentCoverUrl ?? null);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.videoWidth || !video.videoHeight) {
      setMessage('Espera a que cargue el video y ubica la escena que quieres.');
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      // Se limita el ancho para que la portada pese poco sin perder nitidez.
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo preparar la captura.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.85);
        } catch {
          resolve(null);
        }
      });
      if (!blob) {
        throw new Error(
          'El servidor del video no permite capturar fotogramas. Sube una imagen de portada manualmente.',
        );
      }

      const stamp = Math.round(video.currentTime);
      const formData = new FormData();
      formData.append('file', new File([blob], `portada-${stamp}s.jpg`, { type: 'image/jpeg' }));
      formData.append('moduleCode', 'mentorias');
      formData.append('action', 'update');
      formData.append('pathPrefix', 'mentorias/grabaciones');

      const response = await fetch('/api/v1/uploads/r2', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = await response.json();
      const url: string | undefined = json?.data?.url;
      if (!response.ok || !url) {
        throw new Error(json?.detail || json?.error || 'No se pudo subir la portada.');
      }

      setPreview(url);
      onCaptured(url);
      const minutes = Math.floor(stamp / 60);
      const seconds = String(stamp % 60).padStart(2, '0');
      setMessage(`Portada tomada del minuto ${minutes}:${seconds}. Guarda los cambios para aplicarla.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo capturar el fotograma.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-[12px] border border-[var(--app-border)] bg-white p-2.5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
        Portada del video
      </p>
      <p className="text-[11.5px] leading-relaxed text-[var(--app-muted)]">
        Reproduce o arrastra hasta la escena que quieras y tómala como portada.
      </p>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={recordingUrl}
        crossOrigin="anonymous"
        preload="metadata"
        controls
        controlsList="nodownload"
        className="aspect-video w-full rounded-[10px] bg-black"
      />

      <button
        type="button"
        onClick={() => void capture()}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[var(--brand-primary)] bg-white px-3 py-2 text-xs font-bold text-[var(--brand-primary)] disabled:opacity-50"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
        {busy ? 'Capturando…' : 'Usar este fotograma como portada'}
      </button>

      {preview && (
        <div className="space-y-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
            Portada actual
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Portada de la grabación" className="w-full rounded-[10px]" />
        </div>
      )}

      {message && <p className="text-[11.5px] text-[var(--app-ink)]">{message}</p>}
    </div>
  );
}
