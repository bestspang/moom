import React, { useState } from 'react';
import { X, Trash2, Download, Copy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatusOption {
  value: string;
  label: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onExport: () => void;
  onDuplicate?: () => void;
  statusOptions: StatusOption[];
  onChangeStatus: (status: string) => void;
  isLoading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onExport,
  onDuplicate,
  statusOptions,
  onChangeStatus,
  isLoading = false,
}: BulkActionBarProps) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border shadow-lg rounded-lg px-4 py-3 animate-in slide-in-from-bottom-4 duration-200">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {selectedCount} {t('bulk.selected')}
        </span>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Change Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              {t('bulk.changeStatus')}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {statusOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => onChangeStatus(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading}>
          <Download className="h-3.5 w-3.5 mr-1" />
          {t('bulk.exportSelected')}
        </Button>

        {/* Duplicate */}
        {onDuplicate && (
          <Button variant="outline" size="sm" onClick={onDuplicate} disabled={isLoading}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            {t('bulk.duplicate')}
          </Button>
        )}

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          {t('common.delete')}
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Clear */}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulk.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {`${selectedCount} ${t('bulk.deleteDesc')}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
