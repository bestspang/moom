import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  /** DS subtitle line shown under the title (preferred). */
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Legacy: shown as "Updated <updatedAt>" if `subtitle` is not provided. */
  updatedAt?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * DS-aligned admin page header.
 * Mirrors `PageHeader` in MOOM Design System/ui_kits/admin/Components.jsx
 * (22px / extrabold / tracking-tight title, 13px muted subtitle, right action slot).
 * Back-compat: `updatedAt` still works when `subtitle` is omitted.
 */
export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  updatedAt,
  actions,
  className,
}: PageHeaderProps) => {
  const resolvedSubtitle =
    subtitle ?? (updatedAt ? `Updated ${updatedAt}` : null);

  return (
    <div className={cn('mb-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link to="/" className="hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4" />
              {item.href ? (
                <Link to={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight leading-tight m-0">
            {title}
          </h1>
          {resolvedSubtitle && (
            <p className="text-[13px] text-muted-foreground mt-1">
              {resolvedSubtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
