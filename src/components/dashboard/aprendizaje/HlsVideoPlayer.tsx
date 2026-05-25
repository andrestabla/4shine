"use client";

import * as React from "react";
import { isHlsUrl } from "@/features/aprendizaje/media";

interface HlsVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  /** Optional className for the wrapping container (the player frame). */
  wrapperClassName?: string;
}

/**
 * Inline video player with transparent HLS (.m3u8) support.
 *
 * Safari (and iOS) play HLS natively, so we just set the URL on <video src>.
 * For Chromium/Firefox we dynamically load hls.js and attach it to the element
 * — keeping the .m3u8 stream playing inline instead of opening a new page.
 *
 * Non-HLS direct video URLs (.mp4, .webm, etc.) fall through to the native
 * <video> element with no extra work.
 */
export default function HlsVideoPlayer({
  src,
  title,
  className = "h-full w-full object-contain",
  autoPlay = true,
  controls = true,
  wrapperClassName = "w-full overflow-hidden rounded-[16px] bg-black ring-1 ring-white/10 md:aspect-video relative group",
}: HlsVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (!isHlsUrl(src)) {
      // Not an HLS stream — let the browser handle it natively.
      video.src = src;
      return;
    }

    // Safari (desktop + iOS) plays HLS natively.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    // Other browsers: lazy-load hls.js and attach.
    let hls: import("hls.js").default | null = null;
    let cancelled = false;

    (async () => {
      try {
        const mod = await import("hls.js");
        if (cancelled) return;
        const Hls = mod.default;
        if (!Hls.isSupported()) {
          // No MSE support: best we can do is set the src and hope a plugin handles it.
          video.src = src;
          return;
        }
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      } catch (err) {
        console.error("[HlsVideoPlayer] Failed to load hls.js", err);
        // Fallback: try native — worst case the browser shows its own error.
        video.src = src;
      }
    })();

    return () => {
      cancelled = true;
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <div className={wrapperClassName}>
      <video
        ref={videoRef}
        title={title}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        playsInline
      />
    </div>
  );
}
