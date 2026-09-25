'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  Mail,
  Sparkles,
  CheckCircle2,
  Copy,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  EmailTemplate,
  getStoredEmailTemplates,
  saveStoredEmailTemplate,
  deleteStoredEmailTemplate,
} from '../../../lib/templates';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [newTmpl, setNewTmpl] = useState({
    name: '',
    subject: '',
    category: 'Marketing',
    bodyText: '',
  });

  useEffect(() => {
    const stored = getStoredEmailTemplates();
    setTemplates(stored);
    if (stored.length > 0) {
      setSelectedTemplate(stored[0]);
    }
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmpl.name.trim() || !newTmpl.subject.trim()) return;

    // Detect variables
    const matches = (newTmpl.subject + ' ' + newTmpl.bodyText).match(/\{\{([^}]+)\}\}/g) || [];
    const variables = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim()))).filter(Boolean);

    const formattedHtml = newTmpl.bodyText
      ? `<p>${newTmpl.bodyText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`
      : `<p>Hello {{firstName}},</p><p>Thank you for connecting with us at {{company}}.</p><p>Best regards,<br/>The Digital Connect Team</p>`;

    const created: EmailTemplate = {
      id: `em_${Date.now()}`,
      name: newTmpl.name.trim(),
      subject: newTmpl.subject.trim(),
      category: newTmpl.category,
      bodyHtml: formattedHtml,
      bodyText: newTmpl.bodyText.trim(),
      variables: variables.length > 0 ? variables : ['firstName', 'company'],
    };

    const updated = saveStoredEmailTemplate(created);
    setTemplates(updated);
    setSelectedTemplate(created);
    setIsNewModalOpen(false);
    setNewTmpl({ name: '', subject: '', category: 'Marketing', bodyText: '' });
    setSuccessToast('Email template created successfully!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDelete = (tmpl: EmailTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete template "${tmpl.name}"?`)) return;

    const updated = deleteStoredEmailTemplate(tmpl.id);
    setTemplates(updated);
    if (selectedTemplate?.id === tmpl.id) {
      setSelectedTemplate(updated[0] || null);
    }
    setSuccessToast('Email template deleted successfully.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessToast('Template content copied!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Email Templates
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              HTML & Merge Tags
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build and manage reusable email templates with merge tags, auto-formatted HTML, and direct compose integration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Template
          </button>

          <Link
            href="/email/inbox"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Open Email Inbox
          </Link>
        </div>
      </div>

      {successToast && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Templates Grid & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max items-start content-start">
          {templates.length === 0 ? (
            <div className="col-span-full p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Mail className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">No Email Templates Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create your first email template to speed up sending emails to leads and clients.
              </p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Create Email Template
              </button>
            </div>
          ) : (
            templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group h-fit ${
                  selectedTemplate?.id === tmpl.id
                    ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate pr-2">{tmpl.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tmpl.category}
                    </span>
                    <button
                      onClick={(e) => handleDelete(tmpl, e)}
                      title="Delete template"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-2 truncate">
                  Subject: <span className="font-normal text-slate-500">{tmpl.subject}</span>
                </div>
                <div
                  className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 max-h-24 overflow-hidden bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 prose-sm"
                  dangerouslySetInnerHTML={{ __html: tmpl.bodyHtml }}
                />
              </div>
            ))
          )}
        </div>

        {/* Live Preview Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 h-fit sticky top-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Email Render Simulator
            </h2>
            {selectedTemplate && (
              <button
                onClick={() => handleDelete(selectedTemplate)}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>

          {selectedTemplate ? (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="text-xs">
                  <span className="text-slate-400 font-medium">Subject: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedTemplate.subject}</span>
                </div>
                <div
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs leading-relaxed text-slate-800 dark:text-slate-200 space-y-2"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }}
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Variables Detected:</span>
                  <span className="font-mono text-emerald-600 font-semibold">{selectedTemplate.variables.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedTemplate.category}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(selectedTemplate.bodyText || selectedTemplate.bodyHtml)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </button>
                <Link
                  href="/email/inbox"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-2xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Use in Compose
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Select a template to view the live HTML rendering.
            </div>
          )}
        </div>
      </div>

      {/* CREATE TEMPLATE MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Email Template</h3>
                  <p className="text-xs text-slate-500">Add a reusable email layout with merge tags</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Intro Offer"
                  value={newTmpl.name}
                  onChange={(e) => setNewTmpl({ ...newTmpl, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newTmpl.category}
                  onChange={(e) => setNewTmpl({ ...newTmpl, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Marketing">Marketing & Offers</option>
                  <option value="Sales">Sales & Demos</option>
                  <option value="Onboarding">Onboarding & Welcome</option>
                  <option value="Billing">Billing & Reminders</option>
                  <option value="Support">Support & Feedback</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Subject Line *
                  </label>
                  <div className="flex gap-1 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => setNewTmpl((prev) => ({ ...prev, subject: prev.subject + ' {{company}}' }))}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[10px]"
                    >
                      {'{{company}}'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Special Offer for {{company}}"
                  value={newTmpl.subject}
                  onChange={(e) => setNewTmpl({ ...newTmpl, subject: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Body Message *
                  </label>
                  <div className="flex gap-1 text-[11px] text-slate-400">
                    <span>Tags:</span>
                    <button
                      type="button"
                      onClick={() => setNewTmpl((prev) => ({ ...prev, bodyText: prev.bodyText + ' {{firstName}}' }))}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[10px]"
                    >
                      {'{{firstName}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTmpl((prev) => ({ ...prev, bodyText: prev.bodyText + ' {{company}}' }))}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[10px]"
                    >
                      {'{{company}}'}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={5}
                  placeholder="Hi {{firstName}},\n\nThank you for reaching out to The Digital Connect regarding {{company}}...\n\nBest regards,\nThe Digital Connect Team"
                  value={newTmpl.bodyText}
                  onChange={(e) => setNewTmpl({ ...newTmpl, bodyText: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
