import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import { useQueryClient } from '@tanstack/react-query';
import { exportToCsv, type CsvColumn } from '@/lib/exportCsv';

// ── CSV Parsing ──

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

// ── Header Aliases ──

const HEADER_ALIASES: Record<string, string> = {
  'firstname': 'first_name', 'first name': 'first_name', 'first_name': 'first_name', 'ชื่อ': 'first_name',
  'lastname': 'last_name', 'last name': 'last_name', 'last_name': 'last_name', 'นามสกุล': 'last_name',
  'nickname': 'nickname', 'ชื่อเล่น': 'nickname',
  'gender': 'gender', 'เพศ': 'gender',
  'birthdate': 'date_of_birth', 'date_of_birth': 'date_of_birth', 'date of birth': 'date_of_birth', 'dob': 'date_of_birth', 'วันเกิด': 'date_of_birth',
  'phone': 'phone', 'contact number': 'phone', 'เบอร์โทร': 'phone',
  'email': 'email', 'อีเมล': 'email',
  'address': 'address_1', 'address_1': 'address_1', 'ที่อยู่': 'address_1',
  'address_2': 'address_2',
  'subdistrict': 'subdistrict', 'district': 'district', 'province': 'province', 'postal_code': 'postal_code',
  'medical conditions': 'medical_notes', 'medical_notes': 'medical_notes',
  'source': 'source', 'แหล่งที่มา': 'source',
  'status': 'status',
  'notes': 'notes',
  'internal_notes': 'internal_notes',
  'temperature': 'temperature',
  'emergency_first_name': 'emergency_first_name',
  'emergency_last_name': 'emergency_last_name',
  'emergency_phone': 'emergency_phone',
  'emergency_relationship': 'emergency_relationship',
  'register location': 'register_location_id', 'register_location_id': 'register_location_id',
  'package of interest': 'package_interest_id', 'package_interest_id': 'package_interest_id',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'nickname', label: 'Nickname' },
  { value: 'gender', label: 'Gender' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'address_1', label: 'Address 1' },
  { value: 'address_2', label: 'Address 2' },
  { value: 'subdistrict', label: 'Subdistrict' },
  { value: 'district', label: 'District' },
  { value: 'province', label: 'Province' },
  { value: 'postal_code', label: 'Postal Code' },
  { value: 'medical_notes', label: 'Medical Notes' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'internal_notes', label: 'Internal Notes' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'emergency_first_name', label: 'Emergency First Name' },
  { value: 'emergency_phone', label: 'Emergency Phone' },
  { value: 'emergency_relationship', label: 'Emergency Relationship' },
];

// ── Helpers ──

function parseDate(val: string): string | null {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

function normalizeGender(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (['male', 'm', 'ชาย'].includes(v)) return 'male';
  if (['female', 'f', 'หญิง'].includes(v)) return 'female';
  if (['other', 'อื่นๆ'].includes(v)) return 'other';
  return null;
}

// ── Types ──

interface ImportRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
}

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: { row: number; reason: string; data: Record<string, string> }[];
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

