const DEFAULT_AVATAR_SIZE = 512;
const DEFAULT_MIME_TYPE = 'image/jpeg';
const DEFAULT_JPEG_QUALITY = 0.86;

interface OptimizeAvatarOptions {
  targetSize?: number;
  mimeType?: string;
  quality?: number;
}

function sanitizeBaseName(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '').trim();
  const cleaned = base
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return cleaned.length > 0 ? cleaned.slice(0, 60) : 'avatar';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo procesar la imagen seleccionada.'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No fue posible generar la imagen optimizada.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function optimizeAvatarForUpload(
  file: File,
  options: OptimizeAvatarOptions = {},
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen para foto de perfil.');
  }

  const targetSize = Math.max(128, Math.min(1024, options.targetSize ?? DEFAULT_AVATAR_SIZE));
  const mimeType = options.mimeType ?? DEFAULT_MIME_TYPE;
  const quality = Math.max(0.5, Math.min(0.95, options.quality ?? DEFAULT_JPEG_QUALITY));

  const image = await loadImageFromFile(file);
  const sourceSize = Math.min(image.width, image.height);

  if (sourceSize <= 0) {
    throw new Error('La imagen seleccionada no es válida.');
  }

  const offsetX = Math.floor((image.width - sourceSize) / 2);
  const offsetY = Math.floor((image.height - sourceSize) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('El navegador no soporta procesamiento de imágenes en esta sesión.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    offsetX,
    offsetY,
    sourceSize,
    sourceSize,
    0,
    0,
    targetSize,
    targetSize,
  );

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const nextName = `${sanitizeBaseName(file.name)}.${extension}`;

  return new File([blob], nextName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
