/**
 * Shared Template Management for WhatsApp and Email
 * Provides persistent storage (localStorage) + variable substitution helpers.
 * Ensures deleted templates remain permanently deleted across tabs, reloads, and empty states.
 */

export interface WhatsAppSnippet {
  id: string;
  name: string;
  category: string;
  bodyText: string;
  variables: string[];
  connectionId?: string;
  isMeta?: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
}

export const DEFAULT_WHATSAPP_SNIPPETS: WhatsAppSnippet[] = [
  {
    id: 'wp_snip_web_dev',
    name: 'website_development',
    category: 'SALES',
    bodyText: `Hello {{firstName}},\n\nWe hope you're doing well!\n\nAre you looking to build a professional website for {{company}}? 🌐\n\nAt The Crystal Engage, we help businesses create modern, responsive, and SEO-friendly websites that attract customers and strengthen their online presence.\n\nOur Website Development Services Include:\n✅ Custom & Modern Website Design\n✅ Mobile Responsive & Fast Loading\n✅ E-Commerce & Business Websites\n✅ SEO-Friendly Structure\n✅ Lead Capture & WhatsApp Integration\n\nLet's connect for a quick 10-minute discussion to see how we can build the perfect website for your business.\n\nAre you available for a quick call today or tomorrow?`,
    variables: ['firstName', 'company'],
  },
  {
    id: 'wp_snip_web_redesign',
    name: 'website_redesign',
    category: 'SALES',
    bodyText: `Hello {{firstName}},\n\nWe came across {{company}} and wanted to connect with you regarding your website.\n\nIs your existing website looking outdated or in need of a modern upgrade? 💻✨\n\nAt The Crystal Engage, we help businesses redesign their websites with modern UI/UX, improved performance, and a better user experience.\n\nOur Website Redesign Services Include:\n✅ Fresh & Modern UI/UX Design\n✅ Faster Speed & Performance Optimization\n✅ Mobile-First & Responsive Layout\n✅ Conversion-Focused Design\n✅ SEO & WhatsApp Integration\n\nWould you be open to a quick 10-minute chat to discuss how we can revamp your website?\n\nLet us know a convenient time for a call!`,
    variables: ['firstName', 'company'],
  },
  {
    id: 'wp_snip_1',
    name: 'Order Confirmation & Receipt',
    category: 'TRANSACTIONAL',
    bodyText: 'Hello {{name}}, thank you for your order! Your booking ID is {{order_id}}. We are preparing your shipment and will update you shortly.',
    variables: ['name', 'order_id'],
  },
  {
    id: 'wp_snip_2',
    name: 'Appointment Reminder',
    category: 'UTILITY',
    bodyText: 'Hi {{name}}, this is a friendly reminder for your scheduled appointment on {{date}} at {{time}}. Please reply YES to confirm.',
    variables: ['name', 'date', 'time'],
  },
  {
    id: 'wp_snip_3',
    name: 'Special Festive Offer',
    category: 'MARKETING',
    bodyText: 'Exciting news {{name}}! Get an exclusive 25% discount on all our premium services this week with code FESTIVE25. Visit our store or reply to claim!',
    variables: ['name'],
  },
  {
    id: 'wp_snip_4',
    name: 'Customer Support Welcome',
    category: 'SUPPORT',
    bodyText: 'Hi {{name}}, welcome to The Crystal Engage VIP support channel. How can our team assist you today?',
    variables: ['name'],
  },
  {
    id: 'wp_snip_5',
    name: 'Lead Follow up & Introduction',
    category: 'SALES',
    bodyText: 'Hello {{name}}, I hope you are having a productive week! Following up regarding your inquiry with {{company}}. When would be a good time for a quick 5-minute call?',
    variables: ['name', 'company'],
  },
];

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'em_tmpl_1',
    name: 'B2B Welcome Introduction',
    subject: 'Welcome to The Crystal Engage, {{firstName}}!',
    category: 'Onboarding',
    bodyHtml: `<p>Hi {{firstName}},</p><p>Thank you for connecting with us at {{company}}. We are thrilled to show you how our The Crystal Engage CRM platform can streamline your customer relationships and multi-channel outbound campaigns.</p><p>Best regards,<br/><strong>The Crystal Engage Team</strong></p>`,
    bodyText: `Hi {{firstName}},\n\nThank you for connecting with us at {{company}}. We are thrilled to show you how our The Crystal Engage CRM platform can streamline your customer relationships and outbound campaigns.\n\nBest regards,\nThe Crystal Engage Team`,
    variables: ['firstName', 'company'],
  },
  {
    id: 'em_tmpl_2',
    name: 'Product Demo Follow-Up',
    subject: 'Quick recap from our discussion, {{firstName}}',
    category: 'Sales',
    bodyHtml: `<p>Hello {{firstName}},</p><p>Following up on our recent product demo for {{company}}. Attached you will find our custom proposal and integration roadmap.</p><p>Feel free to reply directly with any questions!</p><p>Warm regards,<br/>The Crystal Engage Team</p>`,
    bodyText: `Hello {{firstName}},\n\nFollowing up on our recent product demo for {{company}}. Attached you will find our custom proposal and integration roadmap.\n\nFeel free to reply directly with any questions!\n\nWarm regards,\nThe Crystal Engage Team`,
    variables: ['firstName', 'company'],
  },
  {
    id: 'em_tmpl_3',
    name: 'Special Promotion Offer',
    subject: 'Exclusive growth offer for {{company}}',
    category: 'Marketing',
    bodyHtml: `<p>Dear {{fullName}},</p><p>We are offering special annual subscription pricing for high-volume WhatsApp & Email automation teams.</p><p>Claim your discount before the end of the quarter!</p><p>Best,<br/>The Crystal Engage Team</p>`,
    bodyText: `Dear {{fullName}},\n\nWe are offering special annual subscription pricing for high-volume WhatsApp & Email automation teams.\n\nClaim your discount before the end of the quarter!\n\nBest,\nThe Crystal Engage Team`,
    variables: ['fullName', 'company'],
  },
  {
    id: 'em_tmpl_4',
    name: 'Payment & Invoice Reminder',
    subject: 'Invoice Reminder: {{company}}',
    category: 'Billing',
    bodyHtml: `<p>Hi {{firstName}},</p><p>This is a gentle reminder that invoice for {{company}} is due. Please review the attached invoice or let us know if you need any assistance.</p><p>Thank you,<br/>Finance Team</p>`,
    bodyText: `Hi {{firstName}},\n\nThis is a gentle reminder that invoice for {{company}} is due. Please review the attached invoice or let us know if you need any assistance.\n\nThank you,\nFinance Team`,
    variables: ['firstName', 'company'],
  },
];