function downloadLeadTemplate(type: 'minimal' | 'full') {
  const minHeaders = ['Firstname', 'Lastname', 'Nickname', 'Gender', 'Birthdate', 'Phone', 'Email', 'Address', 'Medical Conditions', 'Source'];
  const fullHeaders = ['first_name', 'last_name', 'nickname', 'gender', 'date_of_birth', 'phone', 'email', 'address_1', 'address_2', 'subdistrict', 'district', 'province', 'postal_code', 'emergency_first_name', 'emergency_phone', 'emergency_relationship', 'medical_notes', 'source', 'status', 'temperature', 'notes', 'internal_notes'];
  const headers = type === 'minimal' ? minHeaders : fullHeaders;
  const csv = headers.map(h => `"${h}"`).join(',') + '\n';
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-template-${type}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Component ──

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportLeadsDialog = ({ open, onOpenChange }: ImportLeadsDialogProps) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const resetState = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setPreviewRows([]);
    setProgress(0);
    setResult(null);
    setFileName('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFile = useCallback((file: File) => {
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
        autoMap[i] = HEADER_ALIASES[normalized] || '__skip__';
      });
      setMapping(autoMap);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      handleFile(file);
    }
  }, [handleFile]);

  const buildPreview = useCallback(() => {
    const rows: ImportRow[] = csvRows.slice(0, 20).map((row, idx) => {
      const data: Record<string, string> = {};
      csvHeaders.forEach((_, colIdx) => {
        const target = mapping[colIdx];
        if (target && target !== '__skip__' && row[colIdx]) {
          data[target] = row[colIdx];
        }
      });
      const errors: string[] = [];
      if (!data.first_name) errors.push('Missing first name');
      if (!data.phone && !data.email) errors.push('Need phone or email');
      if (data.date_of_birth && !parseDate(data.date_of_birth)) errors.push('Invalid date of birth');
      if (data.gender && !normalizeGender(data.gender)) errors.push('Invalid gender');
      return { rowIndex: idx + 2, data, errors };
    });
    setPreviewRows(rows);
    setStep('preview');
  }, [csvRows, csvHeaders, mapping]);

  const doImport = useCallback(async () => {
    setStep('importing');
    setProgress(0);

    const allRows: ImportRow[] = csvRows.map((row, idx) => {
      const data: Record<string, string> = {};
      csvHeaders.forEach((_, colIdx) => {
        const target = mapping[colIdx];
        if (target && target !== '__skip__' && row[colIdx]) {
          data[target] = row[colIdx];
        }
      });
      const errors: string[] = [];
      if (!data.first_name) errors.push('Missing first name');
      if (!data.phone && !data.email) errors.push('Need phone or email');
      return { rowIndex: idx + 2, data, errors };
    });

    const validRows = allRows.filter(r => r.errors.length === 0);
    const invalidRows = allRows.filter(r => r.errors.length > 0);

    const importResult: ImportResult = {
      created: 0, updated: 0, failed: invalidRows.length,
      errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
    };

    // Fetch existing leads for dedup
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, phone, email');
    const byPhone = new Map<string, string>();
    const byEmail = new Map<string, string>();
    for (const l of existingLeads || []) {
      if (l.phone) byPhone.set(l.phone, l.id);
      if (l.email) byEmail.set(l.email.toLowerCase(), l.id);
    }

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress(Math.round(((i + 1) / validRows.length) * 100));

      try {
        let matchId: string | undefined;
        if (row.data.phone) matchId = byPhone.get(row.data.phone);
        if (!matchId && row.data.email) matchId = byEmail.get(row.data.email.toLowerCase());

        const leadData: Record<string, any> = {
          first_name: row.data.first_name,
        };

        if (row.data.last_name) leadData.last_name = row.data.last_name;
        if (row.data.nickname) leadData.nickname = row.data.nickname;
        if (row.data.phone) leadData.phone = row.data.phone;
        if (row.data.email) leadData.email = row.data.email;
        if (row.data.address_1) leadData.address_1 = row.data.address_1;
        if (row.data.address_2) leadData.address_2 = row.data.address_2;
        if (row.data.subdistrict) leadData.subdistrict = row.data.subdistrict;
        if (row.data.district) leadData.district = row.data.district;
        if (row.data.province) leadData.province = row.data.province;
        if (row.data.postal_code) leadData.postal_code = row.data.postal_code;
        if (row.data.notes) leadData.notes = row.data.notes;
        if (row.data.internal_notes) leadData.internal_notes = row.data.internal_notes;
        if (row.data.source) leadData.source = row.data.source;
        if (row.data.temperature) leadData.temperature = row.data.temperature;
        if (row.data.emergency_first_name) leadData.emergency_first_name = row.data.emergency_first_name;
        if (row.data.emergency_phone) leadData.emergency_phone = row.data.emergency_phone;
        if (row.data.emergency_relationship) leadData.emergency_relationship = row.data.emergency_relationship;
        if (row.data.gender) {
          const g = normalizeGender(row.data.gender);
          if (g) leadData.gender = g;
        }
        if (row.data.date_of_birth) {
          const d = parseDate(row.data.date_of_birth);
          if (d) leadData.date_of_birth = d;
        }
        if (row.data.status && ['new', 'contacted', 'interested', 'not_interested', 'converted'].includes(row.data.status.toLowerCase())) {
          leadData.status = row.data.status.toLowerCase();
        }
        if (row.data.medical_notes) {
          leadData.has_medical_conditions = true;
          leadData.medical_notes = row.data.medical_notes;
        }

        if (matchId) {
          const { error } = await supabase.from('leads').update(leadData).eq('id', matchId);
          if (error) throw error;
          importResult.updated++;
        } else {
          if (!leadData.status) leadData.status = 'new';
          const { error } = await supabase.from('leads').insert(leadData as any);
          if (error) throw error;
          importResult.created++;
        }
      } catch (err: any) {
        importResult.failed++;
        importResult.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
      }
    }

    logActivity({
      event_type: 'lead_bulk_import',
      activity: `Imported ${importResult.created} new, ${importResult.updated} updated, ${importResult.failed} failed from ${fileName}`,
      entity_type: 'lead',
    });

    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setResult(importResult);
    setStep('done');
  }, [csvRows, csvHeaders, mapping, fileName, queryClient]);

  const downloadErrors = () => {
    if (!result || result.errors.length === 0) return;
    const cols: CsvColumn<typeof result.errors[0]>[] = [
      { key: 'row', header: 'Row', accessor: r => r.row },
      { key: 'reason', header: 'Error', accessor: r => r.reason },
      { key: 'first_name', header: 'First Name', accessor: r => r.data.first_name || '' },
      { key: 'phone', header: 'Phone', accessor: r => r.data.phone || '' },
    ];
    exportToCsv(result.errors, cols, 'lead-import-errors');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('leads.import.title')}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('leads.import.dropOrClick')}</p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadLeadTemplate('minimal')}>
                <Download className="h-3 w-3 mr-1" />
                {t('leads.import.minimalTemplate')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadLeadTemplate('full')}>
                <Download className="h-3 w-3 mr-1" />
                {t('leads.import.fullTemplate')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('leads.import.mappingDesc')} ({csvRows.length} rows)
            </p>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {csvHeaders.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate font-mono">{header}</span>
                    <span className="text-muted-foreground">→</span>
                    <Select value={mapping[idx] || '__skip__'} onValueChange={(v) => setMapping(prev => ({ ...prev, [idx]: v }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_FIELDS.map(f => (
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

        {/* Step 3: Preview */}
        {step === 'preview' && (() => {
          const validCount = previewRows.filter(r => r.errors.length === 0).length;
          const errorCount = previewRows.filter(r => r.errors.length > 0).length;
          return (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Badge variant="outline" className="text-emerald-600">✓ {validCount} valid</Badge>
                {errorCount > 0 && <Badge variant="outline" className="text-destructive">✗ {errorCount} errors</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">Showing first 20 of {csvRows.length}</span>
              </div>
              <ScrollArea className="h-[300px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Row</th>
                      <th className="text-left p-1">Name</th>
                      <th className="text-left p-1">Phone</th>
                      <th className="text-left p-1">Email</th>
                      <th className="text-left p-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map(row => (
                      <tr key={row.rowIndex} className={row.errors.length > 0 ? 'bg-destructive/10' : ''}>
                        <td className="p-1">{row.rowIndex}</td>
                        <td className="p-1">{row.data.first_name} {row.data.last_name}</td>
                        <td className="p-1">{row.data.phone || '-'}</td>
                        <td className="p-1">{row.data.email || '-'}</td>
                        <td className="p-1">
                          {row.errors.length > 0 ? (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {row.errors[0]}
                            </span>
                          ) : (
                            <span className="text-emerald-600">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>{t('common.back')}</Button>
                <Button onClick={doImport}>{t('leads.import.startImport')}</Button>
              </div>
            </div>
          );
        })()}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <div className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">{t('leads.import.importing')}</p>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && result && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
              <p className="text-lg font-medium">{t('leads.import.complete')}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">{t('leads.import.created')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">{t('leads.import.updated')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                <p className="text-xs text-muted-foreground">{t('leads.import.failed')}</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadErrors} className="w-full">
                <Download className="h-3 w-3 mr-1" />
                {t('leads.import.downloadErrors')}
              </Button>
            )}
            <Button onClick={handleClose} className="w-full">{t('common.done')}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
