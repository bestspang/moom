import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';

const ROOT_ID = 'moom-sticky-savebar-root';
let refCount = 0;

export interface StickySaveBarLabels {
  dirty: string;
  save: string;
  cancel: string;
  blocked: string;
}

export interface StickySaveBarProps {
  visible: boolean;
  canWrite: boolean;
  saving?: boolean;
  onSave: () => void;
  onCancel: () => void;
  labels: StickySaveBarLabels;
}

/**
 * Reusable sticky save bar — portaled to body to escape transformed ancestors
 * (sidebar/main use transforms for page-enter motion).
 *
 * Lifecycle-safe: mounts a dedicated container on first instance, removes it
 * on the last unmount via ref-counting. RBAC: hidden when !canWrite, and
 * each action button enforces canWrite at click time.
 */
export const StickySaveBar: React.FC<StickySaveBarProps> = ({
  visible,
  canWrite,
  saving = false,
  onSave,
  onCancel,
  labels,
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const ownedRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let el = document.getElementById(ROOT_ID) as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = ROOT_ID;
      document.body.appendChild(el);
    }
    setContainer(el);
    refCount += 1;
    ownedRef.current = true;
    return () => {
      if (!ownedRef.current) return;
      ownedRef.current = false;
      refCount -= 1;
      if (refCount <= 0) {
        refCount = 0;
        const node = document.getElementById(ROOT_ID);
        if (node && node.parentNode) node.parentNode.removeChild(node);
      }
    };
  }, []);

  if (!visible || !canWrite || !container) return null;

  const handleSave = () => {
    if (saving || !canWrite) return;
    onSave();
  };
  const handleCancel = () => {
    if (saving || !canWrite) return;
    onCancel();
  };

  return createPortal(
    <div
      role="region"
      aria-label={labels.dirty}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-3.5 pl-5 pr-2.5 py-2.5 rounded-full bg-foreground text-background animate-in slide-in-from-bottom-4 duration-200"
      style={{ boxShadow: '0 20px 50px rgba(15,23,42,0.3)' }}
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[13px] font-bold whitespace-nowrap">{labels.dirty}</span>
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving || !canWrite}
        className="h-8 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors disabled:opacity-50"
      >
        {labels.cancel}
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canWrite}
        className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-xs font-extrabold inline-flex items-center gap-1.5 hover:brightness-110 transition disabled:opacity-50"
        style={{ boxShadow: '0 8px 20px hsl(var(--primary) / 0.4)' }}
      >
        <Save className="w-3.5 h-3.5" strokeWidth={2.4} />
        {labels.save}
      </button>
    </div>,
    container
  );
};

export default StickySaveBar;