const WP_STORAGE_KEY = 'tdc_whatsapp_snippets_v2';
const WP_INITIALIZED_KEY = 'tdc_whatsapp_snippets_init_v2';
const WP_DELETED_KEY = 'tdc_whatsapp_snippets_deleted_v2';

const EMAIL_STORAGE_KEY = 'tdc_email_templates_v2';
const EMAIL_INITIALIZED_KEY = 'tdc_email_templates_init_v2';
const EMAIL_DELETED_KEY = 'tdc_email_templates_deleted_v2';

function getDeletedWhatsAppIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(WP_DELETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function getDeletedEmailIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(EMAIL_DELETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

// ================= WhatsApp Snippets Management =================

export function getStoredWhatsAppSnippets(): WhatsAppSnippet[] {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_SNIPPETS;
  try {
    const deleted = getDeletedWhatsAppIds();
    const isInit = localStorage.getItem(WP_INITIALIZED_KEY);

    if (!isInit) {
      // Check v1 storage for backward compatibility
      const oldRaw = localStorage.getItem('tdc_whatsapp_snippets_v1');
      let initialData = DEFAULT_WHATSAPP_SNIPPETS;
      if (oldRaw) {
        try {
          const parsedOld = JSON.parse(oldRaw);
          if (Array.isArray(parsedOld)) initialData = parsedOld;
        } catch {}
      }
      const filtered = initialData.filter((s) => !deleted.has(s.id));
      localStorage.setItem(WP_STORAGE_KEY, JSON.stringify(filtered));
      localStorage.setItem(WP_INITIALIZED_KEY, 'true');
      return filtered;
    }

    const raw = localStorage.getItem(WP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && s.id && !deleted.has(s.id));
  } catch (err) {
    return [];
  }
}

export function saveStoredWhatsAppSnippet(snippet: WhatsAppSnippet): WhatsAppSnippet[] {
  if (typeof window === 'undefined') return [snippet];
  try {
    const deleted = getDeletedWhatsAppIds();
    if (deleted.has(snippet.id)) {
      deleted.delete(snippet.id);
      localStorage.setItem(WP_DELETED_KEY, JSON.stringify(Array.from(deleted)));
    }

    const current = getStoredWhatsAppSnippets();
    const existingIdx = current.findIndex((s) => s.id === snippet.id);
    let updated: WhatsAppSnippet[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = snippet;
    } else {
      updated = [snippet, ...current];
    }
    localStorage.setItem(WP_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(WP_INITIALIZED_KEY, 'true');
    return updated;
  } catch (err) {
    return [snippet];
  }
}

export function deleteStoredWhatsAppSnippet(id: string): WhatsAppSnippet[] {
  if (typeof window === 'undefined') return [];
  try {
    // Mark as permanently deleted
    const deleted = getDeletedWhatsAppIds();
    deleted.add(id);
    localStorage.setItem(WP_DELETED_KEY, JSON.stringify(Array.from(deleted)));

    const current = getStoredWhatsAppSnippets();
    const updated = current.filter((s) => s.id !== id);
    localStorage.setItem(WP_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(WP_INITIALIZED_KEY, 'true');

    // Also clean up old v1 key if present
    try {
      const v1Raw = localStorage.getItem('tdc_whatsapp_snippets_v1');
      if (v1Raw) {
        const v1Parsed = JSON.parse(v1Raw);
        if (Array.isArray(v1Parsed)) {
          localStorage.setItem('tdc_whatsapp_snippets_v1', JSON.stringify(v1Parsed.filter((s: any) => s.id !== id)));
        }
      }
    } catch {}

    return updated;
  } catch (err) {
    return [];
  }
}

// ================= Email Templates Management =================

export function getStoredEmailTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_EMAIL_TEMPLATES;
  try {
    const deleted = getDeletedEmailIds();
    const isInit = localStorage.getItem(EMAIL_INITIALIZED_KEY);

    if (!isInit) {
      // Check v1 storage for backward compatibility
      const oldRaw = localStorage.getItem('tdc_email_templates_v1');
      let initialData = DEFAULT_EMAIL_TEMPLATES;
      if (oldRaw) {
        try {
          const parsedOld = JSON.parse(oldRaw);
          if (Array.isArray(parsedOld)) initialData = parsedOld;
        } catch {}
      }
      const filtered = initialData.filter((t) => !deleted.has(t.id));
      localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(filtered));
      localStorage.setItem(EMAIL_INITIALIZED_KEY, 'true');
      return filtered;
    }

    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && t.id && !deleted.has(t.id));
  } catch (err) {
    return [];
  }
}

export function saveStoredEmailTemplate(template: EmailTemplate): EmailTemplate[] {
  if (typeof window === 'undefined') return [template];
  try {
    const deleted = getDeletedEmailIds();
    if (deleted.has(template.id)) {
      deleted.delete(template.id);
      localStorage.setItem(EMAIL_DELETED_KEY, JSON.stringify(Array.from(deleted)));
    }

    const current = getStoredEmailTemplates();
    const existingIdx = current.findIndex((t) => t.id === template.id);
    let updated: EmailTemplate[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = template;
    } else {
      updated = [template, ...current];
    }
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(EMAIL_INITIALIZED_KEY, 'true');
    return updated;
  } catch (err) {
    return [template];
  }
}

export function deleteStoredEmailTemplate(id: string): EmailTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    // Mark as permanently deleted
    const deleted = getDeletedEmailIds();
    deleted.add(id);
    localStorage.setItem(EMAIL_DELETED_KEY, JSON.stringify(Array.from(deleted)));

    const current = getStoredEmailTemplates();
    const updated = current.filter((t) => t.id !== id);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(EMAIL_INITIALIZED_KEY, 'true');

    // Also clean up old v1 key if present
    try {
      const v1Raw = localStorage.getItem('tdc_email_templates_v1');
      if (v1Raw) {
        const v1Parsed = JSON.parse(v1Raw);
        if (Array.isArray(v1Parsed)) {
          localStorage.setItem('tdc_email_templates_v1', JSON.stringify(v1Parsed.filter((t: any) => t.id !== id)));
        }
      }
    } catch {}

    return updated;
  } catch (err) {
    return [];
  }
}

