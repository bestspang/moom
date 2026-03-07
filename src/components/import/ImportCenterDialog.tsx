import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Upload, Download, AlertTriangle, CheckCircle, X,
  Users, UserPlus, Package, Megaphone, UserCog, DollarSign, Receipt, BookOpen, Dumbbell,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useLocations } from '@/hooks/useLocations';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';
import {
  parseCsv, downloadCsvTemplate,
  ENTITY_CONFIGS,
  type EntityId, type ImportStep, type ImportRow, type ImportResult, type EnumFieldDef,
} from '@/lib/importer';

// ── Icons map ──
const ENTITY_ICONS: Record<EntityId, React.ElementType> = {
  members: Users, leads: UserPlus, packages: Package,
  staff: UserCog, promotions: Megaphone, finance: DollarSign, slips: Receipt,
  classes: BookOpen, workouts: Dumbbell,
};

const ENTITY_LABELS: Record<EntityId, { en: string; th: string }> = {
  members: { en: 'Members', th: 'สมาชิก' },
  leads: { en: 'Leads', th: 'ลูกค้าเป้าหมาย' },
  packages: { en: 'Packages', th: 'แพ็กเกจ' },
  staff: { en: 'Staff', th: 'พนักงาน' },
  promotions: { en: 'Promotions', th: 'โปรโมชั่น' },
  finance: { en: 'Finance', th: 'การเงิน' },
  slips: { en: 'Transfer Slips', th: 'สลิปโอนเงิน' },
  classes: { en: 'Classes', th: 'คลาส' },
  workouts: { en: 'Workouts', th: 'เวิร์คเอาท์' },
};

const IMPORTABLE: EntityId[] = ['members', 'leads', 'packages', 'staff', 'promotions', 'finance', 'slips', 'classes', 'workouts'];

interface ImportCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetEntity?: EntityId;
  initialFile?: File;
}

