'use client';

import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';
import { uploadToR2, type R2UploadResponse } from '@/lib/r2-upload-client';

interface R2UploadButtonProps {
  moduleCode: ModuleCode;
  action: PermissionAction;
  pathPrefix?: string;
  entityTable?: string;
  fieldName?: string;
  accept?: string;
  buttonLabel?: string;
  className?: string;
  disabled?: boolean;
  preprocessFile?: (file: File) => Promise<File>;
  onUploaded: (url: string, payload: R2UploadResponse) => void | Promise<void>;
}

export function R2UploadButton({
  moduleCode,
  action,
  pathPrefix,
  entityTable,
  fieldName,
  accept,
  buttonLabel = 'Subir archivo',
  className,
  disabled,
  preprocessFile,
  onUploaded,
}: R2UploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { alert } = useAppDialog();
  const [isUploading, setIsUploading] = React.useState(false);

  const openFileDialog = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const processedFile = preprocessFile ? await preprocessFile(file) : file;
      const uploaded = await uploadToR2({
        file: processedFile,
        moduleCode,
        action,
        pathPrefix,
        entityTable,
        fieldName,
      });
      await onUploaded(uploaded.url, uploaded);
    } catch (error) {
      await alert({
        title: 'Error de carga',
        message: error instanceof Error ? error.message : 'No fue posible subir el archivo a R2.',
        tone: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        accept={accept}
      />
      <button
        type="button"
        onClick={openFileDialog}
        disabled={disabled || isUploading}
        className={
          className ??
          'inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60'
        }
      >
        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {isUploading ? 'Subiendo...' : buttonLabel}
      </button>
    </>
  );
}
