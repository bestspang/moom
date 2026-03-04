export interface CsvColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

export function exportToCsv<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  const headers = columns.map((col) => `"${col.header}"`).join(',');

  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = col.accessor(row);
        if (value === null || value === undefined) return '""';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',');
  });

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Members Export ──

export interface ExportableMember {
  member_id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  register_location_id: string | null;
  register_location_name: string | null;
  status: string | null;
  member_since: string | null;
  address_1: string | null;
  address_2: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  postal_code: string | null;
  emergency_first_name: string | null;
  emergency_last_name: string | null;
  emergency_phone: string | null;
  emergency_relationship: string | null;
  has_medical_conditions: boolean;
  medical_notes: string | null;
  allow_physical_contact: boolean;
  source: string | null;
  notes: string | null;
  // Computed
  recent_package_name?: string | null;
  last_attended?: string | null;
  has_contract?: boolean;
}

export function exportMembers(members: ExportableMember[]): void {
  const columns: CsvColumn<ExportableMember>[] = [
    { key: 'member_id', header: 'member_id', accessor: (r) => r.member_id },
    { key: 'first_name', header: 'first_name', accessor: (r) => r.first_name },
    { key: 'last_name', header: 'last_name', accessor: (r) => r.last_name },
    { key: 'nickname', header: 'nickname', accessor: (r) => r.nickname },
    { key: 'gender', header: 'gender', accessor: (r) => r.gender },
    { key: 'date_of_birth', header: 'date_of_birth', accessor: (r) => r.date_of_birth },
    { key: 'phone', header: 'phone', accessor: (r) => r.phone },
    { key: 'email', header: 'email', accessor: (r) => r.email },
    { key: 'line_id', header: 'line_id', accessor: (r) => r.line_id },
    { key: 'register_location_id', header: 'register_location_id', accessor: (r) => r.register_location_id },
    { key: 'register_location_name', header: 'register_location_name', accessor: (r) => r.register_location_name },
    { key: 'status', header: 'status', accessor: (r) => r.status },
    { key: 'member_since', header: 'joined_date', accessor: (r) => r.member_since },
    { key: 'address_1', header: 'address_1', accessor: (r) => r.address_1 },
    { key: 'address_2', header: 'address_2', accessor: (r) => r.address_2 },
    { key: 'subdistrict', header: 'subdistrict', accessor: (r) => r.subdistrict },
    { key: 'district', header: 'district', accessor: (r) => r.district },
    { key: 'province', header: 'province', accessor: (r) => r.province },
    { key: 'postal_code', header: 'postal_code', accessor: (r) => r.postal_code },
    { key: 'emergency_first_name', header: 'emergency_first_name', accessor: (r) => r.emergency_first_name },
    { key: 'emergency_last_name', header: 'emergency_last_name', accessor: (r) => r.emergency_last_name },
    { key: 'emergency_phone', header: 'emergency_phone', accessor: (r) => r.emergency_phone },
    { key: 'emergency_relationship', header: 'emergency_relationship', accessor: (r) => r.emergency_relationship },
    { key: 'has_medical_conditions', header: 'has_medical_conditions', accessor: (r) => r.has_medical_conditions ? 'true' : 'false' },
    { key: 'medical_notes', header: 'medical_notes', accessor: (r) => r.medical_notes },
    { key: 'allow_physical_contact', header: 'allow_physical_contact', accessor: (r) => r.allow_physical_contact ? 'true' : 'false' },
    { key: 'source', header: 'source', accessor: (r) => r.source },
    { key: 'notes', header: 'notes', accessor: (r) => r.notes },
    { key: 'recent_package_name', header: 'recent_package_name', accessor: (r) => r.recent_package_name ?? '' },
    { key: 'last_attended', header: 'last_attended_at', accessor: (r) => r.last_attended ? new Date(r.last_attended).toLocaleDateString() : '' },
    { key: 'contract', header: 'has_contract', accessor: (r) => r.has_contract ? 'Yes' : 'No' },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCsv(members, columns, `members-export-${date}`);
}

// ── Leads Export ──

export interface ExportableLead {
  first_name: string;
  last_name: string | null;
  nickname: string | null;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  temperature?: string | null;
  times_contacted: number | null;
  last_contacted: string | null;
  last_attended: string | null;
  source: string | null;
  register_location_id?: string | null;
  // Address
  address_1?: string | null;
  address_2?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postal_code?: string | null;
  // Emergency
  emergency_first_name?: string | null;
  emergency_last_name?: string | null;
  emergency_phone?: string | null;
  emergency_relationship?: string | null;
  // Medical
  has_medical_conditions?: boolean | null;
  medical_notes?: string | null;
  allow_physical_contact?: boolean | null;
  notes?: string | null;
}

export function exportLeads(leads: ExportableLead[]): void {
  const columns: CsvColumn<ExportableLead>[] = [
    { key: 'first_name', header: 'first_name', accessor: (r) => r.first_name },
    { key: 'last_name', header: 'last_name', accessor: (r) => r.last_name },
    { key: 'nickname', header: 'nickname', accessor: (r) => r.nickname },
    { key: 'gender', header: 'gender', accessor: (r) => r.gender },
    { key: 'date_of_birth', header: 'date_of_birth', accessor: (r) => r.date_of_birth },
    { key: 'phone', header: 'phone', accessor: (r) => r.phone },
    { key: 'email', header: 'email', accessor: (r) => r.email },
    { key: 'status', header: 'status', accessor: (r) => r.status },
    { key: 'temperature', header: 'temperature', accessor: (r) => r.temperature ?? '' },
    { key: 'source', header: 'source', accessor: (r) => r.source },
    { key: 'times_contacted', header: 'times_contacted', accessor: (r) => r.times_contacted },
    { key: 'last_contacted', header: 'last_contacted', accessor: (r) => r.last_contacted ? new Date(r.last_contacted).toLocaleDateString() : '' },
    { key: 'last_attended', header: 'last_attended', accessor: (r) => r.last_attended ? new Date(r.last_attended).toLocaleDateString() : '' },
    { key: 'address_1', header: 'address_1', accessor: (r) => r.address_1 },
    { key: 'address_2', header: 'address_2', accessor: (r) => r.address_2 },
    { key: 'subdistrict', header: 'subdistrict', accessor: (r) => r.subdistrict },
    { key: 'district', header: 'district', accessor: (r) => r.district },
    { key: 'province', header: 'province', accessor: (r) => r.province },
    { key: 'postal_code', header: 'postal_code', accessor: (r) => r.postal_code },
    { key: 'emergency_first_name', header: 'emergency_first_name', accessor: (r) => r.emergency_first_name },
    { key: 'emergency_last_name', header: 'emergency_last_name', accessor: (r) => r.emergency_last_name },
    { key: 'emergency_phone', header: 'emergency_phone', accessor: (r) => r.emergency_phone },
    { key: 'emergency_relationship', header: 'emergency_relationship', accessor: (r) => r.emergency_relationship },
    { key: 'has_medical_conditions', header: 'has_medical_conditions', accessor: (r) => r.has_medical_conditions ? 'true' : 'false' },
    { key: 'medical_notes', header: 'medical_notes', accessor: (r) => r.medical_notes },
    { key: 'allow_physical_contact', header: 'allow_physical_contact', accessor: (r) => r.allow_physical_contact ? 'true' : 'false' },
    { key: 'notes', header: 'notes', accessor: (r) => r.notes },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCsv(leads, columns, `leads-export-${date}`);
}
