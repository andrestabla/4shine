export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '').trim();
      return videoId || null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const directId = parsed.searchParams.get('v');
      if (directId) return directId;

      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return embedMatch[1];

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return shortsMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function buildLearningThumbnailUrl(url: string | null | undefined): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  if (!url) {
    return null;
  }

  if (/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url)) {
    return url;
  }

  return null;
}

export function isDirectAudioUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp3|m4a|wav|ogg)(\?.*)?$/i.test(url);
}
