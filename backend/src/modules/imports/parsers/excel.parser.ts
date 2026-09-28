import * as XLSX from 'xlsx';
import { ParsedFileData } from './csv.parser';

export class ExcelParser {
  static parse(buffer: Buffer): ParsedFileData {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, dense: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel workbook has no sheets');
    }

    // Read first non-empty sheet
    let worksheet: XLSX.WorkSheet | null = null;
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (sheet && sheet['!ref']) {
        worksheet = sheet;
        break;
      }
    }

    if (!worksheet) {
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    }

    // Convert to JSON objects with raw values formatted
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      blankrows: false,
      raw: false,
    });

    if (rawRows.length === 0) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        previewRows: [],
      };
    }

    // Extract non-empty trimmed headers
    const rawHeaders = Object.keys(rawRows[0] || {});
    const headers = rawHeaders
      .map((h) => h.trim())
      .filter((h) => h && !h.startsWith('__EMPTY_'));

    // Normalize row keys to trimmed headers and sanitize values
    const rows: Record<string, any>[] = [];

    for (const row of rawRows) {
      const normalizedRow: Record<string, any> = {};
      let hasAnyValue = false;

      for (const [key, value] of Object.entries(row)) {
        const trimmedKey = key.trim();
        if (!trimmedKey || trimmedKey.startsWith('__EMPTY_')) continue;

        let cleanValue = value;
        if (typeof value === 'string') {
          cleanValue = value.trim();
          // Fix scientific notation for numbers like 9.87654E+09 if parsed as text
          if (/^[0-9]+(\.[0-9]+)?[eE][+-]?[0-9]+$/.test(cleanValue)) {
            const num = Number(cleanValue);
            if (!isNaN(num)) {
              cleanValue = num.toLocaleString('fullwide', { useGrouping: false });
            }
          }
        } else if (typeof value === 'number') {
          // Prevent scientific notation output
          cleanValue = value.toLocaleString('fullwide', { useGrouping: false });
        } else if (value instanceof Date) {
          cleanValue = value.toISOString().split('T')[0];
        }

        normalizedRow[trimmedKey] = cleanValue !== undefined && cleanValue !== null ? cleanValue : '';
        if (cleanValue !== '' && cleanValue !== null && cleanValue !== undefined) {
          hasAnyValue = true;
        }
      }

      if (hasAnyValue) {
        rows.push(normalizedRow);
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

