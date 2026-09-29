'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CalendarCheck,
  Activity,
  Compass,
  RefreshCw,
  Plus,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  Sparkles,
  Award,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { crmApi, contactsApi, extractErrorMessage } from '../../../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';

export default function CrmDashboardPage() {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Real-time aggregates
  const [pipelineSummary, setPipelineSummary] = useState<any>({
    stages: {},
    totalPipelineValue: 0,
    totalDeals: 0,
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // Quick Action Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    contactId: '',
    title: '',
    dealValue: 1000,
    stage: 'new',
    score: 60,
    source: 'website',
    notes: '',
  });
  const [followUpForm, setFollowUpForm] = useState({
    contactId: '',
    title: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'medium',
    notes: '',
  });
  const [savingAction, setSavingAction] = useState(false);

  // Fetch all CRM modules in real time
  const loadCrmData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pipeData, leadsData, followUpsData, actData, sourcesData, contactsData] =
        await Promise.all([
          crmApi.getPipelineSummary(),
          crmApi.getLeads('all'),
          crmApi.getFollowUps(),
          crmApi.getActivities(),
          crmApi.getLeadSources(),
          contactsApi.getAll(),
        ]);

      setPipelineSummary(pipeData || { stages: {}, totalPipelineValue: 0, totalDeals: 0 });
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setFollowUps(Array.isArray(followUpsData) ? followUpsData : []);
      setActivities(Array.isArray(actData) ? actData : []);
      setSources(Array.isArray(sourcesData) ? sourcesData : []);

      const extractedContacts = Array.isArray(contactsData?.data)
        ? contactsData.data
        : Array.isArray(contactsData)
        ? contactsData
        : Array.isArray(contactsData?.contacts)
        ? contactsData.contacts
        : [];
      setContacts(extractedContacts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching CRM realtime data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadCrmData();
    // Realtime polling heartbeat every 15 seconds
    const interval = setInterval(() => {
      loadCrmData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Quick Lead creation
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.contactId || !leadForm.title) return;
    setSavingAction(true);
    try {
      await crmApi.createLead(leadForm);
      setIsLeadModalOpen(false);
      setLeadForm({
        contactId: '',
        title: '',
        dealValue: 1000,
        stage: 'new',
        score: 60,
        source: 'website',
        notes: '',
      });
      loadCrmData(true);
    } catch (err) {
      alert(`Failed to create lead: ${extractErrorMessage(err)}`);
    } finally {
      setSavingAction(false);
    }
  };

  // Quick FollowUp creation
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpForm.contactId || !followUpForm.title) return;
    setSavingAction(true);
    try {
      await crmApi.createFollowUp({
        ...followUpForm,
        dueDate: new Date(followUpForm.dueDate),
      });
      setIsFollowUpModalOpen(false);
      setFollowUpForm({
        contactId: '',
        title: '',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        priority: 'medium',
        notes: '',
      });
      loadCrmData(true);
    } catch (err) {
      alert(`Failed to schedule follow-up: ${extractErrorMessage(err)}`);
    } finally {
      setSavingAction(false);
    }
  };

  // Toggle follow-up complete
  const toggleFollowUpStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await crmApi.updateFollowUp(id, { status: nextStatus });
      loadCrmData(true);
    } catch (err) {
      alert(`Failed to update follow-up: ${extractErrorMessage(err)}`);
    }
  };

  // Metrics computation
  const wonDeals = leads.filter((l) => l.stage === 'won');
  const wonRevenue = wonDeals.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const winRate = leads.length > 0 ? Math.round((wonDeals.length / leads.length) * 100) : 0;
  
  const pendingFollowUps = followUps.filter((f) => f.status === 'pending');
  const overdueFollowUps = pendingFollowUps.filter(
    (f) => new Date(f.dueDate).getTime() < Date.now()
  );

  const avgLeadScore =
    leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.score || 50), 0) / leads.length)
      : 50;

  const STAGES_CONFIG = [
    { key: 'new', label: 'New', bg: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400' },
    { key: 'contacted', label: 'Contacted', bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    { key: 'qualified', label: 'Qualified', bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
    { key: 'proposal', label: 'Proposal', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    { key: 'won', label: 'Won', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'lost', label: 'Lost', bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Live Status & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              CRM Intelligence Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Live
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline valuation, sales velocity, follow-up queues, and lead attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadCrmData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsFollowUpModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            + Follow-up
          </button>

          <button
            onClick={() => setIsLeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Deal
          </button>
        </div>
      </div>

      {/* 4 Key Real-time Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Pipeline Value */}
        <Link
          href="/crm/pipeline"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Pipeline Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Kanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(pipelineSummary.totalPipelineValue || 0)}
          </div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
            <span>{pipelineSummary.totalDeals || leads.length} active deals in pipeline</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Metric 2: Closed-Won Revenue */}
        <Link
          href="/crm/leads"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Closed-Won Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(wonRevenue)}
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <span>{wonDeals.length} won • {winRate}% win rate</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Metric 3: Pending Follow-ups */}
        <Link
          href="/crm/follow-ups"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Follow-ups
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {pendingFollowUps.length}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1 font-medium">
            {overdueFollowUps.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                ⚠️ {overdueFollowUps.length} overdue reminders
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">All tasks on schedule</span>
            )}
            <ArrowUpRight className="w-3 h-3 ml-auto text-amber-600" />
          </div>
        </Link>

        {/* Metric 4: Lead Quality Score */}
        <Link
          href="/crm/sources"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Avg Lead Score
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {avgLeadScore} / 100
          </div>
          <div className="mt-2 text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-medium">
            <span>{sources.length} active marketing channels</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Row 2: Pipeline Funnel Progression & Lead Source ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Funnel (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Kanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Pipeline Stage Progression & Valuations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of deal values across active sales stages
              </p>
            </div>
            <Link
              href="/crm/pipeline"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Open Kanban Board →
            </Link>
          </div>

          {/* Stage Breakdown Bars */}
          <div className="space-y-3 pt-2">
            {STAGES_CONFIG.map((st) => {
              const stageData = pipelineSummary.stages?.[st.key] || { count: 0, totalValue: 0 };
              const percentOfTotal =
                pipelineSummary.totalPipelineValue > 0
                  ? Math.round((stageData.totalValue / pipelineSummary.totalPipelineValue) * 100)
                  : 0;

              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {st.label}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {stageData.count} deals
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(stageData.totalValue)}
                      <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                        ({percentOfTotal}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${st.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(4, percentOfTotal)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources & Channel Attribution (1 Col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Lead Attribution Channels
            </h2>
            <Link
              href="/crm/sources"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View ROI →
            </Link>
          </div>

          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No channel data available yet.
              </div>
            ) : (
              sources.slice(0, 5).map((src) => (
                <div
                  key={src.source}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs capitalize text-slate-900 dark:text-white">
                      {src.source}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {src.count} leads • {src.wonCount || 0} won
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(src.totalValue)}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      {src.conversionRate} win rate
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Live Follow-ups Queue & Recent Activities Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Follow-ups Queue */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-500" />
              Actionable Follow-up Tasks ({pendingFollowUps.length})
            </h2>
            <Link
              href="/crm/follow-ups"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              All Tasks →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {pendingFollowUps.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                🎉 All follow-ups completed! No pending tasks.
              </div>
            ) : (
              pendingFollowUps.slice(0, 6).map((item) => {
                const isOverdue = new Date(item.dueDate).getTime() < Date.now();

                return (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleFollowUpStatus(item._id, item.status)}
                        className="mt-0.5 w-4 h-4 rounded border border-slate-300 dark:border-slate-600 hover:border-emerald-500 flex items-center justify-center flex-shrink-0"
                        title="Mark Complete"
                      >
                        {item.status === 'completed' && (
                          <Check className="w-3 h-3 text-emerald-600" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {item.contactId?.fullName || 'Unassigned contact'} •{' '}
                          {item.contactId?.phoneNumber || ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                      >
                        {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent CRM Activities Stream */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Real-time CRM Activity Stream
            </h2>
            <Link
              href="/crm/activities"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Activity Log →
            </Link>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No recent activity recorded yet.
              </div>
            ) : (
              activities.slice(0, 6).map((act) => (
                <div
                  key={act._id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    {act.type === 'call' ? (
                      <Phone className="w-3.5 h-3.5 text-violet-500" />
                    ) : act.type === 'email' ? (
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                    ) : act.type === 'whatsapp' ? (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {act.title}
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(act.performedAt || act.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Deal Modal */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Lead / Deal</h3>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Associated Contact</label>
                <select
                  required
                  value={leadForm.contactId}
                  onChange={(e) => setLeadForm({ ...leadForm, contactId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select Contact...</option>
                  {Array.isArray(contacts) &&
                    contacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.fullName || c.firstName || 'Contact'} ({c.company || c.phoneNumber || c.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Cloud Enterprise Contract"
                  value={leadForm.title}
                  onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Deal Value ({currencySymbol.trim()})
                  </label>
                  <input
                    type="number"
                    value={leadForm.dealValue}
                    onChange={(e) => setLeadForm({ ...leadForm, dealValue: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Stage</label>
                  <select
                    value={leadForm.stage}
                    onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    {['new', 'contacted', 'qualified', 'proposal', 'won'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {savingAction ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Follow-up Modal */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Follow-up Task</h3>
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFollowUp} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact</label>
                <select
                  required
                  value={followUpForm.contactId}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, contactId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select Contact...</option>
                  {Array.isArray(contacts) &&
                    contacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.fullName || c.firstName || 'Contact'} ({c.company || c.phoneNumber || c.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Send demo quotation & follow up via call"
                  value={followUpForm.title}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                  <input
                    type="date"
                    required
                    value={followUpForm.dueDate}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, dueDate: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={followUpForm.priority}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {savingAction ? 'Scheduling...' : 'Schedule Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
