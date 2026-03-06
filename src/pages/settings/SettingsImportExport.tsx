import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, UserPlus, Package, Tag, Shield, BookOpen, Dumbbell, DollarSign,
  Download, Upload, FileDown, Loader2, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { exportToCsv, exportMembers, exportLeads } from '@/lib/exportCsv';
import type { ExportableMember, ExportableLead, CsvColumn } from '@/lib/exportCsv';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import BulkImportDropZone from '@/components/settings/BulkImportDropZone';
import { ImportCenterDialog } from '@/components/import/ImportCenterDialog';
import type { EntityId } from '@/lib/importer';

interface ModuleConfig {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  hasExport: boolean;
  hasImport: boolean;
  importEntity?: EntityId;
  templateHeaders: string[];
}

const modules: ModuleConfig[] = [
  {
    id: 'members', icon: Users, labelKey: 'members',
    hasExport: true, hasImport: true, importEntity: 'members',
    templateHeaders: ['first_name','last_name','nickname','gender','date_of_birth','phone','email','status','source','notes'],
  },
  {
    id: 'leads', icon: UserPlus, labelKey: 'leads',
    hasExport: true, hasImport: true, importEntity: 'leads',
    templateHeaders: ['first_name','last_name','nickname','gender','date_of_birth','phone','email','status','source','temperature','notes'],
  },
  {
    id: 'packages', icon: Package, labelKey: 'packages',
    hasExport: true, hasImport: true, importEntity: 'packages',
    templateHeaders: ['name_en','name_th','type','term_days','sessions','price','categories','access_locations','sold_at','date_modified','status'],
  },
  {
    id: 'promotions', icon: Tag, labelKey: 'promotions',
    hasExport: true, hasImport: true, importEntity: 'promotions',
    templateHeaders: ['name','type','promo_code','discount','started_on','ending_on','date_modified','status'],
  },
  {
    id: 'staff', icon: Shield, labelKey: 'staff',
    hasExport: true, hasImport: true, importEntity: 'staff',
    templateHeaders: ['Firstname','Lastname','Nickname','Role','Gender','Birthdate','Email','Phone','Address','Branch','Status'],
  },
  {
    id: 'finance', icon: DollarSign, labelKey: 'finance',
    hasExport: true, hasImport: true, importEntity: 'finance',
    templateHeaders: ['Date & Time','Transaction no.','Order name','Type','Sold to','Register location','Price including vat','Payment method','Status'],
  },
  {
    id: 'classes', icon: BookOpen, labelKey: 'classes',
    hasExport: true, hasImport: true, importEntity: 'classes' as EntityId,
    templateHeaders: ['name','name_th','type','level','duration','status','description'],
  },
  {
    id: 'workouts', icon: Dumbbell, labelKey: 'workouts',
    hasExport: true, hasImport: true, importEntity: 'workouts' as EntityId,
    templateHeaders: ['name','is_active','items_count'],
  },
  {
    id: 'slips', icon: Receipt, labelKey: 'slips',
    hasExport: false, hasImport: true, importEntity: 'slips' as EntityId,
    templateHeaders: ['Transaction no.','Slip file url','Slip amount','Slip datetime','Sender bank','Sender last4','Status','Review note'],
  },
];

