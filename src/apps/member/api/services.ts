import { supabase } from '@/integrations/supabase/client';

// ─── Schedule ───
export interface ScheduleItem {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  checkedIn: number;
  status: string;
  className: string;
  classNameTh: string | null;
  categoryName: string | null;
  trainerName: string | null;
  roomName: string | null;
  locationName: string | null;
}

export async function fetchSchedule(fromDate?: string): Promise<ScheduleItem[]> {
  const dateFilter = fromDate ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('schedule')
    .select(`
      *,
      class:classes(name, name_th, category:class_categories(name)),
      trainer:staff!schedule_trainer_id_fkey(first_name, last_name),
      room:rooms(name),
      location:locations(name)
    `)
    .gte('scheduled_date', dateFilter)
    .eq('status', 'scheduled')
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    scheduledDate: row.scheduled_date,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity ?? 20,
    checkedIn: row.checked_in ?? 0,
    status: row.status,
    className: row.class?.name ?? 'Class',
    classNameTh: row.class?.name_th ?? null,
    categoryName: row.class?.category?.name ?? null,
    trainerName: row.trainer ? `${row.trainer.first_name} ${row.trainer.last_name}`.trim() : null,
    roomName: row.room?.name ?? null,
    locationName: row.location?.name ?? null,
  }));
}

// ─── My Bookings ───
export interface MyBooking {
  id: string;
  status: string;
  bookedAt: string | null;
  schedule: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    className: string;
    trainerName: string | null;
  };
}

export async function fetchMyBookings(memberId: string): Promise<MyBooking[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('class_bookings')
    .select(`
      *,
      schedule:schedule(
        id, scheduled_date, start_time, end_time,
        class:classes(name),
        trainer:staff!schedule_trainer_id_fkey(first_name, last_name)
      )
    `)
    .eq('member_id', memberId)
    .order('booked_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    status: row.status ?? 'booked',
    bookedAt: row.booked_at,
    schedule: {
      id: row.schedule?.id ?? '',
      date: row.schedule?.scheduled_date ?? '',
      startTime: row.schedule?.start_time ?? '',
      endTime: row.schedule?.end_time ?? '',
      className: row.schedule?.class?.name ?? 'Class',
      trainerName: row.schedule?.trainer
        ? `${row.schedule.trainer.first_name} ${row.schedule.trainer.last_name}`.trim()
        : null,
    },
  }));
}

// ─── My Packages ───
export interface MyPackage {
  id: string;
  packageName: string;
  status: string;
  sessionsRemaining: number | null;
  sessionsTotal: number | null;
  expiryDate: string | null;
  activationDate: string | null;
}

export async function fetchMyPackages(memberId: string): Promise<MyPackage[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('member_packages')
    .select('*, package:packages(name_en, price, type)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    packageName: row.package_name_snapshot ?? row.package?.name_en ?? 'Package',
    status: row.status ?? 'active',
    sessionsRemaining: row.sessions_remaining,
    sessionsTotal: row.sessions_total,
    expiryDate: row.expiry_date,
    activationDate: row.activation_date,
  }));
}

// ─── Available Packages (for browse) ───
export interface AvailablePackage {
  id: string;
  nameEn: string;
  nameTh: string | null;
  descriptionEn: string | null;
  price: number;
  sessions: number | null;
  termDays: number;
  type: string;
  isPopular: boolean;
}

export async function fetchAvailablePackages(): Promise<AvailablePackage[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('status', 'on_sale')
    .order('price', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    nameEn: row.name_en,
    nameTh: row.name_th,
    descriptionEn: row.description_en,
    price: row.price,
    sessions: row.sessions,
    termDays: row.term_days,
    type: row.type,
    isPopular: row.is_popular ?? false,
  }));
}

// ─── Announcements ───
export async function fetchActiveAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('publish_date', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
