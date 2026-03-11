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
    .eq('status', 'active')
    .order('publish_date', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}

// ─── Booking Detail ───
export interface BookingDetail {
  id: string;
  status: string;
  bookedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  schedule: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    className: string;
    trainerName: string | null;
  };
}

export async function fetchBookingById(bookingId: string): Promise<BookingDetail | null> {
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
    .eq('id', bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row: any = data;
  return {
    id: row.id,
    status: row.status ?? 'booked',
    bookedAt: row.booked_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancellation_reason,
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
  };
}

// ─── Cancel Booking (uses SECURITY DEFINER RPC to bypass RLS) ───
export async function cancelBooking(bookingId: string, memberId: string, reason?: string): Promise<void> {
  const { data, error } = await supabase.rpc('cancel_booking_safe', {
    p_booking_id: bookingId,
    p_member_id: memberId,
    p_reason: reason ?? null,
  });

  if (error) throw error;

  const result = data as any;
  if (result?.error) {
    throw new Error(result.message || result.error);
  }
}

// ─── Schedule Detail (single) ───
export async function fetchScheduleById(scheduleId: string): Promise<ScheduleItem | null> {
  const { data, error } = await supabase
    .from('schedule')
    .select(`
      *,
      class:classes(name, name_th, category:class_categories(name)),
      trainer:staff!schedule_trainer_id_fkey(first_name, last_name),
      room:rooms(name),
      location:locations(name)
    `)
    .eq('id', scheduleId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row: any = data;
  return {
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
  };
}

// ─── Create Booking (B2 fix: uses server-side RPC for atomic validation) ───
export async function createBooking(scheduleId: string, memberId: string): Promise<void> {
  const { data, error } = await supabase.rpc('create_booking_safe', {
    p_schedule_id: scheduleId,
    p_member_id: memberId,
  });

  if (error) throw error;

  // RPC returns json — check for error field
  const result = data as any;
  if (result?.error) {
    throw new Error(result.message || result.error);
  }
}

// ─── Update Profile ───
export async function updateMyProfile(data: { first_name: string; last_name: string; phone?: string; preferred_language?: string }): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      preferred_language: data.preferred_language,
    },
  });

  if (error) throw error;
}

// ─── Upload Transfer Slip (B4 fix: uploads image to storage) ───
export async function uploadTransferSlip(data: {
  amount: number;
  bank_name: string;
  transfer_date: string;
  file?: File;
}): Promise<void> {
  let slipUrl: string | null = null;

  // Upload file to storage if provided
  if (data.file) {
    const fileExt = data.file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
    const filePath = `slips/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('slip-images')
      .upload(filePath, data.file, { contentType: data.file.type });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('slip-images')
      .getPublicUrl(filePath);
    slipUrl = urlData?.publicUrl ?? null;
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      amount: data.amount,
      payment_method: 'bank_transfer' as any,
      status: 'pending' as any,
      order_name: `SLIP-${Date.now()}`,
      transaction_id: `TXN-${Date.now()}`,
      transfer_slip_url: slipUrl,
      notes: `Bank: ${data.bank_name}, Date: ${data.transfer_date}`,
    });

  if (error) throw error;
}

// ─── Self Check-in (B1 fix: uses server-side RPC for validation) ───
export async function memberSelfCheckin(memberId: string): Promise<{ hasActivePackage: boolean; checkInType: string }> {
  const { data, error } = await supabase.rpc('member_self_checkin', {
    p_member_id: memberId,
    p_checkin_method: 'self_service',
  });

  if (error) throw error;

  const result = data as any;
  if (result?.error) {
    throw new Error(result.message || result.error);
  }

  return {
    hasActivePackage: result.has_active_package ?? false,
    checkInType: result.check_in_type ?? 'walk_in',
  };
}

// ─── My Attendance ───
export interface AttendanceRecord {
  id: string;
  checkInTime: string;
  checkInType: string;
  className: string | null;
}

export async function fetchMyAttendance(memberId: string): Promise<AttendanceRecord[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from('member_attendance')
    .select(`
      id, check_in_time, check_in_type,
      schedule:schedule(class:classes(name))
    `)
    .eq('member_id', memberId)
    .order('check_in_time', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    checkInTime: row.check_in_time,
    checkInType: row.check_in_type ?? 'class',
    className: row.schedule?.class?.name ?? null,
  }));
}
