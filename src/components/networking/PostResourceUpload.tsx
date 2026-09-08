'use client';

import React from 'react';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import {
  POST_RESOURCE_ACCEPT,
  POST_RESOURCE_FIELD,
  POST_RESOURCE_PATH_PREFIX,
  canUploadPostResource,
} from '@/features/networking/uploads';

/**
 * Botón "Cargar" del recurso de una publicación. No se dibuja para quien no
 * puede subir (líderes), que conservan el campo de URL.
 */
export function PostResourceUpload({
  role,
  onUploaded,
  disabled,
}: {
  role: string | null | undefined;
  onUploaded: (url: string) => void;
  disabled?: boolean;
}) {
  if (!canUploadPostResource(role)) return null;

  return (
    <R2UploadButton
      moduleCode="networking"
      action="create"
      pathPrefix={POST_RESOURCE_PATH_PREFIX}
      entityTable="app_networking.community_posts"
      fieldName={POST_RESOURCE_FIELD}
      accept={POST_RESOURCE_ACCEPT}
      buttonLabel="Cargar"
      disabled={disabled}
      onUploaded={(url) => onUploaded(url)}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--app-border)] px-3 py-1.5 text-xs font-bold text-[var(--app-muted)] transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)] disabled:opacity-60"
    />
  );
}
