import { parse } from 'csv-parse/sync';

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  previewRows: Record<string, any>[];
}

export class CsvParser {
  static parse(buffer: Buffer): ParsedFileData {
    let content = buffer.toString('utf8');
    // Strip BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    // Auto-detect delimiter from first sample lines
    const firstLine = content.split('\n')[0] || '';
    let delimiter = ',';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const pipeCount = (firstLine.match(/\|/g) || []).length;

    if (semiCount > commaCount && semiCount >= tabCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount >= semiCount) {
      delimiter = '\t';
    } else if (pipeCount > commaCount && pipeCount >= semiCount) {
      delimiter = '|';
    }

    let records: Record<string, any>[] = [];
    try {
      records = parse(content, {
        columns: true,
        delimiter,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        skip_records_with_error: true,
      });
    } catch (err) {
      // Fallback: try parsing with standard comma
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        skip_records_with_error: true,
      });
    }

    if (records.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        previewRows: [],
      };
    }

    const rawHeaders = Object.keys(records[0]);
    const headers = rawHeaders.map((h) => h.trim()).filter(Boolean);

    // Normalize rows to trimmed keys & skip all-empty rows
    const rows: Record<string, any>[] = [];
    for (const record of records) {
      const row: Record<string, any> = {};
      let hasValue = false;
      for (const [key, value] of Object.entries(record)) {
        const cleanKey = key.trim();
        if (!cleanKey) continue;
        const cleanVal = typeof value === 'string' ? value.trim() : (value ?? '');
        row[cleanKey] = cleanVal;
        if (cleanVal !== '' && cleanVal !== null && cleanVal !== undefined) {
          hasValue = true;
        }
      }
      if (hasValue) {
        rows.push(row);
      }
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
      previewRows: rows.slice(0, 10),
    };
  }
}
