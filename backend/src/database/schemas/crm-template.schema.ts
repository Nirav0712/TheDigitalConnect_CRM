import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CrmTemplateDocument = CrmTemplate & Document;

@Schema({ timestamps: true, collection: 'crm_templates' })
export class CrmTemplate {
  @Prop({ required: true, trim: true, index: true, default: 'default-org' })
  organizationId: string;

  @Prop({ required: true, enum: ['whatsapp', 'email'], index: true })
  type: string; // 'whatsapp' | 'email'

  @Prop({ required: true, trim: true, index: true })
  templateId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, default: 'General' })
  category: string;

  @Prop({ trim: true, default: '' })
  subject?: string;

  @Prop({ required: true, default: '' })
  bodyText: string;

  @Prop({ default: '' })
  bodyHtml?: string;

  @Prop({ type: [String], default: [] })
  variables: string[];
}

export const CrmTemplateSchema = SchemaFactory.createForClass(CrmTemplate);
CrmTemplateSchema.index({ organizationId: 1, type: 1, templateId: 1 }, { unique: true });
