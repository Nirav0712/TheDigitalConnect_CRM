import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CustomFieldDefinitionDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class ExecuteImportDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsNotEmpty()
  @IsString()
  fileFormat: string;

  @IsNotEmpty()
  @IsObject()
  columnMapping: Record<string, string>; // Maps file column header -> standard field or custom field key

  @IsOptional()
  @IsArray()
  newCustomFields?: CustomFieldDefinitionDto[];

  @IsNotEmpty()
  @IsArray()
  rows: Record<string, any>[];

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsBoolean()
  isFirstBatch?: boolean;

  @IsOptional()
  @IsBoolean()
  isLastBatch?: boolean;

  @IsOptional()
  @IsNumber()
  batchIndex?: number;

  @IsOptional()
  @IsNumber()
  totalBatches?: number;

  @IsOptional()
  @IsNumber()
  totalExpectedRows?: number;
}

export class PreviewImportDto {
  @IsNotEmpty()
  @IsObject()
  columnMapping: Record<string, string>;

  @IsNotEmpty()
  @IsArray()
  rows: Record<string, any>[];

  @IsOptional()
  @IsNumber()
  totalRowCount?: number;
}