const SettingsImportExport = () => {
  const { t } = useLanguage();
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importEntity, setImportEntity] = useState<EntityId | undefined>(undefined);
  const [importFile, setImportFile] = useState<File | undefined>(undefined);

  const handleBulkImportStart = (file: File, module: 'members' | 'leads' | 'packages' | 'staff' | 'promotions' | 'finance') => {
    setImportFile(file);
    setImportEntity(module);
    setImportOpen(true);
  };

  const handleImportClose = (open: boolean) => {
    setImportOpen(open);
    if (!open) { setImportFile(undefined); setImportEntity(undefined); }
  };

  const handleImport = (moduleId: string, entity?: EntityId) => {
    setImportEntity(entity);
    setImportFile(undefined);
    setImportOpen(true);
  };

  const downloadTemplate = (mod: ModuleConfig) => {
    const csv = mod.templateHeaders.map(h => `"${h}"`).join(',');
    const blob = new Blob(['\ufeff' + csv + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mod.id}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('settings.importExport.templateDownloaded'));
  };

  const handleExport = async (moduleId: string) => {
    setLoadingExport(moduleId);
    try {
      switch (moduleId) {
        case 'members': {
          const { data, error } = await supabase
            .from('members')
            .select('*, register_location:locations!members_register_location_id_fkey(id, name)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const mapped: ExportableMember[] = (data || []).map((m: any) => ({
            member_id: m.member_id, first_name: m.first_name, last_name: m.last_name,
            nickname: m.nickname, gender: m.gender, date_of_birth: m.date_of_birth,
            phone: m.phone, email: m.email, line_id: m.line_id,
            register_location_id: m.register_location_id,
            register_location_name: m.register_location?.name ?? null,
            status: m.status, member_since: m.member_since,
            address_1: m.address_1, address_2: m.address_2,
            subdistrict: m.subdistrict, district: m.district,
            province: m.province, postal_code: m.postal_code,
            emergency_first_name: m.emergency_first_name, emergency_last_name: m.emergency_last_name,
            emergency_phone: m.emergency_phone, emergency_relationship: m.emergency_relationship,
            has_medical_conditions: m.has_medical_conditions ?? false, medical_notes: m.medical_notes,
            allow_physical_contact: m.allow_physical_contact ?? false,
            source: m.source, notes: m.notes,
          }));
          exportMembers(mapped);
          break;
        }
        case 'leads': {
          const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          exportLeads((data || []) as ExportableLead[]);
          break;
        }
        case 'packages': {
          const [pkgRes, locRes] = await Promise.all([
            supabase.from('packages').select('*').order('created_at', { ascending: false }),
            supabase.from('locations').select('id, name'),
          ]);
          if (pkgRes.error) throw pkgRes.error;
          const pkgs = pkgRes.data || [];
          const locMap = new Map((locRes.data || []).map((l: any) => [l.id, l.name]));
          const idMap = new Map(pkgs.map((p: any, i: number) => [p.id, `PKG-${String(i + 1).padStart(5, '0')}`]));
          const resolveLocations = (r: any) => {
            if (r.all_locations) return 'All';
            if (!r.access_locations?.length) return '-';
            return r.access_locations.map((id: string) => locMap.get(id) || id).join(', ');
          };
          const resolveCategories = (r: any) => {
            if (r.all_categories) return 'All';
            if (!r.categories?.length) return '-';
            return r.categories.join(', ');
          };
          const cols: CsvColumn<any>[] = [
            { key: 'id', header: 'ID', accessor: r => idMap.get(r.id) ?? r.id },
            { key: 'name_en', header: 'name_en', accessor: r => r.name_en },
            { key: 'name_th', header: 'name_th', accessor: r => r.name_th },
            { key: 'type', header: 'type', accessor: r => r.type },
            { key: 'price', header: 'price', accessor: r => r.price },
            { key: 'sessions', header: 'sessions', accessor: r => r.sessions ?? '-' },
            { key: 'expiration_days', header: 'expiration_days', accessor: r => r.expiration_days },
            { key: 'term_days', header: 'term_days', accessor: r => r.term_days },
            { key: 'categories', header: 'Categories', accessor: r => resolveCategories(r) },
            { key: 'access_locations', header: 'Access locations', accessor: r => resolveLocations(r) },
            { key: 'sold_at', header: 'Sold at', accessor: r => resolveLocations(r) },
            { key: 'date_modified', header: 'Date modified', accessor: r => r.updated_at ? format(new Date(r.updated_at), 'd MMM yyyy').toUpperCase() : '-' },
            { key: 'status', header: 'status', accessor: r => r.status ?? 'drafts' },
          ];
          exportToCsv(pkgs, cols, `packages-export-${new Date().toISOString().split('T')[0]}`);
          break;
        }
        case 'promotions': {
          const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const fmtDate = (d: string | null) => d ? format(new Date(d), 'd MMM yyyy').toUpperCase() : '-';
          const getExportDiscount = (r: any): string => {
            if (!r.same_discount_all_packages) return 'Varies';
            const mode = r.discount_mode || r.discount_type;
            if (mode === 'percentage') return `${r.percentage_discount ?? r.discount_value}%`;
            return `${Number(r.flat_rate_discount ?? r.discount_value)}฿`;
          };
          const cols: CsvColumn<any>[] = [
            { key: 'name', header: 'Name', accessor: r => r.name },
            { key: 'type', header: 'Type', accessor: r => r.type === 'promo_code' ? 'Promo code' : 'Discount' },
            { key: 'promo_code', header: 'Promo code', accessor: r => r.promo_code || '-' },
            { key: 'discount', header: 'Discount', accessor: r => getExportDiscount(r) },
            { key: 'start_date', header: 'Started on', accessor: r => fmtDate(r.start_date) },
            { key: 'end_date', header: 'Ending on', accessor: r => fmtDate(r.end_date) },
            { key: 'date_modified', header: 'Date modified', accessor: r => fmtDate(r.updated_at) },
            { key: 'status', header: 'Status', accessor: r => r.status ?? 'drafts' },
          ];
          exportToCsv(data || [], cols, `promotions-export-${new Date().toISOString().split('T')[0]}`);
          break;
        }
        case 'staff': {
          const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const cols: CsvColumn<any>[] = [
            { key: 'first_name', header: 'first_name', accessor: r => r.first_name },
            { key: 'last_name', header: 'last_name', accessor: r => r.last_name },
            { key: 'nickname', header: 'nickname', accessor: r => r.nickname },
            { key: 'email', header: 'email', accessor: r => r.email },
            { key: 'phone', header: 'phone', accessor: r => r.phone },
            { key: 'status', header: 'status', accessor: r => r.status },
          ];
          exportToCsv(data || [], cols, `staff-export-${new Date().toISOString().split('T')[0]}`);
          break;
        }
        case 'classes': {
          const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const cols: CsvColumn<any>[] = [
            { key: 'name', header: 'name', accessor: r => r.name },
            { key: 'name_th', header: 'name_th', accessor: r => r.name_th },
            { key: 'type', header: 'type', accessor: r => r.type },
            { key: 'level', header: 'level', accessor: r => r.level },
            { key: 'duration', header: 'duration', accessor: r => r.duration },
            { key: 'status', header: 'status', accessor: r => r.status },
            { key: 'description', header: 'description', accessor: r => r.description },
          ];
          exportToCsv(data || [], cols, `classes-export-${new Date().toISOString().split('T')[0]}`);
          break;
        }
        case 'workouts': {
          const { data, error } = await supabase
            .from('training_templates')
            .select('*, workout_items(id)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const cols: CsvColumn<any>[] = [
            { key: 'name', header: 'name', accessor: r => r.name },
            { key: 'is_active', header: 'is_active', accessor: r => r.is_active ? 'true' : 'false' },
            { key: 'items_count', header: 'items_count', accessor: r => r.workout_items?.length ?? 0 },
          ];
          exportToCsv(data || [], cols, `workouts-export-${new Date().toISOString().split('T')[0]}`);
          break;
        }
        case 'finance': {
          const { data, error } = await supabase
            .from('transactions')
            .select('*, member:members(first_name, last_name), location:locations(name), staff:staff(first_name, last_name)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const fmtPayment = (m: string | null) => {
            const map: Record<string, string> = { cash: 'Cash', credit_card: 'Credit Card', bank_transfer: 'Bank Transfer', promptpay: 'QR PromptPay' };
            return m ? (map[m] || m) : '-';
          };
          const cols: CsvColumn<any>[] = [
            { key: 'dateTime', header: 'Date & Time', accessor: r => format(new Date(r.created_at), 'd MMM yyyy, HH:mm').toUpperCase() },
            { key: 'transactionId', header: 'Transaction no.', accessor: r => r.transaction_id },
            { key: 'orderName', header: 'Order name', accessor: r => r.order_name },
            { key: 'type', header: 'Type', accessor: r => r.type || '-' },
            { key: 'soldTo', header: 'Sold to', accessor: r => r.member ? `${r.member.first_name} ${r.member.last_name}` : '-' },
            { key: 'registerLocation', header: 'Register location', accessor: r => r.location?.name || '-' },
            { key: 'priceExclVat', header: 'Price excluding vat', accessor: r => (Number(r.amount) / 1.07).toFixed(2) },
            { key: 'vat', header: 'VAT @7%', accessor: r => (Number(r.amount) - Number(r.amount) / 1.07).toFixed(2) },
            { key: 'priceInclVat', header: 'Price including vat', accessor: r => Number(r.amount).toFixed(2) },
            { key: 'soldAt', header: 'Sold at', accessor: r => r.location?.name || '-' },
            { key: 'paymentMethod', header: 'Payment method', accessor: r => fmtPayment(r.payment_method) },
            { key: 'taxInvoice', header: 'Tax invoice no.', accessor: r => r.tax_invoice_url || '-' },
            { key: 'status', header: 'Status', accessor: r => r.status || '-' },
            { key: 'staff', header: 'Staff', accessor: r => r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : '-' },
          ];
          exportToCsv(data || [], cols, `finance-export-${new Date().toISOString().split('T')[0]}`);
          break;
        }
      }
      toast.success(t('settings.importExport.exportSuccess'));
    } catch (err) {
      console.error('Export error:', err);
      toast.error(t('settings.importExport.exportError'));
    } finally {
      setLoadingExport(null);
    }
  };

  const getModuleLabel = (mod: ModuleConfig) => {
    const labels: Record<string, string> = {
      members: t('nav.members'), leads: t('nav.leads'), packages: t('nav.packages'),
      promotions: t('nav.promotions'), staff: t('nav.staff'), finance: t('nav.finance'),
      classes: t('nav.classList'), workouts: t('nav.workoutList'), slips: t('nav.transferSlips'),
    };
    return labels[mod.id] || mod.id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('settings.importExport.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('settings.importExport.description')}</p>
      </div>

      <BulkImportDropZone onStartImport={handleBulkImportStart} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isExporting = loadingExport === mod.id;
          return (
            <Card key={mod.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm">{getModuleLabel(mod)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full justify-start" disabled={isExporting} onClick={() => handleExport(mod.id)}>
                  {isExporting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                  {t('settings.importExport.exportCsv')}
                </Button>
                {mod.hasImport ? (
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleImport(mod.id, mod.importEntity)}>
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    {t('settings.importExport.importCsv')}
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start opacity-50 cursor-not-allowed" disabled>
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        {t('settings.importExport.importCsv')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('settings.importExport.comingSoon')}</TooltipContent>
                  </Tooltip>
                )}
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => downloadTemplate(mod)}>
                  <FileDown className="mr-2 h-3.5 w-3.5" />
                  {t('settings.importExport.downloadTemplate')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ImportCenterDialog
        open={importOpen}
        onOpenChange={handleImportClose}
        presetEntity={importEntity}
        initialFile={importFile}
      />
    </div>
  );
};

export default SettingsImportExport;