export const ImportCenterDialog = ({ open, onOpenChange, presetEntity, initialFile }: ImportCenterDialogProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>(presetEntity ? 'upload' : 'select');
  const [entity, setEntity] = useState<EntityId | null>(presetEntity || null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  // Mapping: target field value → CSV column index (or -1 for skip)
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  // Enum overrides: field → { rawLowerValue → validEnumValue }
  const [enumOverrides, setEnumOverrides] = useState<Record<string, Record<string, string>>>({});
  // Detected unrecognized enum values: field → Set<rawValue>
  const [unmatchedEnums, setUnmatchedEnums] = useState<Record<string, string[]>>({});

  // Members-specific options
  const [defaultLocationId, setDefaultLocationId] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const { data: locations } = useLocations();
  const config = entity ? ENTITY_CONFIGS[entity] : null;
  const lang = language === 'th' ? 'th' : 'en';

  // Separate required and optional target fields (exclude __skip__)
  const { requiredFields, optionalFields } = useMemo(() => {
    if (!config) return { requiredFields: [], optionalFields: [] };
    const allFields = config.targetFields.filter(f => f.value !== '__skip__');
    return {
      requiredFields: allFields.filter(f => f.required),
      optionalFields: allFields.filter(f => !f.required),
    };
  }, [config]);

  // Check if register_location_id is mapped
  const isLocationMapped = Object.entries(mapping).some(([k, v]) => k === 'register_location_id' && v >= 0);
  const showLocationPicker = entity === 'members' && !isLocationMapped;

  // Check if all required fields are mapped (not skipped)
  const hasRequiredError = useMemo(() => {
    return requiredFields.some(f => {
      const colIdx = mapping[f.value];
      return colIdx === undefined || colIdx < 0;
    });
  }, [requiredFields, mapping]);

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
    setDefaultLocationId('');
    setOverwriteExisting(false);
    setEnumOverrides({});
    setUnmatchedEnums({});
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

      // Build reverse mapping: for each target field, find the best CSV column
      const newMapping: Record<string, number> = {};
      const allFields = config.targetFields.filter(f => f.value !== '__skip__');

      for (const field of allFields) {
        // Check if any CSV header maps to this target field via aliases
        let bestIdx = -1;
        for (let i = 0; i < headers.length; i++) {
          const normalized = headers[i].toLowerCase().trim();
          const aliasTarget = config.headerAliases[normalized];
          if (aliasTarget === field.value) {
            bestIdx = i;
            break;
          }
        }
        newMapping[field.value] = bestIdx;
      }

      setMapping(newMapping);
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
    for (const [targetField, colIdx] of Object.entries(mapping)) {
      if (colIdx >= 0 && row[colIdx]) {
        data[targetField] = row[colIdx];
      }
    }
    // Apply default location for members if not in CSV
    if (entity === 'members' && !data.register_location_id && defaultLocationId) {
      data.register_location_id = defaultLocationId;
    }
    return data;
  };

  // Get the mapped fields that are actually active (not skipped)
  const activeMappedFields = useMemo(() => {
    if (!config) return [];
    const allFields = config.targetFields.filter(f => f.value !== '__skip__');
    return allFields.filter(f => (mapping[f.value] ?? -1) >= 0);
  }, [config, mapping]);

  // Detect unrecognized enum values from CSV data and go to enum-mapping if needed
  const proceedFromMapping = useCallback(() => {
    if (!config) return;
    const enumDefs = config.enumFields || [];
    if (enumDefs.length === 0) {
      // No enum fields → skip to preview
      buildPreview();
      return;
    }

    // Scan all CSV rows for unrecognized enum values
    const unmatched: Record<string, Set<string>> = {};
    for (const row of csvRows) {
      const data = buildMappedData(row);
      for (const def of enumDefs) {
        const rawVal = data[def.field];
        if (!rawVal || !rawVal.trim()) continue;
        const normalized = def.normalize(rawVal);
        if (!normalized) {
          if (!unmatched[def.field]) unmatched[def.field] = new Set();
          unmatched[def.field].add(rawVal.trim());
        }
      }
    }

    const unmatchedArr: Record<string, string[]> = {};
    let hasUnmatched = false;
    for (const [field, vals] of Object.entries(unmatched)) {
      unmatchedArr[field] = Array.from(vals);
      hasUnmatched = true;
    }

    if (hasUnmatched) {
      setUnmatchedEnums(unmatchedArr);
      // Initialize overrides with empty values
      const newOverrides: Record<string, Record<string, string>> = { ...enumOverrides };
      for (const [field, vals] of Object.entries(unmatchedArr)) {
        if (!newOverrides[field]) newOverrides[field] = {};
        for (const v of vals) {
          if (!newOverrides[field][v.toLowerCase().trim()]) {
            newOverrides[field][v.toLowerCase().trim()] = '';
          }
        }
      }
      setEnumOverrides(newOverrides);
      setStep('enum-mapping');
    } else {
      buildPreview();
    }
  }, [csvRows, config, mapping, defaultLocationId, entity, enumOverrides]);

  const buildPreview = useCallback(() => {
    if (!config) return;
    const rows: ImportRow[] = csvRows.slice(0, 10).map((row, idx) => {
      const data = buildMappedData(row);
      // Apply enum overrides to data before validation
      if (config.enumFields) {
        for (const def of config.enumFields) {
          const rawVal = data[def.field];
          if (rawVal && !def.normalize(rawVal)) {
            const override = enumOverrides[def.field]?.[rawVal.toLowerCase().trim()];
            if (override === '__skip_enum__') {
              delete data[def.field]; // Remove the field entirely
            } else if (override) {
              data[def.field] = override;
            }
          }
        }
      }
      const errors = config.validateRow(data);
      return { rowIndex: idx + 2, data, errors };
    });
    setPreviewRows(rows);
    setStep('preview');
  }, [csvRows, csvHeaders, mapping, config, defaultLocationId, entity, enumOverrides]);

  const doImport = useCallback(async () => {
    if (!config) return;
    setStep('importing');
    setProgress(0);
    const allRows: ImportRow[] = csvRows.map((row, idx) => {
      const data = buildMappedData(row);
      // Apply enum overrides
      if (config.enumFields) {
        for (const def of config.enumFields) {
          const rawVal = data[def.field];
          if (rawVal && !def.normalize(rawVal)) {
            const override = enumOverrides[def.field]?.[rawVal.toLowerCase().trim()];
            if (override === '__skip_enum__') {
              delete data[def.field];
            } else if (override) {
              data[def.field] = override;
            }
          }
        }
      }
      const errors = config.validateRow(data);
      return { rowIndex: idx + 2, data, errors };
    });
    const importResult = await config.upsertRows(allRows, queryClient, setProgress, {
      overwrite: overwriteExisting,
      defaultLocationId: defaultLocationId || undefined,
      enumOverrides,
    });
    // Invalidate
    for (const key of config.queryKeysToInvalidate) {
      queryClient.invalidateQueries({ queryKey: key });
    }
    setResult(importResult);
    setStep('done');
  }, [csvRows, csvHeaders, mapping, config, queryClient, overwriteExisting, defaultLocationId, entity, enumOverrides]);

  const downloadErrors = (errors?: { row: number; reason: string; data: Record<string, string> }[]) => {
    const errList = errors || result?.errors || [];
    if (errList.length === 0) return;
    const cols: CsvColumn<typeof errList[0]>[] = [
      { key: 'row', header: 'Row', accessor: r => r.row },
      { key: 'reason', header: 'Error', accessor: r => r.reason },
      ...Object.keys(errList[0]?.data || {}).slice(0, 8).map(k => ({
        key: k, header: k, accessor: (r: any) => r.data[k] || '',
      })),
    ];
    exportToCsv(errList, cols, `${entity}-import-errors`);
  };

  const entityLabel = entity ? ENTITY_LABELS[entity][lang] : '';

  // CSV column options for dropdown
  const csvColumnOptions = useMemo(() => {
    return [
      { value: '-1', label: language === 'th' ? '— ข้าม —' : '— Skip —' },
      ...csvHeaders.map((h, i) => ({ value: String(i), label: h })),
    ];
  }, [csvHeaders, language]);

  const renderFieldMappingRow = (field: { value: string; label: string; required?: boolean }) => {
    const colIdx = mapping[field.value] ?? -1;
    const isSkipped = colIdx < 0;
    const isRequired = field.required;
    const hasError = isRequired && isSkipped;
    const autoDetected = colIdx >= 0;

    return (
      <div key={field.value} className={`flex items-center gap-3 py-1.5 px-2 rounded ${hasError ? 'bg-destructive/10' : ''}`}>
        <div className="flex items-center gap-1.5 w-44 min-w-0">
          <span className="text-sm truncate">{field.label}</span>
          {isRequired && <span className="text-destructive text-xs font-bold">*</span>}
        </div>
        <span className="text-muted-foreground text-xs">←</span>
        <Select
          value={String(colIdx)}
          onValueChange={v => setMapping(prev => ({ ...prev, [field.value]: parseInt(v) }))}
        >
          <SelectTrigger className={`w-52 ${autoDetected && !hasError ? 'border-primary/30' : ''} ${hasError ? 'border-destructive' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {csvColumnOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasError && (
          <span className="text-destructive text-[11px] whitespace-nowrap">
            {language === 'th' ? 'จำเป็นต้องแมป' : 'Must be mapped'}
          </span>
        )}
        {autoDetected && !hasError && (
          <Badge variant="secondary" className="text-[9px] shrink-0">Auto</Badge>
        )}
      </div>
    );
  };

  const titleText = step === 'select' ? (language === 'th' ? 'เลือกประเภทข้อมูล' : 'Select Data Type') : `Import ${entityLabel}`;

  const dialogBody = (
    <>

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
            {/* Helper text */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {language === 'th'
                ? 'เลือกคอลัมน์จาก CSV ที่ตรงกับแต่ละฟิลด์ หากไม่มีข้อมูลในไฟล์ CSV ให้เลือก "ข้าม" ฟิลด์ที่มีเครื่องหมาย * ต้องระบุ'
                : 'Match each field to a column from your CSV. Choose "Skip" if your file doesn\'t contain that field. Fields marked * are required.'}
            </div>

            <p className="text-sm text-muted-foreground">
              {csvRows.length} {language === 'th' ? 'แถวจากไฟล์' : 'rows from file'} — <span className="font-mono text-xs">{fileName}</span>
            </p>

            <ScrollArea className="h-[320px]">
              <div className="space-y-4">
                {/* Required fields section */}
                {requiredFields.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2">
                      {language === 'th' ? 'ฟิลด์ที่จำเป็น' : 'Required Fields'}
                    </p>
                    <div className="space-y-1">
                      {requiredFields.map(renderFieldMappingRow)}
                    </div>
                  </div>
                )}

                {/* Optional fields section */}
                {optionalFields.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {language === 'th' ? 'ฟิลด์ทางเลือก' : 'Optional Fields'}
                    </p>
                    <div className="space-y-1">
                      {optionalFields.map(renderFieldMappingRow)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Members-specific options */}
            {entity === 'members' && (
              <div className="space-y-3 rounded-lg border p-3">
                {showLocationPicker && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {language === 'th' ? 'สาขาเริ่มต้น (สำหรับแถวที่ไม่มีสาขา)' : 'Default location (for rows without location)'}
                    </Label>
                    <Select value={defaultLocationId} onValueChange={setDefaultLocationId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={language === 'th' ? 'เลือกสาขา...' : 'Select location...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations || []).map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    {language === 'th' ? 'เขียนทับข้อมูลเดิม' : 'Overwrite existing values'}
                  </Label>
                  <Switch checked={overwriteExisting} onCheckedChange={setOverwriteExisting} />
                </div>
                {!overwriteExisting && (
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'th' ? 'เฉพาะฟิลด์ที่ว่างจะถูกอัปเดต' : 'Only empty fields will be updated (fill blanks only)'}
                  </p>
                )}
              </div>
            )}

            {hasRequiredError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {language === 'th' ? 'ฟิลด์ที่จำเป็นทั้งหมดต้องถูกแมปกับคอลัมน์ CSV' : 'All required fields must be mapped to a CSV column'}
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>{t('common.back')}</Button>
              <Button onClick={proceedFromMapping} disabled={hasRequiredError}>
                {language === 'th' ? 'ถัดไป' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Enum Mapping */}
        {step === 'enum-mapping' && config && (() => {
          const enumDefs = config.enumFields || [];
          const hasUnmapped = Object.entries(unmatchedEnums).some(([field, vals]) =>
            vals.some(v => !enumOverrides[field]?.[v.toLowerCase().trim()])
          );

          return (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                {language === 'th'
                  ? 'พบค่าที่ไม่ตรงกับตัวเลือกที่รองรับ กรุณาเลือกค่าที่ถูกต้องสำหรับแต่ละรายการ หรือเลือก "ข้าม" เพื่อปล่อยว่าง'
                  : 'Some values in your CSV don\'t match the expected options. Map each unrecognized value to a valid option, or choose "Skip" to leave it empty.'}
              </div>

              <ScrollArea className="h-[340px]">
                <div className="space-y-5">
                  {Object.entries(unmatchedEnums).map(([field, rawValues]) => {
                    const def = enumDefs.find(d => d.field === field);
                    if (!def) return null;
                    return (
                      <div key={field} className="space-y-2">
                        <p className="text-sm font-medium">{def.label}</p>
                        <div className="space-y-1.5">
                          {rawValues.map(rawVal => {
                            const key = rawVal.toLowerCase().trim();
                            const currentOverride = enumOverrides[field]?.[key] || '';
                            return (
                              <div key={rawVal} className="flex items-center gap-3 py-1 px-2 rounded bg-muted/30">
                                <div className="w-40 min-w-0">
                                  <Badge variant="outline" className="text-xs font-mono truncate max-w-full">
                                    {rawVal}
                                  </Badge>
                                </div>
                                <span className="text-muted-foreground text-xs">→</span>
                                <Select
                                  value={currentOverride}
                                  onValueChange={v => {
                                    setEnumOverrides(prev => ({
                                      ...prev,
                                      [field]: { ...prev[field], [key]: v },
                                    }));
                                  }}
                                >
                                  <SelectTrigger className={`w-48 ${!currentOverride ? 'border-destructive/50' : 'border-primary/30'}`}>
                                    <SelectValue placeholder={language === 'th' ? 'เลือกค่า...' : 'Select value...'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__skip_enum__">
                                      {language === 'th' ? '— ข้าม (ปล่อยว่าง) —' : '— Skip (leave empty) —'}
                                    </SelectItem>
                                    {def.options.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {hasUnmapped && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {language === 'th' ? 'ค่าที่ยังไม่ได้แมปจะถูกปล่อยว่าง' : 'Unmapped values will be left empty during import'}
                </p>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  {t('common.back')}
                </Button>
                <Button onClick={buildPreview}>
                  {language === 'th' ? 'ดูตัวอย่าง' : 'Preview'}
                </Button>
              </div>
            </div>
          );
        })()}


        {/* Step: Preview */}
        {step === 'preview' && (() => {
          const validCount = previewRows.filter(r => r.errors.length === 0).length;
          const errorCount = previewRows.filter(r => r.errors.length > 0).length;
          const allErrors = csvRows.length > 0 && validCount === 0;
          const errorRows = previewRows.filter(r => r.errors.length > 0);

          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'ตรวจสอบข้อมูลก่อนนำเข้า' : 'Review parsed data before importing'} ({previewRows.length} of {csvRows.length})
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

              {/* Full mapped preview table */}
              <ScrollArea className="h-[280px]">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 sticky left-0 bg-background z-10">Row</TableHead>
                        {activeMappedFields.map(f => (
                          <TableHead key={f.value} className="whitespace-nowrap">
                            {f.label}
                            {f.required && <span className="text-destructive ml-0.5">*</span>}
                          </TableHead>
                        ))}
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map(row => {
                        const hasErr = row.errors.length > 0;
                        return (
                          <TableRow key={row.rowIndex} className={hasErr ? 'bg-destructive/5' : ''}>
                            <TableCell className="font-mono text-xs sticky left-0 bg-background z-10">{row.rowIndex}</TableCell>
                            {activeMappedFields.map(f => {
                              const val = row.data[f.value] || '';
                              // Check if this specific field has an error
                              const fieldErr = row.errors.find(e =>
                                e.toLowerCase().includes(f.value.toLowerCase()) ||
                                e.toLowerCase().includes(f.label.toLowerCase().split(' ')[0])
                              );
                              return (
                                <TableCell
                                  key={f.value}
                                  className={`max-w-[150px] truncate text-xs ${fieldErr ? 'text-destructive font-medium bg-destructive/10' : ''} ${!val && f.required ? 'text-destructive/60 italic' : ''}`}
                                  title={fieldErr || val}
                                >
                                  {val || (f.required ? '(empty)' : '—')}
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              {hasErr ? (
                                <div className="flex flex-wrap gap-1">
                                  {row.errors.map((err, i) => (
                                    <Badge key={i} variant="destructive" className="text-[9px] max-w-[180px] truncate">{err}</Badge>
                                  ))}
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-[9px]">OK</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-destructive flex items-center gap-1 flex-1">
                    <AlertTriangle className="h-3 w-3" />
                    {allErrors
                      ? (language === 'th' ? 'ทุกแถวมีข้อผิดพลาด' : 'All rows have errors')
                      : `${errorCount} ${language === 'th' ? 'แถวจะถูกข้าม' : 'rows will be skipped'}`}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => downloadErrors(errorRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })))}>
                    <Download className="h-3 w-3 mr-1" />
                    {language === 'th' ? 'ดาวน์โหลด Error CSV' : 'Download Error CSV'}
                  </Button>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(config?.enumFields?.length ? 'enum-mapping' : 'mapping')}>{t('common.back')}</Button>
                <Button onClick={doImport} disabled={allErrors}>
                  {language === 'th' ? `เริ่มนำเข้า (${csvRows.length} แถว)` : `Start Import (${csvRows.length} rows)`}
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
              <Button variant="outline" size="sm" onClick={() => downloadErrors()}>
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
