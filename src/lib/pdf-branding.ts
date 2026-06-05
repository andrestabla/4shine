// Helpers compartidos para inyectar el branding de 4Shine (colores + logo)
// en los PDFs generados desde el cliente con jsPDF.

export interface PdfBrandingInput {
    logoDarkUrl?: string | null;
    primaryHex?: string | null;
    secondaryHex?: string | null;
    accentHex?: string | null;
}

export interface PdfBrandingResolved {
    primary: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    onPrimary: [number, number, number];
    logo: {
        dataUrl: string;
        format: 'PNG' | 'JPEG';
        naturalWidth: number;
        naturalHeight: number;
    } | null;
}

const DEFAULT_PRIMARY: [number, number, number] = [13, 27, 42];
const DEFAULT_SECONDARY: [number, number, number] = [26, 31, 43];
const DEFAULT_ACCENT: [number, number, number] = [212, 175, 55];

export function hexToRgb(value: string | null | undefined, fallback: [number, number, number]): [number, number, number] {
    if (!value) return fallback;
    const trimmed = value.trim().replace(/^#/, '');
    const expanded =
        trimmed.length === 3
            ? trimmed
                  .split('')
                  .map((char) => char + char)
                  .join('')
            : trimmed;
    if (expanded.length !== 6) return fallback;
    const num = Number.parseInt(expanded, 16);
    if (Number.isNaN(num)) return fallback;
    return [
        (num >> 16) & 0xff,
        (num >> 8) & 0xff,
        num & 0xff,
    ];
}

function luminance([r, g, b]: [number, number, number]): number {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export async function loadPdfLogoDataUrl(url: string | null | undefined): Promise<PdfBrandingResolved['logo']> {
    if (!url || typeof window === 'undefined') return null;
    try {
        const response = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' });
        if (!response.ok) return null;
        const blob = await response.blob();
        const mime = blob.type.toLowerCase();
        if (mime.includes('svg')) return null;
        const format: 'PNG' | 'JPEG' = mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG';
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('FileReader failed'));
            reader.readAsDataURL(blob);
        });
        const dimensions = await new Promise<{ w: number; h: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => reject(new Error('Image decode failed'));
            img.src = dataUrl;
        });
        return { dataUrl, format, naturalWidth: dimensions.w, naturalHeight: dimensions.h };
    } catch {
        return null;
    }
}

export async function resolvePdfBranding(input: PdfBrandingInput): Promise<PdfBrandingResolved> {
    const primary = hexToRgb(input.primaryHex, DEFAULT_PRIMARY);
    const secondary = hexToRgb(input.secondaryHex, DEFAULT_SECONDARY);
    const accent = hexToRgb(input.accentHex, DEFAULT_ACCENT);
    const onPrimary: [number, number, number] = luminance(primary) > 140 ? [15, 23, 42] : [255, 255, 255];
    const logo = await loadPdfLogoDataUrl(input.logoDarkUrl);
    return { primary, secondary, accent, onPrimary, logo };
}
