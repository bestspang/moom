import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Users, UserPlus, X, AlertTriangle, Package, Megaphone, UserCog, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

// ── CSV header parsing (first line only) ──

function parseCsvFirstLine(text: string): { headers: string[]; rowCount: number } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rowCount: 0 };
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;
  const line = lines[0];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { headers.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  headers.push(current.trim());
  return { headers, rowCount: lines.length - 1 };
}

// ── Auto-detection with real CSV header aliases ──

export type DetectedModule = 'members' | 'leads' | 'packages' | 'promotions' | 'staff' | 'finance' | null;

const IMPORTABLE_MODULES: DetectedModule[] = ['members', 'leads'];

interface ModuleSignature {
  module: DetectedModule;
  /** Headers that strongly signal this module (lowercase, trimmed) */
  signals: string[];
}

const MODULE_SIGNATURES: ModuleSignature[] = [
  {
    module: 'finance',
    signals: ['transaction no.', 'transaction no', 'order name', 'vat', 'vat @7%', 'payment method', 'tax invoice no.', 'tax invoice no', 'price excluding vat', 'price including vat'],
  },
  {
    module: 'packages',
    signals: ['term(d)', 'sessions', 'access locations', 'sold at', 'categories'],
  },
  {
    module: 'promotions',
    signals: ['promo code', 'promo_code', 'discount', 'started on', 'ending on'],
  },
  {
    module: 'staff',
    signals: ['role', 'branch'],
  },
  {
    module: 'members',
    signals: ['joined date', 'member_id', 'member_since', 'medical conditions', 'medical_notes', 'allow_physical_contact', 'line_id'],
  },
  {
    module: 'leads',
    signals: ['temperature', 'internal_notes', 'package_interest_id', 'times_contacted', 'last_contacted'],
  },
];

function normalize(h: string): string {
  return h.toLowerCase().replace(/[\ufeff"]/g, '').replace(/\s+/g, ' ').trim();
}

function detectModule(headers: string[], fileName: string): { module: DetectedModule; confidence: number } {
  const norm = headers.map(normalize);

  let best: { module: DetectedModule; score: number } = { module: null, score: 0 };

  for (const sig of MODULE_SIGNATURES) {
    const score = sig.signals.filter(s => norm.some(h => h.includes(s))).length;
    if (score > best.score) {
      best = { module: sig.module, score };
    }
  }

  if (best.score > 0) return { module: best.module, confidence: best.score };

  // Filename fallback
  const fn = fileName.toLowerCase();
  if (fn.includes('member')) return { module: 'members', confidence: 0.5 };
  if (fn.includes('lead')) return { module: 'leads', confidence: 0.5 };
  if (fn.includes('package')) return { module: 'packages', confidence: 0.5 };
  if (fn.includes('promo')) return { module: 'promotions', confidence: 0.5 };
  if (fn.includes('staff')) return { module: 'staff', confidence: 0.5 };
  if (fn.includes('finance') || fn.includes('transaction') || fn.includes('slip')) return { module: 'finance', confidence: 0.5 };

  return { module: null, confidence: 0 };
}

// ── Module icon helper ──

function ModuleIcon({ module }: { module: DetectedModule }) {
  switch (module) {
    case 'members': return <Users className="h-4 w-4 text-primary" />;
    case 'leads': return <UserPlus className="h-4 w-4 text-primary" />;
    case 'packages': return <Package className="h-4 w-4 text-primary" />;
    case 'promotions': return <Megaphone className="h-4 w-4 text-primary" />;
    case 'staff': return <UserCog className="h-4 w-4 text-primary" />;
    case 'finance': return <DollarSign className="h-4 w-4 text-primary" />;
    default: return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }
}

// ── Types ──

export interface QueuedFile {
  id: string;
  file: File;
  headers: string[];
  rowCount: number;
  detectedModule: DetectedModule;
  selectedModule: DetectedModule;
  confidence: number;
}

interface BulkImportDropZoneProps {
  onStartImport: (file: File, module: 'members' | 'leads') => void;
}

const ALL_MODULES: { value: DetectedModule; labelKey: string }[] = [
  { value: 'members', labelKey: 'nav.members' },
  { value: 'leads', labelKey: 'nav.leads' },
  { value: 'packages', labelKey: 'nav.packages' },
  { value: 'promotions', labelKey: 'nav.promotions' },
  { value: 'staff', labelKey: 'nav.staff' },
  { value: 'finance', labelKey: 'nav.finance' },
];

const BulkImportDropZone = ({ onStartImport }: BulkImportDropZoneProps) => {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rowCount } = parseCsvFirstLine(text);
        const detection = detectModule(headers, file.name);

        setQueue(prev => [...prev, {
          id: `${file.name}-${Date.now()}`,
          file,
          headers,
          rowCount,
          detectedModule: detection.module,
          selectedModule: detection.module,
          confidence: detection.confidence,
        }]);
      };
      reader.readAsText(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setQueue(prev => prev.filter(f => f.id !== id));
  };

  const updateModule = (id: string, module: DetectedModule) => {
    setQueue(prev => prev.map(f => f.id === id ? { ...f, selectedModule: module } : f));
  };

  const isImportable = (module: DetectedModule) => IMPORTABLE_MODULES.includes(module as any);

  const handleStartImport = (item: QueuedFile) => {
    if (!item.selectedModule || !isImportable(item.selectedModule)) return;
    onStartImport(item.file, item.selectedModule as 'members' | 'leads');
    removeFile(item.id);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {t('settings.importExport.bulkDropTitle')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('settings.importExport.bulkDropDesc')}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* File queue */}
        {queue.length > 0 && (
          <div className="mt-4 space-y-2">
            {queue.map(item => {
              const importable = isImportable(item.selectedModule);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-shrink-0">
                    <ModuleIcon module={item.selectedModule} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{item.file.name}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {item.rowCount} {t('settings.importExport.rows')}
                      </Badge>
                    </div>
                  </div>

                  {/* Module selector */}
                  <Select
                    value={item.selectedModule || '__none__'}
                    onValueChange={(v) => updateModule(item.id, v === '__none__' ? null : v as DetectedModule)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_MODULES.map(m => (
                        <SelectItem key={m.value!} value={m.value!}>{t(m.labelKey)}</SelectItem>
                      ))}
                      <SelectItem value="__none__">{t('settings.importExport.unknown')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Actions */}
                  {importable ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs"
                      onClick={() => handleStartImport(item)}
                    >
                      {t('settings.importExport.startImport')}
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs"
                            disabled
                          >
                            {t('settings.importExport.startImport')}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('settings.importExport.comingSoon')}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeFile(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkImportDropZone;
