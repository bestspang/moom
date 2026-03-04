import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EntityAudit {
  name: string;
  table: string;
  totalRows: number;
  requiredFields: { field: string; nullCount: number }[];
  status: 'ok' | 'warning' | 'error';
}

interface SystemCheck {
  name: string;
  description: string;
  status: 'ok' | 'warning' | 'error';
  detail: string;
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
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runAll();
  }, []);

  async function runAll() {
    setLoading(true);
    await Promise.all([runAudit(), runSystemHealthChecks()]);
    setLoading(false);
  }

  async function runAudit() {
    const results: EntityAudit[] = [];

    for (const check of ENTITY_CHECKS) {
      try {
        const { data, error } = await supabase
          .from(check.table as any)
          .select('*')
          .limit(500);

        if (error) {
          results.push({ name: check.name, table: check.table, totalRows: 0, requiredFields: [], status: 'error' });
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
        results.push({ name: check.name, table: check.table, totalRows: 0, requiredFields: [], status: 'error' });
      }
    }

    setAudits(results);
  }

  async function runSystemHealthChecks() {
    const checks: SystemCheck[] = [];

    // 1. At least 1 location exists
    try {
      const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true });
      checks.push({
        name: 'Default Location',
        description: 'At least one location must exist for check-ins and forms to work',
        status: (count ?? 0) > 0 ? 'ok' : 'error',
        detail: (count ?? 0) > 0 ? `${count} location(s) found` : 'No locations — create one in Settings → Locations',
      });
    } catch {
      checks.push({ name: 'Default Location', description: '', status: 'error', detail: 'Failed to query' });
    }

    // 2. At least 1 role exists
    try {
      const { count } = await supabase.from('roles').select('*', { count: 'exact', head: true });
      checks.push({
        name: 'Roles Configured',
        description: 'At least one role must exist for staff position assignment',
        status: (count ?? 0) > 0 ? 'ok' : 'error',
        detail: (count ?? 0) > 0 ? `${count} role(s) found` : 'No roles — create one in Roles',
      });
    } catch {
      checks.push({ name: 'Roles Configured', description: '', status: 'error', detail: 'Failed to query' });
    }

    // 3. User roles table has entries
    try {
      const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
      checks.push({
        name: 'User Role Assignments',
        description: 'Users must have role assignments for access control',
        status: (count ?? 0) > 0 ? 'ok' : 'warning',
        detail: (count ?? 0) > 0 ? `${count} assignment(s)` : 'No user role assignments found',
      });
    } catch {
      checks.push({ name: 'User Role Assignments', description: '', status: 'warning', detail: 'Cannot query (expected for non-master)' });
    }

    // 4. Active classes exist
    try {
      const { count } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'active');
      checks.push({
        name: 'Active Classes',
        description: 'At least one active class for scheduling',
        status: (count ?? 0) > 0 ? 'ok' : 'warning',
        detail: (count ?? 0) > 0 ? `${count} active class(es)` : 'No active classes',
      });
    } catch {
      checks.push({ name: 'Active Classes', description: '', status: 'error', detail: 'Failed to query' });
    }

    // 5. Packages exist
    try {
      const { count } = await supabase.from('packages').select('*', { count: 'exact', head: true });
      checks.push({
        name: 'Packages',
        description: 'At least one package for member subscriptions',
        status: (count ?? 0) > 0 ? 'ok' : 'warning',
        detail: (count ?? 0) > 0 ? `${count} package(s)` : 'No packages configured',
      });
    } catch {
      checks.push({ name: 'Packages', description: '', status: 'error', detail: 'Failed to query' });
    }

    // 6. Realtime coverage (informational)
    const realtimeTables = 34; // Total tables in TABLE_INVALIDATION_MAP
    checks.push({
      name: 'Realtime Sync Coverage',
      description: 'Number of tables monitored for real-time cache invalidation',
      status: 'ok',
      detail: `${realtimeTables} tables subscribed`,
    });

    setSystemChecks(checks);
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">System Diagnostics</h1>
        <p className="text-muted-foreground">Running audit checks...</p>
      </div>
    );
  }

  const okCount = audits.filter((a) => a.status === 'ok').length;
  const warnCount = audits.filter((a) => a.status === 'warning').length;
  const errCount = audits.filter((a) => a.status === 'error').length;

  const healthOk = systemChecks.filter((c) => c.status === 'ok').length;
  const healthWarn = systemChecks.filter((c) => c.status === 'warning').length;
  const healthErr = systemChecks.filter((c) => c.status === 'error').length;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            System health checks and data integrity audit
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Re-run
        </Button>
      </div>

      {/* ── System Health ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">System Health</h2>
        <div className="flex gap-3 mb-4">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" /> {healthOk} Pass
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" /> {healthWarn} Warn
          </Badge>
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3 text-destructive" /> {healthErr} Fail
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {systemChecks.map((check) => (
            <Card key={check.name}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{check.name}</span>
                  <StatusIcon status={check.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{check.description}</p>
                <p className="text-sm mt-1 font-mono">{check.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Data Audit ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Data Audit</h2>
        <div className="flex gap-3 mb-4">
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
      </section>
    </div>
  );
}
