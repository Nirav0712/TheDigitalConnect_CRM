import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImportJob, ImportJobDocument } from '../../database/schemas/import-job.schema';
import { ImportMapping, ImportMappingDocument } from '../../database/schemas/import-mapping.schema';
import { Contact, ContactDocument } from '../../database/schemas/contact.schema';
import { ContactsService } from '../contacts/contacts.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { CsvParser, ParsedFileData } from './parsers/csv.parser';
import { ExcelParser } from './parsers/excel.parser';
import { SafeXmlParser } from './parsers/xml.parser';
import { ExecuteImportDto, PreviewImportDto } from './dto/execute-import.dto';

const STANDARD_FIELDS = [
  'fullName',
  'firstName',
  'lastName',
  'phoneNumber',
  'whatsappNumber',
  'email',
  'alternateEmail',
  'company',
  'department',
  'designation',
  'status',
  'owner',
  'leadSource',
  'city',
  'country',
  'website',
  'tags',
  'notes',
];

const VALID_STATUSES = ['lead', 'prospect', 'customer', 'active', 'inactive'];

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    @InjectModel(ImportJob.name)
    private readonly importJobModel: Model<ImportJobDocument>,
    @InjectModel(ImportMapping.name)
    private readonly importMappingModel: Model<ImportMappingDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    private readonly contactsService: ContactsService,
    private readonly customFieldsService: CustomFieldsService,
  ) {}

  /**
   * Parses uploaded file buffer based on MIME type or filename extension
   */
  parseFile(filename: string, buffer: Buffer, mimetype?: string): ParsedFileData & { fileFormat: string } {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    let parsedData: ParsedFileData;
    let fileFormat = ext;

    try {
      if (ext === 'csv' || mimetype?.includes('csv') || mimetype?.includes('text/plain')) {
        parsedData = CsvParser.parse(buffer);
        fileFormat = 'csv';
      } else if (ext === 'xlsx' || ext === 'xls' || mimetype?.includes('spreadsheet') || mimetype?.includes('excel')) {
        parsedData = ExcelParser.parse(buffer);
        fileFormat = ext === 'xls' ? 'xls' : 'xlsx';
      } else if (ext === 'xml' || mimetype?.includes('xml')) {
        parsedData = SafeXmlParser.parse(buffer);
        fileFormat = 'xml';
      } else {
        throw new BadRequestException(`Unsupported file format .${ext}. Please upload a CSV, XLSX, XLS, or XML file.`);
      }
    } catch (err) {
      throw new BadRequestException(`Failed to parse file '${filename}': ${(err as Error).message}`);
    }

    if (parsedData.totalRows === 0) {
      throw new BadRequestException(`The uploaded file contains no data rows`);
    }

    return {
      ...parsedData,
      fileFormat,
    };
  }

  /**
   * Generates initial auto-guessed column mappings for headers
   */
  suggestMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    const aliasMap: Record<string, string> = {
      name: 'fullName',
      fullname: 'fullName',
      'full name': 'fullName',
      'contact person': 'fullName',
      'contact name': 'fullName',
      'person name': 'fullName',
      'client name': 'fullName',
      firstname: 'firstName',
      'first name': 'firstName',
      fname: 'firstName',
      lastname: 'lastName',
      'last name': 'lastName',
      lname: 'lastName',
      phone: 'phoneNumber',
      mobile: 'phoneNumber',
      'mobile number': 'phoneNumber',
      'mobile no': 'phoneNumber',
      'phone number': 'phoneNumber',
      'contact no': 'phoneNumber',
      'contact number': 'phoneNumber',
      'cell no': 'phoneNumber',
      cell: 'phoneNumber',
      whatsapp: 'whatsappNumber',
      'whatsapp no': 'whatsappNumber',
      'whatsapp number': 'whatsappNumber',
      'wa number': 'whatsappNumber',
      'wa no': 'whatsappNumber',
      email: 'email',
      'email address': 'email',
      'work email': 'email',
      mail: 'email',
      company: 'company',
      'company name': 'company',
      organization: 'company',
      org: 'company',
      'business name': 'company',
      business: 'company',
      firm: 'company',
      'firm name': 'company',
      party: 'company',
      'party name': 'company',
      website: 'website',
      url: 'website',
      'web site': 'website',
      city: 'city',
      'city name': 'city',
      location: 'city',
      address: 'city',
      country: 'country',
      state: 'country',
      designation: 'designation',
      title: 'designation',
      'job title': 'designation',
      role: 'designation',
      source: 'leadSource',
      'lead source': 'leadSource',
      status: 'status',
      notes: 'notes',
      note: 'notes',
      remark: 'notes',
      remarks: 'notes',
      tag: 'tags',
      tags: 'tags',
    };

    for (const header of headers) {
      const cleanHeader = header.toLowerCase().trim().replace(/[-_]/g, ' ');
      if (aliasMap[cleanHeader]) {
        mapping[header] = aliasMap[cleanHeader];
      }
    }

    return mapping;
  }

  /**
   * Previews normalized data and calculates accurate validation stats
   */
  async previewMapping(dto: PreviewImportDto) {
    const { columnMapping, rows, totalRowCount } = dto;
    const previewCount = Math.min(rows.length, 20);
    const previewRows: any[] = [];
    const errors: Array<{ row: number; column?: string; message: string }> = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let validRowsCount = 0;
    let invalidRowsCount = 0;
    let warningCount = 0;
    let duplicateCandidatesCount = 0;

    const totalRows = totalRowCount && totalRowCount > 0 ? totalRowCount : rows.length;

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const rowNum = i + 1;
      const normalizedContact: Record<string, any> = { customFields: {} };
      let rowHasWarning = false;

      for (const [header, targetField] of Object.entries(columnMapping)) {
        if (!targetField || targetField === '__ignore__') continue;
        const rawValue = rawRow[header];
        if (rawValue === undefined || rawValue === null || rawValue === '') continue;

        if (STANDARD_FIELDS.includes(targetField)) {
          if (targetField === 'email' || targetField === 'alternateEmail') {
            const emailVal = String(rawValue).trim().toLowerCase();
            if (emailVal && !emailRegex.test(emailVal)) {
              rowHasWarning = true;
              if (errors.length < 30) {
                errors.push({ row: rowNum, column: header, message: `Invalid email format '${emailVal}'` });
              }
            }
            normalizedContact[targetField] = emailVal;
          } else if (targetField === 'phoneNumber' || targetField === 'whatsappNumber') {
            normalizedContact[targetField] = this.contactsService.normalizePhone(String(rawValue));
          } else if (targetField === 'status') {
            const s = String(rawValue).toLowerCase().trim();
            normalizedContact.status = VALID_STATUSES.includes(s) ? s : 'lead';
          } else if (targetField === 'tags') {
            normalizedContact.tags = typeof rawValue === 'string'
              ? rawValue.split(',').map((t) => t.trim()).filter(Boolean)
              : [String(rawValue)];
          } else {
            normalizedContact[targetField] = String(rawValue).trim();
          }
        } else {
          // Custom field: clean key
          const cleanKey = targetField.replace(/[\.\$]/g, '_');
          normalizedContact.customFields[cleanKey] = rawValue;
        }
      }

      // Check if contact has at least some identifiable information
      const hasIdentity = Boolean(
        normalizedContact.fullName ||
        normalizedContact.firstName ||
        normalizedContact.lastName ||
        normalizedContact.company ||
        normalizedContact.phoneNumber ||
        normalizedContact.whatsappNumber ||
        normalizedContact.email
      );

      if (!hasIdentity) {
        invalidRowsCount++;
        if (errors.length < 30) {
          errors.push({ row: rowNum, message: 'Row skipped: empty contact data' });
        }
      } else {
        validRowsCount++;
        if (rowHasWarning) warningCount++;
      }

      if (i < previewCount) {
        // Check duplicate candidate in DB for preview sample
        try {
          const dups = await this.contactsService.detectDuplicates(
            normalizedContact.email,
            normalizedContact.phoneNumber,
            normalizedContact.whatsappNumber,
          );
          if (dups && dups.length > 0) {
            duplicateCandidatesCount++;
            normalizedContact.isDuplicateCandidate = true;
          }
        } catch {}
        previewRows.push(normalizedContact);
      }
    }

    // Scale up stats if previewing a subset of total rows
    if (totalRowCount && totalRowCount > rows.length && rows.length > 0) {
      const validRatio = validRowsCount / rows.length;
      validRowsCount = Math.round(totalRows * validRatio);
      invalidRowsCount = Math.max(0, totalRows - validRowsCount);
    }

    return {
      previewRows,
      errors,
      totalRows,
      validRowsCount,
      invalidRowsCount,
      warningCount,
      duplicateCandidatesCount,
    };
  }

  /**
   * Executes import and commits records to MongoDB Atlas using fast bulk operations
   */
  async executeImport(dto: ExecuteImportDto, orgId = 'default-org'): Promise<ImportJob> {
    const {
      filename,
      fileFormat,
      columnMapping,
      newCustomFields = [],
      rows,
      jobId,
      isFirstBatch = true,
      isLastBatch = true,
      totalExpectedRows,
    } = dto;

    // 1. Create newly declared custom fields if any (only on first batch)
    if (isFirstBatch && newCustomFields.length > 0) {
      for (const fieldDef of newCustomFields) {
        try {
          await this.customFieldsService.createIfNotExists({
            key: fieldDef.key,
            label: fieldDef.label,
            type: fieldDef.type as any,
          });
        } catch (err) {
          this.logger.warn(`Could not register custom field '${fieldDef.key}': ${(err as Error).message}`);
        }
      }
    }

    // 2. Find or create ImportJob record
    let importJob: ImportJobDocument | null = null;
    if (jobId) {
      try {
        importJob = await this.importJobModel.findOne({ _id: jobId, organizationId: orgId });
      } catch {}
    }

    if (!importJob) {
      importJob = new this.importJobModel({
        filename,
        organizationId: orgId,
        fileFormat,
        totalRows: totalExpectedRows || rows.length,
        successfulRows: 0,
        failedRows: 0,
        warningCount: 0,
        status: 'processing',
        columnMapping,
        errors: [],
      });
      await importJob.save();
    }

    let batchSuccess = 0;
    let batchFailed = 0;
    let batchWarnings = 0;
    const batchErrors: Array<{ row: number; column?: string; message: string }> = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const docsToInsert: any[] = [];

    // 3. Normalize batch records
    for (let index = 0; index < rows.length; index++) {
      const rawRow = rows[index];
      const rowNum = (dto.batchIndex !== undefined ? dto.batchIndex * rows.length : 0) + index + 1;

      try {
        const contactData: Record<string, any> = {
          customFields: {},
          organizationId: orgId,
          tags: [],
          status: 'lead',
        };

        for (const [header, targetField] of Object.entries(columnMapping)) {
          if (!targetField || targetField === '__ignore__') continue;
          const rawValue = rawRow[header];
          if (rawValue === undefined || rawValue === null || rawValue === '') continue;

          if (STANDARD_FIELDS.includes(targetField)) {
            if (targetField === 'email' || targetField === 'alternateEmail') {
              const emailVal = String(rawValue).trim().toLowerCase();
              if (emailVal && !emailRegex.test(emailVal)) {
                batchWarnings++;
                if (batchErrors.length < 50) {
                  batchErrors.push({ row: rowNum, column: header, message: `Invalid email format '${emailVal}'` });
                }
              }
              contactData[targetField] = emailVal;
            } else if (targetField === 'phoneNumber' || targetField === 'whatsappNumber') {
              contactData[targetField] = this.contactsService.normalizePhone(String(rawValue));
            } else if (targetField === 'status') {
              const s = String(rawValue).toLowerCase().trim();
              contactData.status = VALID_STATUSES.includes(s) ? s : 'lead';
            } else if (targetField === 'tags') {
              contactData.tags = typeof rawValue === 'string'
                ? rawValue.split(',').map((t) => t.trim()).filter(Boolean)
                : [String(rawValue)];
            } else {
              contactData[targetField] = String(rawValue).trim();
            }
          } else {
            const cleanKey = targetField.replace(/[\.\$]/g, '_');
            contactData.customFields[cleanKey] = rawValue;
          }
        }

        // Auto-assign fullName if missing
        contactData.fullName =
          contactData.fullName?.trim() ||
          `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() ||
          contactData.company?.trim() ||
          contactData.phoneNumber ||
          contactData.email ||
          'Unnamed Contact';

        // Check if contact has at least some identifiable information
        const hasIdentity = Boolean(
          contactData.fullName !== 'Unnamed Contact' ||
          contactData.firstName ||
          contactData.lastName ||
          contactData.company ||
          contactData.phoneNumber ||
          contactData.whatsappNumber ||
          contactData.email
        );

        if (!hasIdentity) {
          batchFailed++;
          if (batchErrors.length < 50) {
            batchErrors.push({ row: rowNum, message: 'Row skipped: empty record' });
          }
          continue;
        }

        if (!contactData.whatsappNumber && contactData.phoneNumber) {
          contactData.whatsappNumber = contactData.phoneNumber;
        }

        contactData.source = {
          type: 'import',
          importJobId: importJob._id as Types.ObjectId,
        };

        contactData.duplicateFlags = [];

        docsToInsert.push(contactData);
      } catch (rowErr) {
        batchFailed++;
        if (batchErrors.length < 50) {
          batchErrors.push({ row: rowNum, message: (rowErr as Error).message });
        }
      }
    }

    // 4. Ultra-fast bulk insertion into MongoDB Atlas
    if (docsToInsert.length > 0) {
      try {
        const result = await this.contactModel.insertMany(docsToInsert, {
          ordered: false,
          rawResult: true,
        });
        const insertedCount = (result as any)?.insertedCount ?? docsToInsert.length;
        batchSuccess += insertedCount;
      } catch (insertErr: any) {
        // Mongoose BulkWriteError still inserts non-duplicate/valid rows
        const insertedCount = insertErr.result?.nInserted ?? insertErr.insertedDocs?.length ?? 0;
        batchSuccess += insertedCount;
        const failedCount = docsToInsert.length - insertedCount;
        batchFailed += failedCount;
        if (batchErrors.length < 50) {
          batchErrors.push({
            row: 0,
            message: `Bulk insert: ${insertedCount} saved, ${failedCount} skipped: ${(insertErr.message || '').slice(0, 120)}`,
          });
        }
      }
    }

    // 5. Increment counts on the importJob
    importJob.successfulRows = (importJob.successfulRows || 0) + batchSuccess;
    importJob.failedRows = (importJob.failedRows || 0) + batchFailed;
    importJob.warningCount = (importJob.warningCount || 0) + batchWarnings;

    if (batchErrors.length > 0) {
      const existingErrors = (importJob as any).errors || [];
      (importJob as any).errors = [...existingErrors, ...batchErrors].slice(0, 100);
    }

    if (isLastBatch) {
      importJob.status = importJob.successfulRows > 0 ? 'completed' : 'failed';
    } else {
      importJob.status = 'processing';
    }

    return importJob.save();
  }

  async getImportHistory(orgId = 'default-org'): Promise<ImportJob[]> {
    return this.importJobModel.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(50).exec();
  }

  async getImportJobById(id: string, orgId = 'default-org'): Promise<ImportJob | null> {
    return this.importJobModel.findOne({ _id: id, organizationId: orgId }).exec();
  }

  // Reusable Mapping Presets
  async getSavedMappings(orgId = 'default-org'): Promise<ImportMapping[]> {
    return this.importMappingModel.find({ organizationId: orgId }).sort({ name: 1 }).exec();
  }

  async saveMapping(name: string, mapping: Record<string, string>, orgId = 'default-org'): Promise<ImportMapping> {
    const existing = await this.importMappingModel.findOne({ name, organizationId: orgId });
    if (existing) {
      existing.mapping = mapping;
      return existing.save();
    }
    const created = new this.importMappingModel({ name, mapping, organizationId: orgId });
    return created.save();
  }

  async deleteMapping(id: string, orgId = 'default-org'): Promise<void> {
    await this.importMappingModel.findOneAndDelete({ _id: id, organizationId: orgId }).exec();
  }
}

