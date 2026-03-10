

# Fix: Promotions export missing columns in Settings

## Problem
The promotions export in Settings > Import/Export (`SettingsImportExport.tsx` lines 190-200) uses raw DB column names and is missing key columns that the Promotions page export (`Promotions.tsx` lines 90-98) already has:
- **Type** should show "Discount" / "Promo code" (not raw enum)
- **Discount** should show "Varies" / "1290฿" / "10%" (not raw `discount_value`)
- **Started on** / **Ending on** should be formatted dates (not raw timestamps)
- **Date modified** column is completely missing
- **Status** is present but headers should match the screenshot format

## Fix (surgical, 1 file)

**File:** `src/pages/settings/SettingsImportExport.tsx` lines 187-201

Replace the promotions export `cols` array to match the Promotions page export format:

```typescript
case 'promotions': {
  const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const fmtDate = (d: string | null) => d ? format(new Date(d), 'd MMM yyyy').toUpperCase() : '-';
  const getExportDiscount = (r: any): string => {
    if (!r.same_discount_all_packages) return 'Varies';
    const mode = r.discount_mode || r.discount_type;
    if (mode === 'percentage') return `${r.percentage_discount ?? r.discount_value}%`;
    return `${Number(r.flat_rate_discount ?? r.discount_value)}฿`;
  };
  const cols: CsvColumn<any>[] = [
    { key: 'name', header: 'Name', accessor: r => r.name },
    { key: 'type', header: 'Type', accessor: r => r.type === 'promo_code' ? 'Promo code' : 'Discount' },
    { key: 'promo_code', header: 'Promo code', accessor: r => r.promo_code || '-' },
    { key: 'discount', header: 'Discount', accessor: r => getExportDiscount(r) },
    { key: 'start_date', header: 'Started on', accessor: r => fmtDate(r.start_date) },
    { key: 'end_date', header: 'Ending on', accessor: r => fmtDate(r.end_date) },
    { key: 'date_modified', header: 'Date modified', accessor: r => fmtDate(r.updated_at) },
    { key: 'status', header: 'Status', accessor: r => r.status ?? 'drafts' },
  ];
  exportToCsv(data || [], cols, `promotions-export-${new Date().toISOString().split('T')[0]}`);
  break;
}
```

## Risk
- **Low**: Only changes CSV output columns for promotions export. No other behavior affected. Matches exactly what the Promotions page already exports.

