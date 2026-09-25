'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Send,
  Copy,
  Zap,
  ShieldCheck,
  QrCode,
  Trash2,
  Pencil,
  X,
  ExternalLink,
} from 'lucide-react';
import { whatsappApi, templatesApi, extractErrorMessage } from '../../../lib/api';
import {
  WhatsAppSnippet,
  getStoredWhatsAppSnippets,
  saveStoredWhatsAppSnippet,
  deleteStoredWhatsAppSnippet,
} from '../../../lib/templates';

export default function WhatsAppTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'regular' | 'official'>('regular');
  const [templates, setTemplates] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // Regular snippets state
  const [snippets, setSnippets] = useState<WhatsAppSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<WhatsAppSnippet | null>(null);

  // Create / Edit Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<WhatsAppSnippet | null>(null);
  const [newSnippetName, setNewSnippetName] = useState('');
  const [newSnippetCategory, setNewSnippetCategory] = useState('MARKETING');
  const [newSnippetBody, setNewSnippetBody] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const [dbSnippets, conns, tmpls] = await Promise.all([
        templatesApi.getTemplates('whatsapp').catch(() => getStoredWhatsAppSnippets()),
        whatsappApi.getConnections().catch(() => []),
        whatsappApi.getTemplates(selectedConnectionId || undefined).catch(() => []),
      ]);

      const finalSnippets = dbSnippets && dbSnippets.length > 0 ? dbSnippets : getStoredWhatsAppSnippets();
      setSnippets(finalSnippets);
      if (finalSnippets.length > 0 && !selectedSnippet) {
        setSelectedSnippet(finalSnippets[0]);
      }

      setConnections(conns || []);
      setTemplates(tmpls || []);

      if (tmpls && tmpls.length > 0 && !selectedTemplate) {
        setSelectedTemplate(tmpls[0]);
      }
    } catch (err) {
      setErrorBanner(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedConnectionId]);

  const handleSync = async () => {
    const metaConn =
      connections.find((c) => c._id === selectedConnectionId && c.providerType === 'official_meta') ||
      connections.find((c) => c.providerType === 'official_meta');

    if (!metaConn) {
      alert('Please select or configure an Official Meta Cloud API connection to sync templates.');
      return;
    }

    setSyncing(true);
    try {
      await whatsappApi.syncTemplates(metaConn._id);
      setSuccessToast('Templates synced successfully from Meta Business Manager!');
      loadData();
    } catch (err) {
      alert(`Template sync failed: ${extractErrorMessage(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEdit = (snip: WhatsAppSnippet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSnippet(snip);
    setNewSnippetName(snip.name);
    setNewSnippetCategory(snip.category);
    setNewSnippetBody(snip.bodyText);
    setShowCreateModal(true);
  };

  const handleSaveSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnippetName.trim() || !newSnippetBody.trim()) {
      alert('Please provide a snippet name and template message body.');
      return;
    }

    // Extract {{variables}} from body
    const matches = newSnippetBody.match(/\{\{([^}]+)\}\}/g) || [];
    const variables = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim()))).filter(Boolean);

    const snippetToSave: WhatsAppSnippet = {
      id: editingSnippet ? editingSnippet.id : `snip_${Date.now()}`,
      name: newSnippetName.trim(),
      category: newSnippetCategory,
      bodyText: newSnippetBody.trim(),
      variables: variables.length > 0 ? variables : ['name'],
    };

    try {
      const saved = await templatesApi.saveTemplate({ ...snippetToSave, type: 'whatsapp' });
      const updatedList = await templatesApi.getTemplates('whatsapp').catch(() => []);
      const finalUpdated = updatedList.length > 0 ? updatedList : [saved];
      setSnippets(finalUpdated);
      setSelectedSnippet(saved);
      saveStoredWhatsAppSnippet(saved);
    } catch {
      const updated = saveStoredWhatsAppSnippet(snippetToSave);
      setSnippets(updated);
      setSelectedSnippet(snippetToSave);
    }

    setShowCreateModal(false);
    setEditingSnippet(null);
    setNewSnippetName('');
    setNewSnippetCategory('MARKETING');
    setNewSnippetBody('');
    setSuccessToast(editingSnippet ? 'WhatsApp template updated successfully!' : 'WhatsApp template created successfully!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDeleteSnippet = async (snip: WhatsAppSnippet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete template "${snip.name}"?`)) return;

    try {
      await templatesApi.deleteTemplate(snip.id);
      const updatedList = await templatesApi.getTemplates('whatsapp').catch(() => []);
      setSnippets(updatedList);
      if (selectedSnippet?.id === snip.id) {
        setSelectedSnippet(updatedList[0] || null);
      }
      deleteStoredWhatsAppSnippet(snip.id);
    } catch {
      const updated = deleteStoredWhatsAppSnippet(snip.id);
      setSnippets(updated);
      if (selectedSnippet?.id === snip.id) {
        setSelectedSnippet(updated[0] || null);
      }
    }

    setSuccessToast('WhatsApp template deleted successfully.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDeleteMetaTemplate = async (tmpl: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete Meta template "${tmpl.name}"?`)) return;

    try {
      if (tmpl._id) {
        await whatsappApi.deleteTemplate(tmpl._id);
      }
      setTemplates((prev) => prev.filter((t) => t._id !== tmpl._id));
      if (selectedTemplate?._id === tmpl._id) {
        setSelectedTemplate(null);
      }
      setSuccessToast('Meta template removed.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      alert(`Failed to delete template: ${extractErrorMessage(err)}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessToast('Copied to clipboard!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            WhatsApp Template Center
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Multi-Device Ready
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, manage, and use pre-approved message templates & quick snippets directly inside WhatsApp Inbox.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedConnectionId}
            onChange={(e) => setSelectedConnectionId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          >
            <option value="">All WhatsApp Accounts</option>
            {connections.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.providerType === 'official_meta' ? 'Meta Official' : 'Regular QR'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Template
          </button>

          {activeTab === 'official' && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              title="Sync official templates from Meta WABA"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync from Meta
            </button>
          )}

          <Link
            href="/whatsapp/inbox"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            Open Inbox
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('regular')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'regular'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          WhatsApp Quick Templates & Snippets ({snippets.length})
        </button>
        <button
          onClick={() => setActiveTab('official')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'official'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Official Meta Cloud API Templates ({templates.length})
        </button>
      </div>

      {errorBanner && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {successToast && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* TAB 1: REGULAR WHATSAPP TEMPLATES & SNIPPETS */}
      {activeTab === 'regular' && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-xl p-3.5 flex items-start justify-between gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>WhatsApp Templates & Quick Replies:</strong> These templates are available directly in your <strong>WhatsApp Inbox</strong> composer. Use merge tags like <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">{'{{name}}'}</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">{'{{company}}'}</code> for instant 1-click personalized messaging.
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
            >
              + New Template
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              {snippets.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <FileCode className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">No WhatsApp Templates Found</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create custom templates to send quick, pre-formatted messages to your leads and customers.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max items-start content-start">
                  {snippets.map((snip) => (
                    <div
                      key={snip.id}
                      onClick={() => setSelectedSnippet(snip)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group h-fit ${
                        selectedSnippet?.id === snip.id
                          ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate pr-2">
                          {snip.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 uppercase">
                            {snip.category}
                          </span>
                          <button
                            onClick={(e) => handleOpenEdit(snip, e)}
                            title="Edit template"
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSnippet(snip, e)}
                            title="Delete template"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 font-sans whitespace-pre-wrap break-words">
                        {snip.bodyText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Snippet Live Preview */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 h-fit sticky top-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Template Simulator
                </h2>
                {selectedSnippet && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(selectedSnippet)}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSnippet(selectedSnippet)}
                      className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>

              {selectedSnippet ? (
                <div className="space-y-3">
                  <div className="bg-[#efeae2]/40 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                      Live Chat Preview
                    </div>
                    <div className="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-2xs">
                      {selectedSnippet.bodyText}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Template Name:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSnippet.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Category:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSnippet.category}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Variables:</span>
                      <div className="flex gap-1 flex-wrap">
                        {selectedSnippet.variables.map((v) => (
                          <span
                            key={v}
                            className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedSnippet.bodyText)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </button>
                    <Link
                      href="/whatsapp/inbox"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Use in Inbox
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Select a template on the left to preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL META CLOUD TEMPLATES */}
      {activeTab === 'official' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Meta WhatsApp Business Platform Rules:</strong> Official Cloud API templates must be pre-approved by Meta before broadcasting. Numbered variables use <code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono">{'{{1}}'}</code>, <code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono">{'{{2}}'}</code>.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                  Loading approved templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">No Meta Templates Found</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Click <strong>Sync from Meta</strong> to import pre-approved templates from your Meta WhatsApp Business Manager.
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    Sync Templates Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((tmpl) => (
                    <div
                      key={tmpl._id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                        selectedTemplate?._id === tmpl._id
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate pr-2">
                          {tmpl.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tmpl.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                : tmpl.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                            }`}
                          >
                            {tmpl.status || 'APPROVED'}
                          </span>
                          <button
                            onClick={(e) => handleDeleteMetaTemplate(tmpl, e)}
                            title="Delete template"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        Category: <span className="font-medium text-slate-700 dark:text-slate-300">{tmpl.category || 'MARKETING'}</span> • Lang: <span className="font-medium text-slate-700 dark:text-slate-300">{tmpl.language || 'en_US'}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 font-sans">
                        {tmpl.bodyText || tmpl.components?.find((c: any) => c.type === 'BODY')?.text || '[Template content]'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Template Live Preview Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 h-fit sticky top-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Meta Template Simulator
                </h2>
                {selectedTemplate && (
                  <button
                    onClick={() => handleDeleteMetaTemplate(selectedTemplate)}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>

              {selectedTemplate ? (
                <div className="space-y-3">
                  <div className="bg-[#efeae2]/40 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                      WhatsApp Bubble Preview
                    </div>
                    <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-3.5 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow-2xs">
                      {selectedTemplate.bodyText ||
                        selectedTemplate.components?.find((c: any) => c.type === 'BODY')?.text ||
                        'Preview template content with variables like {{1}}, {{2}}'}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Template ID / Name:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedTemplate.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Category:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTemplate.category || 'MARKETING'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500">Language:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTemplate.language || 'en_US'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          selectedTemplate.bodyText ||
                            selectedTemplate.components?.find((c: any) => c.type === 'BODY')?.text ||
                            selectedTemplate.name,
                        )
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </button>
                    <Link
                      href="/whatsapp/inbox"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Use in Inbox
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Select a template on the left to preview its content and variables.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingSnippet ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
                  </h3>
                  <p className="text-xs text-slate-500">Reusable message template for WhatsApp inbox & campaigns</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSnippet(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSnippet} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Follow-up Offer"
                  value={newSnippetName}
                  onChange={(e) => setNewSnippetName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newSnippetCategory}
                  onChange={(e) => setNewSnippetCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="MARKETING">Marketing & Offers</option>
                  <option value="SALES">Sales & Follow-ups</option>
                  <option value="UTILITY">Utility & Reminders</option>
                  <option value="SUPPORT">Customer Support</option>
                  <option value="TRANSACTIONAL">Transactional & Orders</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Template Message Body *
                  </label>
                  <div className="flex gap-1 text-[11px] text-slate-400">
                    <span>Tags:</span>
                    <button
                      type="button"
                      onClick={() => setNewSnippetBody((prev) => prev + ' {{name}}')}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[10px]"
                    >
                      {'{{name}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSnippetBody((prev) => prev + ' {{company}}')}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[10px]"
                    >
                      {'{{company}}'}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  placeholder="Hello {{name}}, thank you for connecting with us! We would love to discuss..."
                  value={newSnippetBody}
                  onChange={(e) => setNewSnippetBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSnippet(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-2xs"
                >
                  {editingSnippet ? (
                    <>
                      <Pencil className="w-3.5 h-3.5" /> Update Template
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Save Template
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
