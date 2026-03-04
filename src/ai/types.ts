import type { Database } from '@/integrations/supabase/types';

type AiRunStatus = Database['public']['Enums']['ai_run_status'];

// --- Action return types ---

export interface DashboardContext {
  date: string;
  checkinsToday: number;
  classesToday: number;
  currentlyInClass: number;
  highRiskMembers: Array<{
    id: string;
    name: string;
    expiryDate: string;
  }>;
}

export interface ScheduleItem {
  id: string;
  className: string;
  trainerName: string | null;
  roomName: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  checkedIn: number | null;
  status: string | null;
}

export interface ScheduleContext {
  date: string;
  locationId: string | null;
  items: ScheduleItem[];
}

export interface MemberPackageSummary {
  id: string;
  packageName: string;
  sessionsRemaining: number | null;
  expiryDate: string | null;
  status: string | null;
}

export interface MemberContext {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  riskLevel: string | null;
  memberSince: string | null;
  activePackages: MemberPackageSummary[];
}

// --- AI Service types ---

export interface AiRunMeta {
  actorUserId: string;
  promptTemplateId?: string;
  scopeLocationId?: string;
  model?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  latencyMs?: number;
  costUsd?: number;
  status: AiRunStatus;
  error?: string;
}

// --- Errors ---

export class AiActionError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_INPUT' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INTERNAL',
  ) {
    super(message);
    this.name = 'AiActionError';
  }
}
