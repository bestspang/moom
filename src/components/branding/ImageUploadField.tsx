import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  validateImageUpload,
  formatAcceptAttr,
  UPLOAD_CONSTRAINTS,
  type UploadKind,
} from '@/lib/uploadValidation';

interface ImageUploadFieldProps {
  kind: UploadKind;
  value?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
  disabledHint?: string;
}

const BUCKET = 'brand-assets';

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  kind,
  value,
  onChange,
  disabled,
  disabledHint,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const c = UPLOAD_CONSTRAINTS[kind];
  const maxMb = Math.round(c.maxBytes / (1024 * 1024));
  const formats = c.acceptMime.map((m) => m.split('/')[1].toUpperCase()).join(', ');
  const minDim = `${c.minWidth}×${c.minHeight}`;

  const formatMsg = (key: string, extras?: Record<string, string | number>): string => {
    let msg = t(key);
    if (extras) {
      for (const [k, v] of Object.entries(extras)) {
        msg = msg.replace(`{{${k}}}`, String(v));
      }
    }
    return msg;
  };

  const handleFile = async (file: File) => {
    setError(null);
    const result = await validateImageUpload(file, kind);
    if (!result.ok) {
      const msg = formatMsg(result.i18nKey, result.extras);
      setError(msg);
      toast.error(msg);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success(t('settings.branding.uploadSuccess'));
    } catch (err) {
      console.error('[ImageUploadField] upload failed', err);
      const msg = t('settings.branding.uploadFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-lg border border-dashed p-4 transition-all',
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
          disabled && 'opacity-60'
        )}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-card border flex-shrink-0">
              <img src={value} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                {t('settings.branding.uploadCurrent')}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                {value.split('/').pop()}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
              disabled={disabled || uploading}
              aria-label={t('settings.branding.uploadRemove')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full flex flex-col items-center gap-2 py-2 text-center disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-full bg-card border flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="text-[12px] font-bold text-foreground">
              {uploading
                ? t('settings.branding.uploadProgress')
                : kind === 'logo'
                ? t('settings.branding.uploadLogo')
                : t('settings.branding.uploadPhoto')}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold">
              {t('settings.branding.dragDropHint')}
            </div>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] text-muted-foreground font-semibold">
          {formatMsg('settings.branding.uploadHint', { formats, max: `${maxMb}MB`, min: minDim })}
        </span>
        {!value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {t('settings.branding.uploadBrowse')}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-destructive text-[11px] font-semibold px-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {disabled && disabledHint && (
        <div className="text-[10px] text-muted-foreground font-semibold px-1">{disabledHint}</div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={formatAcceptAttr(kind)}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};
