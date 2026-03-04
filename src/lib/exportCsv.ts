export interface CsvColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
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

// Enriched member type for export
export interface ExportableMember {
  member_id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  member_since: string | null;
  recent_package?: string | null;
  last_attended?: string | null;
  has_contract?: boolean;
}

export function exportMembers(members: ExportableMember[]): void {
  const columns: CsvColumn<ExportableMember>[] = [
    { key: 'member_id', header: 'ID', accessor: (r) => r.member_id },
    { key: 'name', header: 'Name', accessor: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'nickname', header: 'Nickname', accessor: (r) => r.nickname },
    { key: 'email', header: 'Email', accessor: (r) => r.email },
    { key: 'phone', header: 'Phone', accessor: (r) => r.phone },
    { key: 'status', header: 'Status', accessor: (r) => r.status },
    { key: 'member_since', header: 'Member Since', accessor: (r) => r.member_since },
    { key: 'recent_package', header: 'Recent Package', accessor: (r) => r.recent_package ?? '' },
    { key: 'last_attended', header: 'Last Attended', accessor: (r) => r.last_attended ? new Date(r.last_attended).toLocaleDateString() : '' },
    { key: 'contract', header: 'Contract', accessor: (r) => r.has_contract ? 'Yes' : 'No' },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCsv(members, columns, `members-export-${date}`);
}

// Exportable lead type
export interface ExportableLead {
  first_name: string;
  last_name: string | null;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  temperature?: string | null;
  times_contacted: number | null;
  last_contacted: string | null;
  last_attended: string | null;
  source: string | null;
}

export function exportLeads(leads: ExportableLead[]): void {
  const columns: CsvColumn<ExportableLead>[] = [
    { key: 'first_name', header: 'First Name', accessor: (r) => r.first_name },
    { key: 'last_name', header: 'Last Name', accessor: (r) => r.last_name },
    { key: 'nickname', header: 'Nickname', accessor: (r) => r.nickname },
    { key: 'phone', header: 'Phone', accessor: (r) => r.phone },
    { key: 'email', header: 'Email', accessor: (r) => r.email },
    { key: 'status', header: 'Status', accessor: (r) => r.status },
    { key: 'temperature', header: 'Temperature', accessor: (r) => r.temperature ?? '' },
    { key: 'times_contacted', header: 'Times Contacted', accessor: (r) => r.times_contacted },
    { key: 'last_contacted', header: 'Last Contacted', accessor: (r) => r.last_contacted ? new Date(r.last_contacted).toLocaleDateString() : '' },
    { key: 'last_attended', header: 'Last Attended', accessor: (r) => r.last_attended ? new Date(r.last_attended).toLocaleDateString() : '' },
    { key: 'source', header: 'Source', accessor: (r) => r.source },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCsv(leads, columns, `leads-export-${date}`);
}
