import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
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
  'address': 'address', 'ที่อยู่': 'address',
  'medical conditions': 'medical_notes', 'medical_notes': 'medical_notes',
  'joined date': 'member_since', 'joined_date': 'member_since', 'member_since': 'member_since',
  'member_id': 'member_id', 'id': 'member_id',
  'status': 'status',
  'notes': 'notes',
  'source': 'source',
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
  { value: 'address', label: 'Address' },
  { value: 'medical_notes', label: 'Medical Conditions' },
  { value: 'member_since', label: 'Joined Date' },
  { value: 'member_id', label: 'Member ID' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Source' },
];

// ── Date Parsing ──

function parseDate(val: string): string | null {
  if (!val) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // DD/MM/YYYY
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
  action?: 'create' | 'update';
  matchedId?: string;
}

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: { row: number; reason: string; data: Record<string, string> }[];
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

// ── Templates ──

function downloadTemplate(type: 'minimal' | 'full') {
  const minHeaders = ['Firstname', 'Lastname', 'Nickname', 'Gender', 'Birthdate', 'Phone', 'Joined Date', 'Address', 'Medical Conditions'];
  const fullHeaders = ['member_id', 'first_name', 'last_name', 'nickname', 'gender', 'date_of_birth', 'phone', 'email', 'address', 'member_since', 'status', 'notes', 'source'];
  const headers = type === 'minimal' ? minHeaders : fullHeaders;
  const csv = headers.map(h => `"${h}"`).join(',') + '\n';
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `members-template-${type}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Component ──

interface ImportMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportMembersDialog = ({ open, onOpenChange }: ImportMembersDialogProps) => {
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

  const reset = () => {
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
    reset();
    onOpenChange(false);
  };

  // Step 1: Upload
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map
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

  // Step 2 → 3: Build preview
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
      if (!data.last_name) errors.push('Missing last name');
      if (!data.phone && !data.email) errors.push('Need phone or email');
      if (data.date_of_birth && !parseDate(data.date_of_birth)) errors.push('Invalid date of birth');
      if (data.member_since && !parseDate(data.member_since)) errors.push('Invalid joined date');
      if (data.gender && !normalizeGender(data.gender)) errors.push('Invalid gender');

      return { rowIndex: idx + 2, data, errors };
    });
    setPreviewRows(rows);
    setStep('preview');
  }, [csvRows, csvHeaders, mapping]);

  // Step 4: Import
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
      if (!data.last_name) errors.push('Missing last name');
      if (!data.phone && !data.email) errors.push('Need phone or email');
      return { rowIndex: idx + 2, data, errors };
    });

    const validRows = allRows.filter(r => r.errors.length === 0);
    const invalidRows = allRows.filter(r => r.errors.length > 0);

    const importResult: ImportResult = {
      created: 0, updated: 0, failed: invalidRows.length,
      errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
    };

    // Fetch existing members for dedup
    const { data: existingMembers } = await supabase
      .from('members')
      .select('id, member_id, phone, email');
    const byMemberId = new Map<string, string>();
    const byPhone = new Map<string, string>();
    const byEmail = new Map<string, string>();
    for (const m of existingMembers || []) {
      if (m.member_id) byMemberId.set(m.member_id.toLowerCase(), m.id);
      if (m.phone) byPhone.set(m.phone, m.id);
      if (m.email) byEmail.set(m.email.toLowerCase(), m.id);
    }

    // Get next member_id
    const { data: lastMember } = await supabase
      .from('members')
      .select('member_id')
      .order('created_at', { ascending: false })
      .limit(1);
    let nextNum = 1;
    if (lastMember?.[0]?.member_id) {
      nextNum = parseInt(lastMember[0].member_id.replace('M-', ''), 10) + 1;
    }

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress(Math.round(((i + 1) / validRows.length) * 100));

      try {
        // Find match
        let matchId: string | undefined;
        if (row.data.member_id) matchId = byMemberId.get(row.data.member_id.toLowerCase());
        if (!matchId && row.data.phone) matchId = byPhone.get(row.data.phone);
        if (!matchId && row.data.email) matchId = byEmail.get(row.data.email.toLowerCase());

        const memberData: Record<string, any> = {
          first_name: row.data.first_name,
          last_name: row.data.last_name,
        };

        if (row.data.nickname) memberData.nickname = row.data.nickname;
        if (row.data.phone) memberData.phone = row.data.phone;
        if (row.data.email) memberData.email = row.data.email;
        if (row.data.address) memberData.address = row.data.address;
        if (row.data.notes) memberData.notes = row.data.notes;
        if (row.data.source) memberData.source = row.data.source;
        if (row.data.gender) {
          const g = normalizeGender(row.data.gender);
          if (g) memberData.gender = g;
        }
        if (row.data.date_of_birth) {
          const d = parseDate(row.data.date_of_birth);
          if (d) memberData.date_of_birth = d;
        }
        if (row.data.member_since) {
          const d = parseDate(row.data.member_since);
          if (d) memberData.member_since = d;
        }
        if (row.data.status && ['active', 'inactive', 'suspended', 'on_hold'].includes(row.data.status.toLowerCase())) {
          memberData.status = row.data.status.toLowerCase();
        }
        if (row.data.medical_notes) {
          memberData.medical = { has_medical_conditions: true, medical_notes: row.data.medical_notes };
        }

        if (matchId) {
          // Update
          const { error } = await supabase.from('members').update(memberData).eq('id', matchId);
          if (error) throw error;
          importResult.updated++;
        } else {
          // Create
          const newMemberId = row.data.member_id || `M-${String(nextNum++).padStart(7, '0')}`;
          memberData.member_id = newMemberId;
          if (!memberData.status) memberData.status = 'active';
          const { error } = await supabase.from('members').insert(memberData as any);
          if (error) throw error;
          importResult.created++;
        }
      } catch (err: any) {
        importResult.failed++;
        importResult.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
      }
    }

    // Activity log
    logActivity({
      event_type: 'member_bulk_import',
      activity: `Imported ${importResult.created} new, ${importResult.updated} updated, ${importResult.failed} failed from ${fileName}`,
      entity_type: 'member',
    });

    // Invalidate
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['member-stats'] });
    queryClient.invalidateQueries({ queryKey: ['members-enrichment'] });

    setResult(importResult);
    setStep('done');
  }, [csvRows, csvHeaders, mapping, fileName, queryClient]);

  const downloadErrors = () => {
    if (!result || result.errors.length === 0) return;
    const cols: CsvColumn<typeof result.errors[0]>[] = [
      { key: 'row', header: 'Row', accessor: r => r.row },
      { key: 'reason', header: 'Error', accessor: r => r.reason },
      { key: 'first_name', header: 'First Name', accessor: r => r.data.first_name || '' },
      { key: 'last_name', header: 'Last Name', accessor: r => r.data.last_name || '' },
      { key: 'phone', header: 'Phone', accessor: r => r.data.phone || '' },
    ];
    exportToCsv(result.errors, cols, 'import-errors');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('members.import.title')}</DialogTitle>
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
              <p className="text-sm text-muted-foreground">{t('members.import.dropOrClick')}</p>
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
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('minimal')}>
                <Download className="h-3 w-3 mr-1" />
                {t('members.import.minimalTemplate')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('full')}>
                <Download className="h-3 w-3 mr-1" />
                {t('members.import.fullTemplate')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('members.import.mappingDesc')} ({csvRows.length} rows)
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
          const totalErrorCount = csvRows.length - csvRows.slice(0, 20).filter((_, idx) => previewRows[idx]?.errors.length === 0).length;
          const allErrors = csvRows.length > 0 && validCount === 0 && errorCount === previewRows.length;

          return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('members.import.previewDesc')} (showing {previewRows.length} of {csvRows.length})
            </p>

            {/* Summary banner */}
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                {validCount} valid
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errorCount} with errors
                </div>
              )}
            </div>

            <ScrollArea className="h-[300px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-1.5 text-left w-12">Row</th>
                    <th className="p-1.5 text-left">Name</th>
                    <th className="p-1.5 text-left">Contact</th>
                    <th className="p-1.5 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.rowIndex} className={`border-b ${row.errors.length > 0 ? 'bg-red-50/50 dark:bg-red-950/30' : ''}`}>
                      <td className="p-1.5">{row.rowIndex}</td>
                      <td className="p-1.5">{row.data.first_name} {row.data.last_name}</td>
                      <td className="p-1.5 font-mono">{row.data.phone || row.data.email || '-'}</td>
                      <td className="p-1.5">
                        {row.errors.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.errors.map((err, i) => (
                              <Badge key={i} variant="destructive" className="text-[10px]">{err}</Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            {errorCount > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {allErrors ? 'All rows have errors. Fix your CSV and try again.' : `${errorCount} rows will be skipped during import.`}
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>{t('common.back')}</Button>
              <Button onClick={doImport} disabled={allErrors}>
                {t('members.import.startImport')}
              </Button>
            </div>
          </div>
          );
        })()}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <p className="text-sm text-center text-muted-foreground">{t('members.import.importing')}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('members.import.complete')}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">{t('members.import.created')}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">{t('members.import.updated')}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-xs text-muted-foreground">{t('members.import.failed')}</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Failed rows ({result.errors.length})
                </p>
                <ScrollArea className="h-[160px] border rounded-md">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50 sticky top-0">
                        <th className="p-1.5 text-left w-12">Row</th>
                        <th className="p-1.5 text-left">Name</th>
                        <th className="p-1.5 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, 20).map((err, i) => (
                        <tr key={i} className="border-b bg-red-50/30 dark:bg-red-950/20">
                          <td className="p-1.5">{err.row}</td>
                          <td className="p-1.5">{err.data.first_name || ''} {err.data.last_name || ''}</td>
                          <td className="p-1.5 text-destructive">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
                {result.errors.length > 20 && (
                  <p className="text-xs text-muted-foreground">Showing 20 of {result.errors.length} errors</p>
                )}
                <Button variant="outline" size="sm" onClick={downloadErrors}>
                  <Download className="h-3 w-3 mr-1" />
                  {t('members.import.downloadErrors')}
                </Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleClose}>{t('members.import.done')}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
