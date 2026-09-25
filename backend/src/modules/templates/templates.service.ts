import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrmTemplate, CrmTemplateDocument } from '../../database/schemas/crm-template.schema';

const DEFAULT_WHATSAPP_SNIPPETS = [
  {
    templateId: 'wp_snip_1',
    type: 'whatsapp',
    name: 'Quick Greeting & Introduction',
    category: 'GREETING',
    bodyText: 'Hi {{name}}, thanks for connecting with us! How can we assist you today?',
    variables: ['name'],
  },
  {
    templateId: 'wp_snip_2',
    type: 'whatsapp',
    name: 'Meeting & Demo Confirmation',
    category: 'SALES',
    bodyText: 'Hello {{name}}, confirming our upcoming discussion at your scheduled time. Looking forward to speaking with you!',
    variables: ['name'],
  },
  {
    templateId: 'wp_snip_3',
    type: 'whatsapp',
    name: 'Special Pricing & Offer',
    category: 'MARKETING',
    bodyText: 'Hi {{name}}, we are offering an exclusive 20% discount on annual CRM plans for {{company}} this month. Let us know if you would like more details!',
    variables: ['name', 'company'],
  },
  {
    templateId: 'wp_snip_4',
    type: 'whatsapp',
    name: 'Customer Support Welcome',
    category: 'SUPPORT',
    bodyText: 'Hi {{name}}, welcome to The Crystal Engage VIP support channel. How can our team assist you today?',
    variables: ['name'],
  },
  {
    templateId: 'wp_snip_5',
    type: 'whatsapp',
    name: 'Lead Follow-up & Introduction',
    category: 'SALES',
    bodyText: 'Hello {{name}}, I hope you are having a productive week! Following up regarding your inquiry with {{company}}. When would be a good time for a quick 5-minute call?',
    variables: ['name', 'company'],
  },
];