// ================= Variable Interpolation Helper =================

export function interpolateTemplateVariables(
  templateText: string,
  context?: {
    name?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  },
): string {
  if (!templateText) return '';
  const ctx = context || {};

  const resolvedName =
    ctx.fullName ||
    ctx.name ||
    [ctx.firstName, ctx.lastName].filter(Boolean).join(' ') ||
    'there';

  const resolvedFirstName =
    ctx.firstName ||
    (resolvedName !== 'there' ? resolvedName.split(' ')[0] : 'there');

  const resolvedCompany = ctx.company || 'your organization';
  const resolvedEmail = ctx.email || '';
  const resolvedPhone = ctx.phone || '';

  return templateText
    .replace(/\{\{\s*name\s*\}\}/gi, resolvedName)
    .replace(/\{\{\s*fullName\s*\}\}/gi, resolvedName)
    .replace(/\{\{\s*firstName\s*\}\}/gi, resolvedFirstName)
    .replace(/\{\{\s*lastName\s*\}\}/gi, ctx.lastName || '')
    .replace(/\{\{\s*company\s*\}\}/gi, resolvedCompany)
    .replace(/\{\{\s*email\s*\}\}/gi, resolvedEmail)
    .replace(/\{\{\s*phone\s*\}\}/gi, resolvedPhone);
}
