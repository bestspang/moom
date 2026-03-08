import { useSurface } from '@/apps/shared/SurfaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { isDevEnvironment, getRouteHostAffinity } from '@/apps/shared/hostname';
import { getRedirectResult } from '@/apps/shared/SurfaceGuard';

/** Dev-only diagnostics page. Shows current surface, host, role, and routing info. */
export default function DiagnosticsSurfacePage() {
  const { surface, isMobileFirst } = useSurface();
  const { user, role, accessLevel } = useAuth();
  const location = useLocation();

  const items = [
    { label: 'Hostname', value: window.location.hostname },
    { label: 'Detected Surface', value: surface },
    { label: 'Is Dev Environment', value: String(isDevEnvironment()) },
    { label: 'Mobile-First', value: String(isMobileFirst) },
    { label: 'Current Path', value: location.pathname },
    { label: 'Route Search', value: location.search || '(none)' },
    { label: 'Route Host Affinity', value: getRouteHostAffinity(location.pathname) },
    { label: 'Redirect Logic Result', value: getRedirectResult(location.pathname) },
    { label: 'User ID', value: user?.id ?? '(not logged in)' },
    { label: 'User Email', value: user?.email ?? '(not logged in)' },
    { label: 'Admin Role', value: role ?? '(none)' },
    { label: 'Access Level', value: accessLevel ?? '(none)' },
    { label: 'User Agent', value: navigator.userAgent.slice(0, 80) + '...' },
    { label: 'Screen Width', value: `${window.innerWidth}px` },
    { label: 'Screen Height', value: `${window.innerHeight}px` },
    { label: 'Pixel Ratio', value: String(window.devicePixelRatio) },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-1">Surface Diagnostics</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Developer-only page showing current app surface, hostname, role, and routing info.
      </p>

      <div className="rounded-lg border border-border overflow-hidden">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-start justify-between px-4 py-3 text-sm ${
              i < items.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground text-right ml-4 break-all max-w-[60%]">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-muted/50 p-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">Surface Routing Rules</h2>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li><code className="text-foreground">admin.moom.fit</code> → Admin surface (desktop-first)</li>
          <li><code className="text-foreground">member.moom.fit</code> → Member surface (mobile-first)</li>
          <li><code className="text-foreground">member.moom.fit/trainer/*</code> → Trainer surface</li>
          <li><code className="text-foreground">member.moom.fit/staff/*</code> → Staff surface</li>
          <li><code className="text-foreground">?surface=member|trainer|staff</code> → Dev override</li>
        </ul>
      </div>
    </div>
  );
}
