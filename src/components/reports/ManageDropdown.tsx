import React from 'react';
import { FileText, Download, Printer, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManageDropdownProps {
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
}

export const ManageDropdown = ({
  onExportCSV,
  onExportPDF,
  onPrint,
}: ManageDropdownProps) => {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-primary text-primary">
          <FileText className="h-4 w-4 mr-2" />
          {t('reports.manage')}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background z-50">
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            {t('reports.exportCSV')}
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            {t('reports.exportPDF')}
          </DropdownMenuItem>
        )}
        {onPrint && (
          <DropdownMenuItem onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('reports.print')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
