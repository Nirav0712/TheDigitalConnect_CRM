'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  MessageSquare,
  Mail,
  Search,
  Filter,
  RefreshCw,
  X,
  Clock,
  User,
  Phone,
  Building,
  Tag,
  ChevronRight,
  Send,
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { crmApi, extractErrorMessage } from '../../lib/api';

export interface LiveCommunicationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact?: (contact: any) => void;
  onComposeWhatsApp?: (contact: any) => void;
  onComposeEmail?: (contact: any) => void;
  refreshTrigger?: number;
}

export function LiveCommunicationSidebar({
  isOpen,
  onClose,
  onSelectContact,
  onComposeWhatsApp,
  onComposeEmail,
  refreshTrigger = 0,
}: LiveCommunicationSidebarProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await crmApi.getActivities(undefined, undefined, 60);
      const items = Array.isArray(res) ? res : [];
      // Filter primarily for communication activities (whatsapp / email)
      setActivities(items);
    } catch (err) {
      console.warn('Failed to load communication activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, refreshTrigger]);

  // Auto-refresh when open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      crmApi.getActivities(undefined, undefined, 60).then((res) => {
        if (Array.isArray(res)) setActivities(res);
      }).catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const communicationActivities = activities.filter((a) => {
    const isComm = a.type === 'whatsapp' || a.type === 'email';
    if (!isComm) return false;
    if (channelFilter !== 'all' && a.type !== channelFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const meta = a.metadata || {};
      const contactObj = a.contactId || {};
      const name = (meta.recipientName || meta.contactName || contactObj.fullName || '').toLowerCase();
      const firstName = (meta.firstName || '').toLowerCase();
      const phone = (meta.recipientPhone || contactObj.phoneNumber || contactObj.whatsappNumber || '').toLowerCase();
      const email = (meta.recipientEmail || contactObj.email || '').toLowerCase();
      const tmpl = (meta.templateName || '').toLowerCase();
      const title = (a.title || '').toLowerCase();

      return (
        name.includes(q) ||
        firstName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        tmpl.includes(q) ||
        title.includes(q)
      );
    }

    return true;
  });

  const handleCopy = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Outbound Sent Stream
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {communicationActivities.length} Sent
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live tracking of all WhatsApp messages & emails sent to contacts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={loadActivities}
            disabled={loading}
            title="Refresh stream"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contact name, phone, email, or template..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setChannelFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              channelFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Channels ({activities.filter((a) => a.type === 'whatsapp' || a.type === 'email').length})
          </button>
          <button
            type="button"
            onClick={() => setChannelFilter('whatsapp')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              channelFilter === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            WhatsApp ({activities.filter((a) => a.type === 'whatsapp').length})
          </button>
          <button
            type="button"
            onClick={() => setChannelFilter('email')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              channelFilter === 'email'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/60'
            }`}
          >
            <Mail className="w-3 h-3" />
            Email ({activities.filter((a) => a.type === 'email').length})
          </button>
        </div>
      </div>

      {/* Activity List Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-xs">Loading sent communications...</span>
          </div>
        ) : communicationActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Send className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No sent messages found
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[260px]">
              When you send an Email or WhatsApp template from any contact row, it will automatically appear here with template name and recipient details.
            </p>
          </div>
        ) : (
          communicationActivities.map((act) => {
            const isWa = act.type === 'whatsapp';
            const meta = act.metadata || {};
            const contactObj = act.contactId || {};

            const recipientName =
              meta.recipientName ||
              meta.contactName ||
              contactObj.fullName ||
              `${contactObj.firstName || ''} ${contactObj.lastName || ''}`.trim() ||
              'Contact';
            const firstName =
              meta.firstName ||
              contactObj.firstName ||
              (recipientName ? recipientName.split(' ')[0] : 'Client');
            const recipientPhone =
              meta.recipientPhone || contactObj.phoneNumber || contactObj.whatsappNumber || '';
            const recipientEmail =
              meta.recipientEmail || contactObj.email || contactObj.alternateEmail || '';
            const templateName =
              meta.templateName || (isWa ? 'WhatsApp Message' : 'Email Message');
            const subject = meta.subject || '';
            const messageBody = act.description || meta.bodySnippet || '';
            const isExpanded = expandedActivityId === act._id;

            return (
              <div
                key={act._id}
                className="pt-2.5 first:pt-0 group rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2.5 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
              >
                {/* Top Row: Channel Badge + Template Name + Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isWa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <MessageSquare className="w-2.5 h-2.5" />
                        WhatsApp
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Mail className="w-2.5 h-2.5" />
                        Email
                      </span>
                    )}

                    {/* Template Name Badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 truncate max-w-[200px]" title={templateName}>
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      {templateName}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelativeTime(act.performedAt || act.createdAt)}
                  </span>
                </div>

                {/* Contact Recipient Info */}
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{recipientName}</span>
                      {firstName && firstName !== recipientName && (
                        <span className="text-[11px] font-normal text-slate-400">({firstName})</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {isWa && recipientPhone && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                          <Phone className="w-3 h-3" />
                          {recipientPhone}
                        </span>
                      )}
                      {!isWa && recipientEmail && (
                        <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-mono font-medium truncate max-w-[220px]">
                          <Mail className="w-3 h-3" />
                          {recipientEmail}
                        </span>
                      )}
                      {isWa && recipientEmail && (
                        <span className="flex items-center gap-1 text-slate-400 truncate max-w-[150px]">
                          ✉ {recipientEmail}
                        </span>
                      )}
                      {!isWa && recipientPhone && (
                        <span className="flex items-center gap-1 text-slate-400 font-mono">
                          📞 {recipientPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(messageBody || subject, act._id, e)}
                      title="Copy message text"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {copiedId === act._id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {isWa && onComposeWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onComposeWhatsApp(contactObj._id ? contactObj : { _id: act.contactId, fullName: recipientName, firstName, phoneNumber: recipientPhone, whatsappNumber: recipientPhone, email: recipientEmail })}
                        title="Send another WhatsApp"
                        className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isWa && onComposeEmail && (
                      <button
                        type="button"
                        onClick={() => onComposeEmail(contactObj._id ? contactObj : { _id: act.contactId, fullName: recipientName, firstName, email: recipientEmail, phoneNumber: recipientPhone })}
                        title="Send another Email"
                        className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Subject if present */}
                {subject && (
                  <div className="mt-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    Subject: {subject}
                  </div>
                )}

                {/* Message Snippet & Toggle View */}
                {messageBody && (
                  <div className="mt-1.5">
                    <div
                      onClick={() => setExpandedActivityId(isExpanded ? null : act._id)}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <p className={`whitespace-pre-wrap font-sans leading-relaxed text-[11px] ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {messageBody}
                      </p>
                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px] text-slate-400 font-medium">
                        <span>{isExpanded ? 'Click to collapse' : 'Click to see full message'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Auto-synced with MongoDB Atlas</span>
        <button
          type="button"
          onClick={loadActivities}
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
}
