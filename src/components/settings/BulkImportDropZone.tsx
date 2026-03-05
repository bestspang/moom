import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Users, UserPlus, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

// ── CSV header parsing (first line only) ──

function parseCsvFirstLine(text: string): { headers: string[]; rowCount: number } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rowCount: 0 };
  // Simple CSV line parse
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

// ── Auto-detection ──

type DetectedModule = 'members' | 'leads' | null;

function detectModule(headers: string[], fileName: string): { module: DetectedModule; confidence: number } {
  const normalized = headers.map(h => h.toLowerCase().trim());
  const memberSignals = ['member_id', 'member_since', 'line_id', 'allow_physical_contact'];
  const leadSignals = ['temperature', 'internal_notes', 'package_interest_id'];

  const memberScore = memberSignals.filter(s => normalized.includes(s)).length;
  const leadScore = leadSignals.filter(s => normalized.includes(s)).length;

  if (memberScore > leadScore) return { module: 'members', confidence: memberScore };
  if (leadScore > memberScore) return { module: 'leads', confidence: leadScore };

  // Fallback: check filename
  const fn = fileName.toLowerCase();
  if (fn.includes('member')) return { module: 'members', confidence: 0.5 };
  if (fn.includes('lead')) return { module: 'leads', confidence: 0.5 };

  return { module: null, confidence: 0 };
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

  const handleStartImport = (item: QueuedFile) => {
    if (!item.selectedModule) return;
    onStartImport(item.file, item.selectedModule);
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
            {queue.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {item.selectedModule === 'members' ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : item.selectedModule === 'leads' ? (
                    <UserPlus className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>

                {/* File info */}
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
                  onValueChange={(v) => updateModule(item.id, v === '__none__' ? null : v as 'members' | 'leads')}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">{t('nav.members')}</SelectItem>
                    <SelectItem value="leads">{t('nav.leads')}</SelectItem>
                    <SelectItem value="__none__">{t('settings.importExport.unknown')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Actions */}
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs"
                  disabled={!item.selectedModule}
                  onClick={() => handleStartImport(item)}
                >
                  {t('settings.importExport.startImport')}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => removeFile(item.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkImportDropZone;
