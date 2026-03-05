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

export type ImportStep = 'select' | 'upload' | 'mapping' | 'enum-mapping' | 'preview' | 'importing' | 'done';

export type EntityId = 'members' | 'leads' | 'packages' | 'staff' | 'promotions' | 'finance' | 'slips' | 'classes' | 'workouts';

/** Defines an enum field that can appear in CSV data and needs normalization */
export interface EnumFieldDef {
  /** The target field value (key in mapped data) */
  field: string;
  /** Human-readable label */
  label: string;
  /** Valid enum options: value → display label */
  options: { value: string; label: string }[];
  /** Normalizer function: returns valid value or null if unrecognized */
  normalize: (raw: string) => string | null;
}

export interface EntityConfig {
  id: EntityId;
  headerAliases: Record<string, string>;
  targetFields: { value: string; label: string; required?: boolean }[];
  templateHeaders: string[];
  fullTemplateHeaders?: string[];
  /** Enum fields that support interactive mapping for unrecognized values */
  enumFields?: EnumFieldDef[];
  validateRow: (data: Record<string, string>) => string[];
  upsertRows: (
    rows: ImportRow[],
    queryClient: QueryClient,
    setProgress: (pct: number) => void,
    options?: { overwrite?: boolean; defaultLocationId?: string; enumOverrides?: Record<string, Record<string, string>> },
  ) => Promise<ImportResult>;
  queryKeysToInvalidate: string[][];
}
