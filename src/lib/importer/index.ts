export { parseCsv, parseCsvLine, downloadCsvTemplate } from './csvParser';
export type { ImportRow, ImportResult, ImportStep, EntityId, EntityConfig } from './types';

import { membersConfig } from './entityConfigs/members';
import { leadsConfig } from './entityConfigs/leads';
import { packagesConfig } from './entityConfigs/packages';
import { staffConfig } from './entityConfigs/staff';
import { promotionsConfig } from './entityConfigs/promotions';
import { financeConfig } from './entityConfigs/finance';
import { classesConfig } from './entityConfigs/classes';
import { workoutsConfig } from './entityConfigs/workouts';
import { slipsConfig } from './entityConfigs/slips';
import type { EntityConfig, EntityId } from './types';

export const ENTITY_CONFIGS: Record<EntityId, EntityConfig> = {
  members: membersConfig,
  leads: leadsConfig,
  packages: packagesConfig,
  staff: staffConfig,
  promotions: promotionsConfig,
  finance: financeConfig,
  classes: classesConfig,
  workouts: workoutsConfig,
  slips: slipsConfig,
};

export { membersConfig, leadsConfig, packagesConfig, staffConfig, promotionsConfig, financeConfig, classesConfig, workoutsConfig, slipsConfig };
