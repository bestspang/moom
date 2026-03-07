import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  sortable?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyVariant?: 'default' | 'members' | 'schedule' | 'packages' | 'finance' | 'notifications' | 'notes' | 'workouts' | 'locations' | 'activity';
}

export function DataTable<T>({
  columns,
  data,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  pagination,
  onPageChange,
  onRowClick,
  rowKey,
  isLoading = false,
  emptyMessage,
  emptyVariant = 'default',
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const allSelected = data.length > 0 && selectedRows.length === data.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage || t('common.noData')} variant={emptyVariant} />;
  }

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.perPage)
    : 1;

  return (
    <div>
      {/* Mobile scroll hint */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-muted/30 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="min-w-[600px] md:min-w-0">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header hover:bg-table-header">
                    {selectable && (
                      <TableHead className="w-12 text-table-header-foreground">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={onSelectAll}
                        />
                      </TableHead>
                    )}
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          'text-table-header-foreground font-semibold whitespace-nowrap',
                          column.className
                        )}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => {
                    const id = rowKey(row);
                    const isSelected = selectedRows.includes(id);

                    return (
                      <TableRow
                        key={id}
                        className={cn(
                          onRowClick && 'cursor-pointer',
                          isSelected && 'bg-accent'
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {selectable && (
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            className="w-12"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onSelectRow?.(id)}
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell key={column.key} className={cn('whitespace-nowrap', column.className)}>
                            {column.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        {/* Mobile scroll indicator gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {(pagination.page - 1) * pagination.perPage + 1}-
            {Math.min(pagination.page * pagination.perPage, pagination.total)} {t('common.of')}{' '}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {pagination.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
