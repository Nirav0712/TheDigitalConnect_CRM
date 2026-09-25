/**
 * Shared Template Management for WhatsApp and Email
 * Provides persistent storage (localStorage) + variable substitution helpers.
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
    bodyText: 'Hi {{name}}, welcome to The Digital Connect VIP support channel. How can our team assist you today?',
    variables: ['name'],
  },
  {
    id: 'wp_snip_5',
    name: 'Lead Follow-up & Introduction',
    category: 'SALES',
    bodyText: 'Hello {{name}}, I hope you are having a productive week! Following up regarding your inquiry with {{company}}. When would be a good time for a quick 5-minute call?',
    variables: ['name', 'company'],
  },
];

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'em_tmpl_1',
    name: 'B2B Welcome Introduction',
    subject: 'Welcome to The Digital Connect, {{firstName}}!',
    category: 'Onboarding',
    bodyHtml: `<p>Hi {{firstName}},</p><p>Thank you for connecting with us at {{company}}. We are thrilled to show you how our The Digital Connect CRM platform can streamline your customer relationships and multi-channel outbound campaigns.</p><p>Best regards,<br/><strong>The Digital Connect Team</strong></p>`,
    bodyText: `Hi {{firstName}},\n\nThank you for connecting with us at {{company}}. We are thrilled to show you how our The Digital Connect CRM platform can streamline your customer relationships and outbound campaigns.\n\nBest regards,\nThe Digital Connect Team`,
    variables: ['firstName', 'company'],
  },
  {
    id: 'em_tmpl_2',
    name: 'Product Demo Follow-Up',
    subject: 'Quick recap from our discussion, {{firstName}}',
    category: 'Sales',
    bodyHtml: `<p>Hello {{firstName}},</p><p>Following up on our recent product demo for {{company}}. Attached you will find our custom proposal and integration roadmap.</p><p>Feel free to reply directly with any questions!</p><p>Warm regards,<br/>The Digital Connect Team</p>`,
    bodyText: `Hello {{firstName}},\n\nFollowing up on our recent product demo for {{company}}. Attached you will find our custom proposal and integration roadmap.\n\nFeel free to reply directly with any questions!\n\nWarm regards,\nThe Digital Connect Team`,
    variables: ['firstName', 'company'],
  },
  {
    id: 'em_tmpl_3',
    name: 'Special Promotion Offer',
    subject: 'Exclusive growth offer for {{company}}',
    category: 'Marketing',
    bodyHtml: `<p>Dear {{fullName}},</p><p>We are offering special annual subscription pricing for high-volume WhatsApp & Email automation teams.</p><p>Claim your discount before the end of the quarter!</p><p>Best,<br/>The Digital Connect Team</p>`,
    bodyText: `Dear {{fullName}},\n\nWe are offering special annual subscription pricing for high-volume WhatsApp & Email automation teams.\n\nClaim your discount before the end of the quarter!\n\nBest,\nThe Digital Connect Team`,
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

const WP_STORAGE_KEY = 'tdc_whatsapp_snippets_v1';
const EMAIL_STORAGE_KEY = 'tdc_email_templates_v1';

// ================= WhatsApp Snippets Management =================

export function getStoredWhatsAppSnippets(): WhatsAppSnippet[] {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_SNIPPETS;
  try {
    const raw = localStorage.getItem(WP_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WP_STORAGE_KEY, JSON.stringify(DEFAULT_WHATSAPP_SNIPPETS));
      return DEFAULT_WHATSAPP_SNIPPETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WHATSAPP_SNIPPETS;
  } catch (err) {
    return DEFAULT_WHATSAPP_SNIPPETS;
  }
}

export function saveStoredWhatsAppSnippet(snippet: WhatsAppSnippet): WhatsAppSnippet[] {
  const current = getStoredWhatsAppSnippets();
  const existingIdx = current.findIndex((s) => s.id === snippet.id);
  let updated: WhatsAppSnippet[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = snippet;
  } else {
    updated = [snippet, ...current];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(WP_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteStoredWhatsAppSnippet(id: string): WhatsAppSnippet[] {
  const current = getStoredWhatsAppSnippets();
  const updated = current.filter((s) => s.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(WP_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

// ================= Email Templates Management =================

export function getStoredEmailTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_EMAIL_TEMPLATES;
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(DEFAULT_EMAIL_TEMPLATES));
      return DEFAULT_EMAIL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EMAIL_TEMPLATES;
  } catch (err) {
    return DEFAULT_EMAIL_TEMPLATES;
  }
}

export function saveStoredEmailTemplate(template: EmailTemplate): EmailTemplate[] {
  const current = getStoredEmailTemplates();
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: EmailTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = template;
  } else {
    updated = [template, ...current];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteStoredEmailTemplate(id: string): EmailTemplate[] {
  const current = getStoredEmailTemplates();
  const updated = current.filter((t) => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
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
