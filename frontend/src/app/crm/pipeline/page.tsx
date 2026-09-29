'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Plus,
  RefreshCw,
  User,
  Building,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import { crmApi, extractErrorMessage } from '../../../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';

const STAGES = [
  { key: 'new', label: 'New Inquiries', color: 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30' },
  { key: 'contacted', label: 'Contacted', color: 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20' },
  { key: 'qualified', label: 'Qualified', color: 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20' },
  { key: 'proposal', label: 'Proposal Sent', color: 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20' },
  { key: 'won', label: 'Closed Won', color: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' },
  { key: 'lost', label: 'Closed Lost', color: 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20' },
];

export default function CrmPipelinePage() {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [pipelineData, setPipelineData] = useState<any>({
    stages: {
      new: { leads: [], totalValue: 0, count: 0 },
      contacted: { leads: [], totalValue: 0, count: 0 },
      qualified: { leads: [], totalValue: 0, count: 0 },
      proposal: { leads: [], totalValue: 0, count: 0 },
      won: { leads: [], totalValue: 0, count: 0 },
      lost: { leads: [], totalValue: 0, count: 0 },
    },
    totalPipelineValue: 0,
    totalDeals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  
  // Drag and drop state & ref
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const draggedInfoRef = useRef<{ id: string; fromStage: string } | null>(null);
  const [hoveredDropStage, setHoveredDropStage] = useState<string | null>(null);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getPipelineSummary();
      setPipelineData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  // Optimistic Move Handler for both Drag & Drop and Stage Selectors
  const moveLeadToStage = async (leadId: string, fromStage: string, toStage: string) => {
    if (!leadId || !fromStage || !toStage || fromStage === toStage) return;

    // Backup current state for rollback on failure
    const backupData = JSON.parse(JSON.stringify(pipelineData));

    // Find the lead object in fromStage
    const sourceLeads = pipelineData.stages?.[fromStage]?.leads || [];
    const targetLead = sourceLeads.find((l: any) => l._id === leadId);
    if (!targetLead) return;

    const dealValue = targetLead.dealValue || 0;
    const updatedLead = { ...targetLead, stage: toStage };

    // Optimistically update pipelineData state immediately
    const nextStages = { ...pipelineData.stages };
    nextStages[fromStage] = {
      ...nextStages[fromStage],
      leads: sourceLeads.filter((l: any) => l._id !== leadId),
      count: Math.max(0, (nextStages[fromStage]?.count || 1) - 1),
      totalValue: Math.max(0, (nextStages[fromStage]?.totalValue || 0) - dealValue),
    };
    nextStages[toStage] = {
      ...nextStages[toStage],
      leads: [updatedLead, ...(nextStages[toStage]?.leads || [])],
      count: (nextStages[toStage]?.count || 0) + 1,
      totalValue: (nextStages[toStage]?.totalValue || 0) + dealValue,
    };

    setPipelineData({
      ...pipelineData,
      stages: nextStages,
    });

    setMovingId(leadId);
    try {
      await crmApi.updateLead(leadId, { stage: toStage });
    } catch (err) {
      // Revert if API fails
      setPipelineData(backupData);
      alert(`Failed to move lead: ${extractErrorMessage(err)}`);
    } finally {
      setMovingId(null);
    }
  };

  const handleDropOnStage = (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredDropStage(null);

    let leadId = '';
    let fromStage = '';

    if (draggedInfoRef.current) {
      leadId = draggedInfoRef.current.id;
      fromStage = draggedInfoRef.current.fromStage;
    } else {
      try {
        const text = e.dataTransfer.getData('text/plain');
        if (text) {
          const data = JSON.parse(text);
          leadId = data.leadId;
          fromStage = data.fromStage;
        }
      } catch (err) {
        console.warn('Drag data parse error:', err);
      }
    }

    if (leadId && fromStage && fromStage !== toStage) {
      moveLeadToStage(leadId, fromStage, toStage);
    }

    draggedInfoRef.current = null;
    setDraggedLeadId(null);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            CRM Deal Pipeline
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Drag & Drop Kanban
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total Pipeline Valuation:{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(pipelineData.totalPipelineValue || 0)}
            </span>{' '}
            across {pipelineData.totalDeals || 0} opportunities. <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">• Drag cards anywhere or use stage selectors</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadPipeline}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/crm/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Deal
          </Link>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll View */}
      <div className="flex-1 overflow-x-auto min-h-0 pb-4">
        <div className="inline-flex gap-4 min-w-full h-full">
          {STAGES.map((st, idx) => {
            const stageInfo = pipelineData.stages?.[st.key] || { leads: [], totalValue: 0, count: 0 };
            const nextStageKey = STAGES[idx + 1]?.key;
            const prevStageKey = STAGES[idx - 1]?.key;
            const isDropTarget = hoveredDropStage === st.key;

            return (
              <div
                key={st.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  if (hoveredDropStage !== st.key) {
                    setHoveredDropStage(st.key);
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHoveredDropStage(st.key);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setHoveredDropStage(null);
                  }
                }}
                onDrop={(e) => handleDropOnStage(e, st.key)}
                className={`w-72 md:w-80 flex flex-col rounded-2xl border ${st.color} shadow-2xs flex-shrink-0 transition-all duration-200 ${
                  isDropTarget
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 shadow-md scale-[1.01]'
                    : ''
                }`}
              >
                {/* Stage Header */}
                <div className="p-3.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between bg-white/60 dark:bg-slate-900/60 rounded-t-2xl">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      {st.label}
                    </span>
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {stageInfo.count}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stageInfo.totalValue || 0)}
                  </span>
                </div>

                {/* Cards Container */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => handleDropOnStage(e, st.key)}
                  className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px]"
                >
                  {stageInfo.leads.length === 0 ? (
                    <div
                      className={`p-8 text-center text-xs border border-dashed rounded-xl transition-all ${
                        isDropTarget
                          ? 'border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold scale-[1.02]'
                          : 'text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isDropTarget ? '✨ Drop Deal Here' : `No deals in ${st.label.toLowerCase()}`}
                    </div>
                  ) : (
                    stageInfo.leads.map((lead: any) => {
                      const isBeingDragged = draggedLeadId === lead._id;

                      return (
                        <div
                          key={lead._id}
                          draggable={true}
                          onDragStart={(e) => {
                            draggedInfoRef.current = { id: lead._id, fromStage: st.key };
                            setDraggedLeadId(lead._id);
                            e.dataTransfer.setData(
                              'text/plain',
                              JSON.stringify({ leadId: lead._id, fromStage: st.key })
                            );
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            draggedInfoRef.current = null;
                            setDraggedLeadId(null);
                            setHoveredDropStage(null);
                          }}
                          className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all space-y-2.5 cursor-grab active:cursor-grabbing hover:shadow-md select-none ${
                            isBeingDragged
                              ? 'opacity-30 border-dashed border-emerald-500 ring-2 ring-emerald-400/40 scale-95'
                              : 'border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5 cursor-grab" />
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                                {lead.title}
                              </h4>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                              {formatCurrency(lead.dealValue || 0)}
                            </span>
                          </div>

                          {lead.contactId && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pl-5">
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{lead.contactId.fullName}</span>
                              </div>
                              {lead.contactId.company && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <Building className="w-3 h-3 text-slate-400" />
                                  <span className="truncate">{lead.contactId.company}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Stage Selector & Score Stepper */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-slate-400">Score:</span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                {lead.score || 50}
                              </span>
                            </div>

                            {/* Dropdown Stage Picker & Quick Buttons */}
                            <div className="flex items-center gap-1">
                              <select
                                value={st.key}
                                onChange={(e) => moveLeadToStage(lead._id, st.key, e.target.value)}
                                className="text-[10px] font-semibold py-0.5 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none capitalize"
                              >
                                {STAGES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>

                              {nextStageKey && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveLeadToStage(lead._id, st.key, nextStageKey);
                                  }}
                                  disabled={movingId === lead._id}
                                  className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 font-bold transition-colors"
                                  title={`Advance to ${nextStageKey}`}
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
