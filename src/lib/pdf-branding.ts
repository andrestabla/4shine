// Helpers compartidos para inyectar el branding de 4Shine (colores + logo)
// en los PDFs generados desde el cliente con jsPDF.

export interface PdfBrandingInput {
    logoDarkUrl?: string | null;
    primaryHex?: string | null;
    secondaryHex?: string | null;
    accentHex?: string | null;
    fontFamily?: string | null;
}

export interface PdfBrandedFont {
    family: string;
    registered: boolean;
}

export interface PdfBrandingResolved {
    primary: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    onPrimary: [number, number, number];
    /** Texto principal de cuerpo (negro neutro con tinte sutil de primary). */
    body: [number, number, number];
    /** Texto secundario (gris medio). */
    muted: [number, number, number];
    /** Texto terciario muy claro. */
    subtle: [number, number, number];
    /** Fondo de card claro (tinte del primary). */
    surface: [number, number, number];
    /** Fondo de card aún más claro (highlight). */
    surfaceMuted: [number, number, number];
    /** Tono del accent muy claro para fondos de badges. */
    accentSoft: [number, number, number];
    logo: {
        dataUrl: string;
        format: 'PNG' | 'JPEG';
        naturalWidth: number;
        naturalHeight: number;
    } | null;
    font: PdfBrandedFont;
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

function mixWithWhite(rgb: [number, number, number], whiteRatio: number): [number, number, number] {
    const w = Math.max(0, Math.min(1, whiteRatio));
    return [
        Math.round(rgb[0] * (1 - w) + 255 * w),
        Math.round(rgb[1] * (1 - w) + 255 * w),
        Math.round(rgb[2] * (1 - w) + 255 * w),
    ];
}

// Fetches and registers the brand font (Manrope, Inter, etc.) into jsPDF.
// Resolves the family name to use in setFont. Cached in-memory por sesión.
const fontCache = new Map<string, Promise<{ ttfBase64Regular: string | null; ttfBase64Bold: string | null }>>();

async function fetchFontFiles(family: string): Promise<{ ttfBase64Regular: string | null; ttfBase64Bold: string | null }> {
    const cached = fontCache.get(family);
    if (cached) return cached;
    const promise = (async () => {
        try {
            const [reg, bold] = await Promise.all([
                fetch(`/api/v1/public/branding/pdf-font?family=${encodeURIComponent(family)}&weight=400`, {
                    cache: 'force-cache',
                }).then((r) => (r.ok ? r.arrayBuffer() : null)),
                fetch(`/api/v1/public/branding/pdf-font?family=${encodeURIComponent(family)}&weight=700`, {
                    cache: 'force-cache',
                }).then((r) => (r.ok ? r.arrayBuffer() : null)),
            ]);
            const toBase64 = (buffer: ArrayBuffer | null) => {
                if (!buffer) return null;
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const chunk = 0x8000;
                for (let i = 0; i < bytes.length; i += chunk) {
                    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                }
                return btoa(binary);
            };
            return {
                ttfBase64Regular: toBase64(reg),
                ttfBase64Bold: toBase64(bold),
            };
        } catch {
            return { ttfBase64Regular: null, ttfBase64Bold: null };
        }
    })();
    fontCache.set(family, promise);
    return promise;
}

/**
 * Registra la fuente de branding en una instancia de jsPDF para que pueda
 * usarse con setFont(family, 'normal'|'bold'). Devuelve el nombre real a
 * usar (la familia configurada si se cargó OK, o 'helvetica' como fallback).
 */
export async function registerBrandFontInPdf(
    pdf: {
        addFileToVFS: (filename: string, content: string) => void;
        addFont: (postScriptName: string, id: string, style: 'normal' | 'bold') => void;
    },
    family: string | null | undefined,
): Promise<PdfBrandedFont> {
    if (!family || typeof window === 'undefined') {
        return { family: 'helvetica', registered: false };
    }
    try {
        const { ttfBase64Regular, ttfBase64Bold } = await fetchFontFiles(family);
        if (!ttfBase64Regular) {
            return { family: 'helvetica', registered: false };
        }
        const regFile = `${family}-Regular.ttf`;
        pdf.addFileToVFS(regFile, ttfBase64Regular);
        pdf.addFont(regFile, family, 'normal');
        if (ttfBase64Bold) {
            const boldFile = `${family}-Bold.ttf`;
            pdf.addFileToVFS(boldFile, ttfBase64Bold);
            pdf.addFont(boldFile, family, 'bold');
        }
        return { family, registered: true };
    } catch {
        return { family: 'helvetica', registered: false };
    }
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
    // Cuerpos / mutes neutros (slate); no dependen del branding para garantizar
    // legibilidad consistente del texto largo del informe.
    const body: [number, number, number] = [30, 41, 59];
    const muted: [number, number, number] = [100, 116, 139];
    const subtle: [number, number, number] = [148, 163, 184];
    // Surfaces como mezcla muy suave del primary con blanco (~96% / ~92%).
    const surface = mixWithWhite(primary, 0.96);
    const surfaceMuted = mixWithWhite(primary, 0.92);
    const accentSoft = mixWithWhite(accent, 0.85);
    const logo = await loadPdfLogoDataUrl(input.logoDarkUrl);
    return {
        primary,
        secondary,
        accent,
        onPrimary,
        body,
        muted,
        subtle,
        surface,
        surfaceMuted,
        accentSoft,
        logo,
        font: { family: 'helvetica', registered: false },
    };
}
