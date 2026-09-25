'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  Building,
  FileCode,
} from 'lucide-react';
import { templatesApi, crmApi } from '../../lib/api';
import {
  WhatsAppSnippet,
  getStoredWhatsAppSnippets,
  interpolateTemplateVariables,
} from '../../lib/templates';

export interface WhatsAppComposeModalProps {
  contact: {
    _id?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    company?: string;
    email?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onActivityLogged?: () => void;
}

export function WhatsAppComposeModal({
  contact,
  isOpen,
  onClose,
  onSuccess,
  onActivityLogged,
}: WhatsAppComposeModalProps) {
  const [snippets, setSnippets] = useState<WhatsAppSnippet[]>([]);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contactName =
    contact?.fullName?.trim() ||
    `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim() ||
    'Contact';
  const firstName =
    contact?.firstName?.trim() || (contactName ? contactName.split(' ')[0] : 'Client');

  // Load snippets on modal open
  useEffect(() => {
    if (isOpen) {
      const rawPhone = contact?.whatsappNumber || contact?.phoneNumber || '';
      const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
      setPhone(cleanDigits);
      setMessageText('');
      setSelectedSnippetId('');
      setErrorMsg(null);
      setCopied(false);

      templatesApi
        .getTemplates('whatsapp')
        .then((tmpls) => {
          if (Array.isArray(tmpls) && tmpls.length > 0) {
            setSnippets(tmpls);
            // Default select first template
            handleApplySnippet(tmpls[0], tmpls);
          } else {
            const local = getStoredWhatsAppSnippets();
            setSnippets(local);
            if (local.length > 0) handleApplySnippet(local[0], local);
          }
        })
        .catch(() => {
          const local = getStoredWhatsAppSnippets();
          setSnippets(local);
          if (local.length > 0) handleApplySnippet(local[0], local);
        });
    }
  }, [isOpen, contact]);

  const handleApplySnippet = (snip: WhatsAppSnippet, allSnippets = snippets) => {
    setSelectedSnippetId(snip.id);
    const rawPhone = contact?.whatsappNumber || contact?.phoneNumber || '';
    const cleanDigits = rawPhone.replace(/[^0-9]/g, '');

    const contactCtx = {
      name: contactName,
      fullName: contactName,
      firstName: firstName,
      lastName: contact?.lastName || '',
      company: contact?.company || 'your business',
      phone: cleanDigits || rawPhone,
      email: contact?.email || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '11:00 AM',
      order_id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const interpolated = interpolateTemplateVariables(snip.bodyText, contactCtx);
    setMessageText(interpolated);
  };

  const handleSelectSnippetChange = (snippetId: string) => {
    setSelectedSnippetId(snippetId);
    if (!snippetId) return;
    const snip = snippets.find((s) => s.id === snippetId);
    if (snip) {
      handleApplySnippet(snip);
    }
  };

  const logActivity = async () => {
    if (!contact?._id) return;
    const selectedSnippet = snippets.find((s) => s.id === selectedSnippetId);
    const templateName = selectedSnippet?.name || (selectedSnippetId ? 'WhatsApp Template' : 'Custom WhatsApp');

    try {
      await crmApi.createActivity({
        contactId: contact._id,
        type: 'whatsapp',
        title: `WhatsApp sent to ${contactName} (${phone}) [Template: ${templateName}]`,
        description: messageText,
        metadata: {
          templateId: selectedSnippetId || '',
          templateName,
          recipientPhone: phone,
          recipientName: contactName,
          firstName: firstName,
          recipientEmail: contact?.email || '',
          company: contact?.company || '',
          bodySnippet: messageText.slice(0, 160),
          channel: 'whatsapp',
          status: 'sent',
        },
        createdBy: 'User',
      });

      if (onActivityLogged) {
        onActivityLogged();
      }
    } catch (err) {
      console.warn('Could not log WhatsApp activity:', err);
    }
  };

  const handleSendDirectWa = async () => {
    if (!phone) {
      setErrorMsg('Please enter a valid WhatsApp phone number.');
      return;
    }
    if (!messageText.trim()) {
      setErrorMsg('Message text cannot be empty.');
      return;
    }

    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(messageText.trim())}`;

    // Open WhatsApp Web or App
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Record activity in CRM
    await logActivity();

    if (onSuccess) {
      const selectedSnippet = snippets.find((s) => s.id === selectedSnippetId);
      onSuccess(`WhatsApp message initiated to ${contactName} (${selectedSnippet?.name || 'Template'})`);
    }
    onClose();
  };

  const handleCopyMessage = () => {
    if (!messageText) return;
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Send WhatsApp Message
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Direct & Fast
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize and send pre-approved WhatsApp templates directly to {contactName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Contact summary badge */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{contactName}</span>
              <span className="text-slate-400 font-normal">({firstName})</span>
            </div>
            {contact.company && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{contact.company}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 ml-auto">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone digits (with country code)"
                className="px-2 py-1 text-xs font-mono font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Select WhatsApp Template
              </label>
              {selectedSnippetId && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  {snippets.find((s) => s.id === selectedSnippetId)?.category || 'TEMPLATE'}
                </span>
              )}
            </div>
            <select
              value={selectedSnippetId}
              onChange={(e) => handleSelectSnippetChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            >
              <option value="">-- Custom Blank Message --</option>
              {snippets.map((snip) => (
                <option key={snip.id} value={snip.id}>
                  {snip.name} ({snip.category})
                </option>
              ))}
            </select>
          </div>

          {/* Message editor & Live Chat bubble */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>Message Text (Editable)</span>
                <span className="text-[10px] text-slate-400 font-normal">Supports markdown formatting</span>
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={10}
                placeholder="Type your WhatsApp message or select a template above..."
                className="w-full p-3 text-xs leading-relaxed rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-sans"
              />
            </div>

            {/* Live WhatsApp preview */}
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Live WhatsApp Chat Preview
              </label>
              <div className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-end min-h-[200px]">
                <div className="max-w-[90%] ml-auto bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm space-y-1">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {messageText || 'Your message preview will appear here...'}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-100/80 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendDirectWa}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
