export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function clampColorChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function hexToRgb(hex: string): RgbColor | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;

  return { r, g, b };
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(15, 23, 42, ${Math.min(1, Math.max(0, alpha))})`;
  const safeAlpha = Math.min(1, Math.max(0, alpha));

  return `rgba(${clampColorChannel(rgb.r)}, ${clampColorChannel(
    rgb.g,
  )}, ${clampColorChannel(rgb.b)}, ${safeAlpha})`;
}

export function getOnColorText(hex: string): '#ffffff' | '#0f172a' {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#ffffff';
}
