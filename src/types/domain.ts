/**
 * Centralized domain types — thin re-exports of Supabase generated types
 * plus enriched/computed types used across multiple pages.
 *
 * Import from here instead of directly from @/integrations/supabase/types
 * when you need domain-level abstractions.
 */
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

// ── Core entity row types ──────────────────────────────────────────
export type Member = Tables<'members'>;
export type MemberInsert = TablesInsert<'members'>;
export type MemberUpdate = TablesUpdate<'members'>;

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadUpdate = TablesUpdate<'leads'>;

export type Staff = Tables<'staff'>;
export type StaffInsert = TablesInsert<'staff'>;
export type StaffUpdate = TablesUpdate<'staff'>;

export type Package = Tables<'packages'>;
export type PackageInsert = TablesInsert<'packages'>;
export type PackageUpdate = TablesUpdate<'packages'>;

export type MemberPackage = Tables<'member_packages'>;
export type Transaction = Tables<'transactions'>;
export type Promotion = Tables<'promotions'>;
export type PromotionPackage = Tables<'promotion_packages'>;
export type PromotionRedemption = Tables<'promotion_redemptions'>;

export type ClassDef = Tables<'classes'>;
export type ClassCategory = Tables<'class_categories'>;
export type ClassBooking = Tables<'class_bookings'>;
export type ClassWaitlist = Tables<'class_waitlist'>;

export type Schedule = Tables<'schedule'>;
export type Room = Tables<'rooms'>;
export type Location = Tables<'locations'>;

export type Role = Tables<'roles'>;
export type UserRole = Tables<'user_roles'>;
export type StaffPosition = Tables<'staff_positions'>;

export type MemberAttendance = Tables<'member_attendance'>;
export type MemberBilling = Tables<'member_billing'>;
export type MemberInjury = Tables<'member_injuries'>;
export type MemberNote = Tables<'member_notes'>;
export type MemberSuspension = Tables<'member_suspensions'>;
export type MemberContract = Tables<'member_contracts'>;

export type Announcement = Tables<'announcements'>;
export type ActivityLog = Tables<'activity_log'>;
export type Workout = Tables<'workouts'>;
export type WorkoutItem = Tables<'workout_items'>;
export type CheckinQrToken = Tables<'checkin_qr_tokens'>;
export type LineUser = Tables<'line_users'>;
export type EventOutbox = Tables<'event_outbox'>;
export type PackageUsageLedger = Tables<'package_usage_ledger'>;

// ── Enums ──────────────────────────────────────────────────────────
export type MemberStatus = Enums<'member_status'>;
export type LeadStatus = Enums<'lead_status'>;
export type PackageStatus = Enums<'package_status'>;
export type PackageType = Enums<'package_type'>;
export type PromotionStatus = Enums<'promotion_status'>;
export type ScheduleStatus = Enums<'schedule_status'>;
export type BookingStatus = Enums<'booking_status'>;
export type TransactionStatus = Enums<'transaction_status'>;
export type AccessLevel = Enums<'access_level'>;
export type RoomStatus = Enums<'room_status'>;
export type LocationStatus = Enums<'location_status'>;
export type ClassLevel = Enums<'class_level'>;
export type ClassType = Enums<'class_type'>;
export type Gender = Enums<'gender'>;
export type RiskLevel = Enums<'risk_level'>;
export type AppRole = Enums<'app_role'>;

// ── Enriched / computed types (used across pages) ──────────────────
export interface MemberWithPackages extends Member {
  member_packages?: MemberPackage[];
  register_location?: Pick<Location, 'id' | 'name'> | null;
}

export interface StaffWithRole extends Staff {
  role?: Pick<Role, 'id' | 'name' | 'access_level'> | null;
  staff_positions?: Array<StaffPosition & { role?: Pick<Role, 'id' | 'name'> | null }>;
}

export interface ScheduleWithRelations extends Schedule {
  class?: Pick<ClassDef, 'id' | 'name' | 'name_th' | 'type' | 'duration'> | null;
  trainer?: Pick<Staff, 'id' | 'first_name' | 'last_name'> | null;
  room?: Pick<Room, 'id' | 'name' | 'name_th'> | null;
  location?: Pick<Location, 'id' | 'name'> | null;
}

export interface TransactionWithRelations extends Transaction {
  member?: Pick<Member, 'id' | 'first_name' | 'last_name'> | null;
  package?: Pick<Package, 'id' | 'name_en' | 'name_th'> | null;
  location?: Pick<Location, 'id' | 'name'> | null;
  staff?: Pick<Staff, 'id' | 'first_name' | 'last_name'> | null;
}
