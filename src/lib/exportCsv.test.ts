import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCsv, type CsvColumn } from './exportCsv';

describe('exportToCsv', () => {
  let mockLink: any;
  let blobContent: string;

  beforeEach(() => {
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {} as any,
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    // jsdom doesn't have URL.createObjectURL — define it
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    // Capture blob content
    const OriginalBlob = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation((parts: any, opts: any) => {
      blobContent = parts?.join('') || '';
      return new OriginalBlob(parts, opts);
    });
  });

  it('generates correct CSV with headers and rows', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const columns: CsvColumn<typeof data[0]>[] = [
      { key: 'name', header: 'Name', accessor: (r) => r.name },
      { key: 'age', header: 'Age', accessor: (r) => r.age },
    ];

    exportToCsv(data, columns, 'test');

    expect(blobContent).toContain('"Name","Age"');
    expect(blobContent).toContain('"Alice","30"');
    expect(blobContent).toContain('"Bob","25"');
  });

  it('escapes double quotes in values', () => {
    const data = [{ text: 'He said "hello"' }];
    const columns: CsvColumn<typeof data[0]>[] = [
      { key: 'text', header: 'Text', accessor: (r) => r.text },
    ];

    exportToCsv(data, columns, 'test');

    expect(blobContent).toContain('"He said ""hello"""');
  });

  it('handles null/undefined values', () => {
    const data = [{ val: null as any }];
    const columns: CsvColumn<typeof data[0]>[] = [
      { key: 'val', header: 'Value', accessor: (r) => r.val },
    ];

    exportToCsv(data, columns, 'test');

    expect(blobContent).toContain('""');
  });

  it('includes BOM for UTF-8', () => {
    const data = [{ name: 'ชื่อไทย' }];
    const columns: CsvColumn<typeof data[0]>[] = [
      { key: 'name', header: 'Name', accessor: (r) => r.name },
    ];

    exportToCsv(data, columns, 'test');

    expect(blobContent).toContain('\ufeff');
  });

  it('sets correct download filename', () => {
    exportToCsv([], [], 'my-export');

    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'my-export.csv');
  });
});
