export { parseCsv, parseCsvLine, downloadCsvTemplate } from './csvParser';
export type { ImportRow, ImportResult, ImportStep, EntityId, EntityConfig } from './types';

import { membersConfig } from './entityConfigs/members';
import { leadsConfig } from './entityConfigs/leads';
import { packagesConfig } from './entityConfigs/packages';
import { staffConfig } from './entityConfigs/staff';
import { promotionsConfig } from './entityConfigs/promotions';
import { financeConfig } from './entityConfigs/finance';
import type { EntityConfig, EntityId } from './types';

export const ENTITY_CONFIGS: Record<EntityId, EntityConfig> = {
  members: membersConfig,
  leads: leadsConfig,
  packages: packagesConfig,
  staff: staffConfig,
  promotions: promotionsConfig,
  finance: financeConfig,
  slips: {
    id: 'slips',
    headerAliases: {},
    targetFields: [],
    templateHeaders: ['transaction_no', 'slip_file_url', 'slip_amount', 'slip_datetime', 'sender_bank', 'sender_last4', 'status', 'review_note'],
    validateRow: () => ['Slips import not yet supported'],
    upsertRows: async () => ({ created: 0, updated: 0, failed: 0, errors: [] }),
    queryKeysToInvalidate: [],
  },
};

export { membersConfig, leadsConfig, packagesConfig, staffConfig, promotionsConfig, financeConfig };