const DEFAULT_EMAIL_TEMPLATES = [
  {
    templateId: 'em_tmpl_1',
    type: 'email',
    name: 'B2B Welcome Introduction',
    subject: 'Welcome to The Crystal Engage, {{firstName}}!',
    category: 'Onboarding',
    bodyHtml: `<p>Hi {{firstName}},</p><p>Thank you for connecting with us at {{company}}. We are thrilled to show you how our The Crystal Engage CRM platform can streamline your customer relationships and multi-channel outbound campaigns.</p><p>Best regards,<br/><strong>The Crystal Engage Team</strong></p>`,
    bodyText: `Hi {{firstName}},\n\nThank you for connecting with us at {{company}}. We are thrilled to show you how our The Crystal Engage CRM platform can streamline your customer relationships and outbound campaigns.\n\nBest regards,\nThe Crystal Engage Team`,
    variables: ['firstName', 'company'],
  },
  {
    templateId: 'em_tmpl_2',
    type: 'email',
    name: 'Product Demo Follow-Up',
    subject: 'Quick recap from our discussion, {{firstName}}',
    category: 'Sales',
    bodyHtml: `<p>Hello {{firstName}},</p><p>Following up on our recent product demo for {{company}}. Attached you will find our custom proposal and integration roadmap.</p><p>Feel free to reply directly with any questions!</p><p>Warm regards,<br/>The Crystal Engage Team</p>`,
    bodyText: `Hello {{firstName}},\n\nFollowing up on our recent product demo for {{company}}. Attached you will find our custom proposal and integration roadmap.\n\nFeel free to reply directly with any questions!\n\nWarm regards,\nThe Crystal Engage Team`,
    variables: ['firstName', 'company'],
  },
  {
    templateId: 'em_tmpl_3',
    type: 'email',
    name: 'Special Promotion Offer',
    subject: 'Exclusive growth offer for {{company}}',
    category: 'Marketing',
    bodyHtml: `<p>Dear {{fullName}},</p><p>We are offering special annual subscription pricing for high-volume WhatsApp & Email automation teams.</p><p>Claim your discount before the end of the quarter!</p><p>Best,<br/>The Crystal Engage Team</p>`,
    bodyText: `Dear {{fullName}},\n\nWe are offering special annual subscription pricing for high-volume WhatsApp & Email automation teams.\n\nClaim your discount before the end of the quarter!\n\nBest,\nThe Crystal Engage Team`,
    variables: ['fullName', 'company'],
  },
  {
    templateId: 'em_tmpl_4',
    type: 'email',
    name: 'Payment & Invoice Reminder',
    subject: 'Invoice reminder for {{company}}',
    category: 'Billing',
    bodyHtml: `<p>Dear {{firstName}},</p><p>This is a gentle reminder that your pending subscription invoice for {{company}} is due this week.</p><p>You can review and settle your balance via your payment dashboard.</p><p>Thank you for your business,<br/>Accounting Team</p>`,
    bodyText: `Dear {{firstName}},\n\nThis is a gentle reminder that your pending subscription invoice for {{company}} is due this week.\n\nYou can review and settle your balance via your payment dashboard.\n\nThank you for your business,\nAccounting Team`,
    variables: ['firstName', 'company'],
  },
];

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger('TemplatesService');

  constructor(
    @InjectModel(CrmTemplate.name)
    private readonly templateModel: Model<CrmTemplateDocument>,
  ) {}

  async getTemplates(orgId: string, type: 'whatsapp' | 'email') {
    const cleanOrg = (orgId || 'default-org').trim();
    let templates = await this.templateModel
      .find({ organizationId: cleanOrg, type })
      .sort({ createdAt: -1 })
      .exec();

    // Check if initial seeding needed
    if (!templates || templates.length === 0) {
      const defaults = type === 'whatsapp' ? DEFAULT_WHATSAPP_SNIPPETS : DEFAULT_EMAIL_TEMPLATES;
      try {
        const seeded = defaults.map((d) => ({
          ...d,
          organizationId: cleanOrg,
        }));
        await this.templateModel.insertMany(seeded, { ordered: false });
        templates = await this.templateModel
          .find({ organizationId: cleanOrg, type })
          .sort({ createdAt: -1 })
          .exec();
      } catch (err: any) {
        this.logger.warn(`Could not seed default templates: ${err.message}`);
      }
    }

    return templates.map((t) => ({
      id: t.templateId,
      templateId: t.templateId,
      type: t.type,
      name: t.name,
      category: t.category,
      subject: t.subject || '',
      bodyText: t.bodyText || '',
      bodyHtml: t.bodyHtml || '',
      variables: t.variables || [],
      createdAt: (t as any).createdAt,
      updatedAt: (t as any).updatedAt,
    }));
  }

  async saveTemplate(orgId: string, data: any) {
    const cleanOrg = (orgId || 'default-org').trim();
    const templateId = data.templateId || data.id || `tmpl_${Date.now()}`;
    const type = data.type || (data.subject !== undefined ? 'email' : 'whatsapp');

    const updateDoc = {
      organizationId: cleanOrg,
      type,
      templateId,
      name: (data.name || 'Untitled Template').trim(),
      category: (data.category || 'General').trim(),
      subject: (data.subject || '').trim(),
      bodyText: (data.bodyText || '').trim(),
      bodyHtml: data.bodyHtml || '',
      variables: Array.isArray(data.variables) ? data.variables : [],
    };

    const updated = await this.templateModel.findOneAndUpdate(
      { organizationId: cleanOrg, templateId },
      updateDoc,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    return {
      id: updated.templateId,
      templateId: updated.templateId,
      type: updated.type,
      name: updated.name,
      category: updated.category,
      subject: updated.subject || '',
      bodyText: updated.bodyText || '',
      bodyHtml: updated.bodyHtml || '',
      variables: updated.variables || [],
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };
  }

  async deleteTemplate(orgId: string, templateId: string) {
    const cleanOrg = (orgId || 'default-org').trim();
    await this.templateModel.deleteOne({ organizationId: cleanOrg, templateId }).exec();
    return { success: true, deletedId: templateId };
  }
}
