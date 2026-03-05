import type { QueryClient } from '@tanstack/react-query';

export interface ImportRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  action?: 'create' | 'update';
  matchedId?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: { row: number; reason: string; data: Record<string, string> }[];
}

export type ImportStep = 'select' | 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

export type EntityId = 'members' | 'leads' | 'packages' | 'staff' | 'promotions' | 'finance' | 'slips';

export interface EntityConfig {
  id: EntityId;
  headerAliases: Record<string, string>;
  targetFields: { value: string; label: string }[];
  templateHeaders: string[];
  fullTemplateHeaders?: string[];
  validateRow: (data: Record<string, string>) => string[];
  upsertRows: (
    rows: ImportRow[],
    queryClient: QueryClient,
    setProgress: (pct: number) => void,
  ) => Promise<ImportResult>;
  queryKeysToInvalidate: string[][];
}
