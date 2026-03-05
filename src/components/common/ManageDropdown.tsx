import React from 'react';
import { Download, Upload, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManageDropdownProps {
  onExport: () => void;
  onDownloadTemplate: () => void;
  onImport?: () => void;
  exportDisabled?: boolean;
}

export const ManageDropdown = ({
  onExport,
  onDownloadTemplate,
  onImport,
  exportDisabled,
}: ManageDropdownProps) => {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {t('common.manage')}
          <ChevronDown className="h-4 w-4 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background z-50">
        <DropdownMenuItem onClick={onExport} disabled={exportDisabled}>
          <Download className="h-4 w-4 mr-2" />
          {t('common.export')}
        </DropdownMenuItem>
        {onImport && (
          <DropdownMenuItem onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            {t('common.import') || 'Import CSV'}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDownloadTemplate}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t('common.downloadTemplate')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
