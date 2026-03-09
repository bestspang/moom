import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { detectSurface } from '@/apps/shared/hostname';
import { getRedirectResult } from '@/apps/shared/SurfaceGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DiagnosticsAuthPage: React.FC = () => {
  const { user, session, role, accessLevel, staffStatus, loading, allRoles } = useAuth();
  const [identityMapData, setIdentityMapData] = useState<any[]>([]);
  const [identityLoading, setIdentityLoading] = useState(false);
  const surface = detectSurface();

  useEffect(() => {
    if (!user) return;
    setIdentityLoading(true);
    supabase
      .from('identity_map')
      .select('*')
      .eq('experience_user_id', user.id)
      .then(({ data, error }) => {
        if (!error && data) setIdentityMapData(data);
        setIdentityLoading(false);
      });
  }, [user]);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono text-foreground text-right max-w-[60%] truncate">{value ?? '—'}</span>
    </div>
  );

  const identities = user?.identities ?? [];

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground">Auth Diagnostics</h1>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Surface</CardTitle></CardHeader>
        <CardContent>
          <Row label="Detected surface" value={<Badge variant="outline">{surface}</Badge>} />
          <Row label="Hostname" value={window.location.hostname} />
          <Row label="Origin" value={window.location.origin} />
          <Row label="Redirect result for /" value={getRedirectResult('/')} />
          <Row label="Redirect result for /member" value={getRedirectResult('/member')} />
          <Row label="Redirect result for /signup" value={getRedirectResult('/signup')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Session</CardTitle></CardHeader>
        <CardContent>
          <Row label="Loading" value={loading ? 'true' : 'false'} />
          <Row label="Authenticated" value={user ? 'Yes' : 'No'} />
          <Row label="User ID" value={user?.id} />
          <Row label="Email" value={user?.email} />
          <Row label="Provider" value={user?.app_metadata?.provider} />
          <Row label="Email verified" value={user?.email_confirmed_at ? 'Yes' : 'No'} />
          <Row label="Session expires" value={session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Provider Identities</CardTitle></CardHeader>
        <CardContent>
          {identities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No identities</p>
          ) : (
            identities.map((id: any) => (
              <div key={id.id} className="border border-border rounded p-2 mb-2 space-y-1">
                <Row label="Provider" value={<Badge variant="secondary">{id.provider}</Badge>} />
                <Row label="Identity ID" value={id.id} />
                <Row label="Email" value={id.identity_data?.email} />
                <Row label="Created" value={id.created_at ? new Date(id.created_at).toLocaleString() : null} />
                <Row label="Last sign in" value={id.last_sign_in_at ? new Date(id.last_sign_in_at).toLocaleString() : null} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Roles & Access</CardTitle></CardHeader>
        <CardContent>
          <Row label="Primary role" value={role ? <Badge>{role}</Badge> : null} />
          <Row label="Access level" value={accessLevel} />
          <Row label="Staff status" value={staffStatus} />
          <Row label="All roles" value={
            allRoles && allRoles.length > 0
              ? allRoles.map(r => <Badge key={r} variant="secondary" className="mr-1">{r}</Badge>)
              : '—'
          } />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Identity Map</CardTitle></CardHeader>
        <CardContent>
          {identityLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : identityMapData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No identity_map entries for this user</p>
          ) : (
            identityMapData.map((row) => (
              <div key={row.id} className="border border-border rounded p-2 mb-2 space-y-1">
                <Row label="Entity type" value={row.entity_type} />
                <Row label="Admin entity ID (member)" value={row.admin_entity_id} />
                <Row label="Shared identifier" value={row.shared_identifier} />
                <Row label="Verified" value={row.is_verified ? 'Yes' : 'No'} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">User Metadata</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(user?.user_metadata, null, 2) ?? 'null'}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticsAuthPage;
