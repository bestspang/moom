import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, Download, AlertTriangle, CheckCircle, X,
  Users, UserPlus, Package, Megaphone, UserCog, DollarSign, Receipt,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import {
  parseCsv, downloadCsvTemplate,
  ENTITY_CONFIGS,
  type EntityId, type ImportStep, type ImportRow, type ImportResult,
} from '@/lib/importer';

// ── Icons map ──
const ENTITY_ICONS: Record<EntityId, React.ElementType> = {
  members: Users, leads: UserPlus, packages: Package,
  staff: UserCog, promotions: Megaphone, finance: DollarSign, slips: Receipt,
};

const ENTITY_LABELS: Record<EntityId, { en: string; th: string }> = {
  members: { en: 'Members', th: 'สมาชิก' },
  leads: { en: 'Leads', th: 'ลูกค้าเป้าหมาย' },
  packages: { en: 'Packages', th: 'แพ็กเกจ' },
  staff: { en: 'Staff', th: 'พนักงาน' },
  promotions: { en: 'Promotions', th: 'โปรโมชั่น' },
  finance: { en: 'Finance', th: 'การเงิน' },
  slips: { en: 'Transfer Slips', th: 'สลิปโอนเงิน' },
};

const IMPORTABLE: EntityId[] = ['members', 'leads', 'packages', 'staff', 'promotions', 'finance'];

interface ImportCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetEntity?: EntityId;
  initialFile?: File;
}

