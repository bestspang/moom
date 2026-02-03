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
  // Create CSV header row
  const headers = columns.map((col) => `"${col.header}"`).join(',');
  
  // Create CSV data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = col.accessor(row);
        if (value === null || value === undefined) {
          return '""';
        }
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
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

// Pre-configured export for members
export function exportMembers(members: Array<{
  member_id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  member_since: string | null;
}>): void {
  const columns: CsvColumn<typeof members[0]>[] = [
    { key: 'member_id', header: 'ID', accessor: (r) => r.member_id },
    { key: 'name', header: 'Name', accessor: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'nickname', header: 'Nickname', accessor: (r) => r.nickname },
    { key: 'email', header: 'Email', accessor: (r) => r.email },
    { key: 'phone', header: 'Phone', accessor: (r) => r.phone },
    { key: 'status', header: 'Status', accessor: (r) => r.status },
    { key: 'member_since', header: 'Member Since', accessor: (r) => r.member_since },
  ];

  const date = new Date().toISOString().split('T')[0];
  exportToCsv(members, columns, `members-export-${date}`);
}
