import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface EntityAudit {
  name: string;
  table: string;
  totalRows: number;
  requiredFields: { field: string; nullCount: number }[];
  status: 'ok' | 'warning' | 'error';
}

const ENTITY_CHECKS = [
  { name: 'Members', table: 'members', required: ['first_name', 'last_name', 'member_id'] },
  { name: 'Staff', table: 'staff', required: ['first_name', 'last_name'] },
  { name: 'Leads', table: 'leads', required: ['first_name'] },
  { name: 'Locations', table: 'locations', required: ['name', 'location_id'] },
  { name: 'Classes', table: 'classes', required: ['name'] },
  { name: 'Rooms', table: 'rooms', required: ['name'] },
  { name: 'Packages', table: 'packages', required: ['name_en', 'price', 'type', 'term_days', 'expiration_days'] },
  { name: 'Promotions', table: 'promotions', required: ['name', 'discount_value'] },
  { name: 'Schedule', table: 'schedule', required: ['class_id', 'scheduled_date', 'start_time', 'end_time'] },
  { name: 'Roles', table: 'roles', required: ['name', 'access_level'] },
  { name: 'Settings', table: 'settings', required: ['section', 'key'] },
];

export default function DiagnosticsDataAudit() {
  const { t } = useLanguage();
  const [audits, setAudits] = useState<EntityAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runAudit();
  }, []);

  async function runAudit() {
    setLoading(true);
    const results: EntityAudit[] = [];

    for (const check of ENTITY_CHECKS) {
      try {
        const { data, error } = await supabase
          .from(check.table as any)
          .select('*')
          .limit(500);

        if (error) {
          results.push({
            name: check.name,
            table: check.table,
            totalRows: 0,
            requiredFields: [],
            status: 'error',
          });
          continue;
        }

        const rows = data || [];
        const requiredFields = check.required.map((field) => {
          const nullCount = rows.filter((r: any) => r[field] === null || r[field] === undefined || r[field] === '').length;
          return { field, nullCount };
        });

        const hasIssues = requiredFields.some((f) => f.nullCount > 0);
        results.push({
          name: check.name,
          table: check.table,
          totalRows: rows.length,
          requiredFields,
          status: hasIssues ? 'warning' : 'ok',
        });
      } catch {
        results.push({
          name: check.name,
          table: check.table,
          totalRows: 0,
          requiredFields: [],
          status: 'error',
        });
      }
    }

    setAudits(results);
    setLoading(false);
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Data Audit</h1>
        <p className="text-muted-foreground">Running audit checks...</p>
      </div>
    );
  }

  const okCount = audits.filter((a) => a.status === 'ok').length;
  const warnCount = audits.filter((a) => a.status === 'warning').length;
  const errCount = audits.filter((a) => a.status === 'error').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Checks required fields for null/empty values across all entities
        </p>
      </div>

      <div className="flex gap-3">
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" /> {okCount} OK
        </Badge>
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-500" /> {warnCount} Warnings
        </Badge>
        <Badge variant="outline" className="gap-1">
          <XCircle className="h-3 w-3 text-destructive" /> {errCount} Errors
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {audits.map((audit) => (
          <Card key={audit.table}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{audit.name}</span>
                <StatusIcon status={audit.status} />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {audit.table} · {audit.totalRows} rows
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {audit.status === 'error' ? (
                <p className="text-sm text-destructive">Failed to query table</p>
              ) : (
                <div className="space-y-1">
                  {audit.requiredFields.map((f) => (
                    <div key={f.field} className="flex justify-between text-sm">
                      <span className="font-mono text-xs">{f.field}</span>
                      {f.nullCount === 0 ? (
                        <span className="text-green-600 text-xs">✓</span>
                      ) : (
                        <span className="text-yellow-600 text-xs">{f.nullCount} null</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