export const ImportCenterDialog = ({ open, onOpenChange, presetEntity, initialFile }: ImportCenterDialogProps) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>(presetEntity ? 'upload' : 'select');
  const [entity, setEntity] = useState<EntityId | null>(presetEntity || null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const config = entity ? ENTITY_CONFIGS[entity] : null;
  const lang = language === 'th' ? 'th' : 'en';

  // Auto-process file
  useEffect(() => {
    if (open && initialFile && (step === 'upload' || step === 'select') && entity) {
      handleFile(initialFile);
    }
  }, [open, initialFile, entity]);

  // Sync preset
  useEffect(() => {
    if (open && presetEntity) {
      setEntity(presetEntity);
      setStep('upload');
    }
  }, [open, presetEntity]);

  const reset = () => {
    setStep(presetEntity ? 'upload' : 'select');
    setEntity(presetEntity || null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setPreviewRows([]);
    setProgress(0);
    setResult(null);
    setFileName('');
  };

  const handleClose = () => { reset(); onOpenChange(false); };

  const handleFile = useCallback((file: File) => {
    if (!config) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMap: Record<number, string> = {};
      headers.forEach((h, i) => {
        const normalized = h.toLowerCase().trim();
        autoMap[i] = config.headerAliases[normalized] || '__skip__';
      });
      setMapping(autoMap);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, [config]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) handleFile(file);
  }, [handleFile]);

  const buildMappedData = (row: string[]): Record<string, string> => {
    const data: Record<string, string> = {};
    csvHeaders.forEach((_, colIdx) => {
      const target = mapping[colIdx];
      if (target && target !== '__skip__' && row[colIdx]) data[target] = row[colIdx];
    });
    return data;
  };

  const buildPreview = useCallback(() => {
    if (!config) return;
    const rows: ImportRow[] = csvRows.slice(0, 20).map((row, idx) => {
      const data = buildMappedData(row);
      const errors = config.validateRow(data);
      return { rowIndex: idx + 2, data, errors };
    });
    setPreviewRows(rows);
    setStep('preview');
  }, [csvRows, csvHeaders, mapping, config]);

  const doImport = useCallback(async () => {
    if (!config) return;
    setStep('importing');
    setProgress(0);
    const allRows: ImportRow[] = csvRows.map((row, idx) => {
      const data = buildMappedData(row);
      const errors = config.validateRow(data);
      return { rowIndex: idx + 2, data, errors };
    });
    const importResult = await config.upsertRows(allRows, queryClient, setProgress);
    // Invalidate
    for (const key of config.queryKeysToInvalidate) {
      queryClient.invalidateQueries({ queryKey: key });
    }
    setResult(importResult);
    setStep('done');
  }, [csvRows, csvHeaders, mapping, config, queryClient]);

  const downloadErrors = () => {
    if (!result || result.errors.length === 0) return;
    const cols: CsvColumn<typeof result.errors[0]>[] = [
      { key: 'row', header: 'Row', accessor: r => r.row },
      { key: 'reason', header: 'Error', accessor: r => r.reason },
      ...Object.keys(result.errors[0]?.data || {}).slice(0, 5).map(k => ({
        key: k, header: k, accessor: (r: any) => r.data[k] || '',
      })),
    ];
    exportToCsv(result.errors, cols, `${entity}-import-errors`);
  };

  const entityLabel = entity ? ENTITY_LABELS[entity][lang] : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? (language === 'th' ? 'เลือกประเภทข้อมูล' : 'Select Data Type') : `Import ${entityLabel}`}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Select Entity */}
        {step === 'select' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(ENTITY_CONFIGS) as EntityId[]).map(id => {
              const Icon = ENTITY_ICONS[id];
              const label = ENTITY_LABELS[id][lang];
              const importable = IMPORTABLE.includes(id);
              return (
                <Card
                  key={id}
                  className={`cursor-pointer transition-colors hover:border-primary/50 ${!importable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!importable) return;
                    setEntity(id);
                    setStep('upload');
                  }}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                    {!importable && (
                      <Badge variant="secondary" className="text-[10px]">
                        {language === 'th' ? 'เร็วๆ นี้' : 'Coming soon'}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && config && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'ลากไฟล์มาวางหรือคลิกเพื่อเลือก' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate(config.templateHeaders, `${entity}-template.csv`)}>
                <Download className="h-3 w-3 mr-1" />
                {language === 'th' ? 'เทมเพลตแบบย่อ' : 'Minimal template'}
              </Button>
              {config.fullTemplateHeaders && (
                <Button variant="outline" size="sm" onClick={() => downloadCsvTemplate(config.fullTemplateHeaders!, `${entity}-template-full.csv`)}>
                  <Download className="h-3 w-3 mr-1" />
                  {language === 'th' ? 'เทมเพลตแบบเต็ม' : 'Full template'}
                </Button>
              )}
            </div>
            {!presetEntity && (
              <Button variant="ghost" size="sm" onClick={() => { setEntity(null); setStep('select'); }}>
                ← {t('common.back')}
              </Button>
            )}
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && config && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'th' ? 'จับคู่คอลัมน์' : 'Map columns'} — {csvRows.length} {language === 'th' ? 'แถว' : 'rows'}
            </p>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {csvHeaders.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate font-mono">{header}</span>
                    <span className="text-muted-foreground">→</span>
                    <Select value={mapping[idx] || '__skip__'} onValueChange={v => setMapping(prev => ({ ...prev, [idx]: v }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.targetFields.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>{t('common.back')}</Button>
              <Button onClick={buildPreview}>{t('common.next')}</Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (() => {
          const validCount = previewRows.filter(r => r.errors.length === 0).length;
          const errorCount = previewRows.filter(r => r.errors.length > 0).length;
          const allErrors = csvRows.length > 0 && validCount === 0;
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'ตรวจสอบข้อมูล' : 'Preview'} ({previewRows.length} of {csvRows.length})
              </p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium">
                  <CheckCircle className="h-3.5 w-3.5" /> {validCount} valid
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" /> {errorCount} errors
                  </div>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="p-1.5 text-left w-12">Row</th>
                      <th className="p-1.5 text-left">Data</th>
                      <th className="p-1.5 text-left">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map(row => {
                      const preview = Object.entries(row.data).slice(0, 3).map(([, v]) => v).join(', ');
                      return (
                        <tr key={row.rowIndex} className={`border-b ${row.errors.length > 0 ? 'bg-red-50/50 dark:bg-red-950/30' : ''}`}>
                          <td className="p-1.5">{row.rowIndex}</td>
                          <td className="p-1.5 truncate max-w-[200px]">{preview}</td>
                          <td className="p-1.5">
                            {row.errors.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {row.errors.map((err, i) => <Badge key={i} variant="destructive" className="text-[10px]">{err}</Badge>)}
                              </div>
                            ) : <Badge variant="secondary" className="text-[10px]">OK</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
              {errorCount > 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {allErrors ? (language === 'th' ? 'ทุกแถวมีข้อผิดพลาด' : 'All rows have errors') : `${errorCount} ${language === 'th' ? 'แถวจะถูกข้าม' : 'rows will be skipped'}`}
                </p>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>{t('common.back')}</Button>
                <Button onClick={doImport} disabled={allErrors}>
                  {language === 'th' ? 'เริ่มนำเข้า' : 'Start Import'}
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <p className="text-sm text-center text-muted-foreground">
              {language === 'th' ? 'กำลังนำเข้า...' : 'Importing...'}
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {language === 'th' ? 'นำเข้าเสร็จสิ้น' : 'Import Complete'}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'สร้างใหม่' : 'Created'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'อัปเดต' : 'Updated'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-xs text-muted-foreground">{language === 'th' ? 'ล้มเหลว' : 'Failed'}</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadErrors}>
                <Download className="h-3 w-3 mr-1" />
                {language === 'th' ? 'ดาวน์โหลด Error CSV' : 'Download Error CSV'}
              </Button>
            )}
            <div className="flex justify-end">
              <Button onClick={handleClose}>{language === 'th' ? 'ปิด' : 'Close'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
