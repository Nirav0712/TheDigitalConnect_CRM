'use client';

import React, { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  Palette,
  ShieldCheck,
  Save,
  RotateCcw,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Check,
  Copy,
  Webhook,
  Sliders,
  Layers,
  Layout,
  Coins,
} from 'lucide-react';
import { settingsApi, extractErrorMessage } from '../../lib/api';
import { useTheme, HeaderStyle } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'theme' | 'throttles' | 'webhooks' | 'currency'>('theme');
  const {
    theme,
    updateThemeField,
    setMode,
    saveTheme,
    resetTheme,
    isSaving: isSavingTheme,
  } = useTheme();

  const {
    currency,
    currencySymbol,
    currencyDetails,
    saveCurrency,
    formatCurrency,
    supportedCurrencies,
  } = useCurrency();
  const [savingCurrency, setSavingCurrency] = useState(false);

  // General settings state
  const [settings, setSettings] = useState({
    defaultPerMessageDelaySec: 2,
    defaultBatchSize: 50,
    defaultBatchPauseSec: 60,
    maxDailyEmailPerAccount: 500,
    maxHourlyEmailPerAccount: 50,
    maxDailyWhatsAppPerConnection: 1000,
    maxRetries: 3,
    autoRetryFailed: true,
    stopOnAccountExhaustion: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getSettings();
      if (data) {
        setSettings({
          defaultPerMessageDelaySec: data.defaultPerMessageDelaySec ?? 2,
          defaultBatchSize: data.defaultBatchSize ?? 50,
          defaultBatchPauseSec: data.defaultBatchPauseSec ?? 60,
          maxDailyEmailPerAccount: data.maxDailyEmailPerAccount ?? 500,
          maxHourlyEmailPerAccount: data.maxHourlyEmailPerAccount ?? 50,
          maxDailyWhatsAppPerConnection: data.maxDailyWhatsAppPerConnection ?? 1000,
          maxRetries: data.maxRetries ?? 3,
          autoRetryFailed: data.autoRetryFailed ?? true,
          stopOnAccountExhaustion: data.stopOnAccountExhaustion ?? true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await settingsApi.updateSettings(settings);
      setSavedToast('Throttle settings updated successfully!');
      setTimeout(() => setSavedToast(null), 3000);
    } catch (err) {
      alert(`Save failed: ${extractErrorMessage(err)}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveTheme = async () => {
    try {
      await saveTheme();
      setSavedToast('Theme settings saved permanently to MongoDB!');
      setTimeout(() => setSavedToast(null), 3000);
    } catch (err) {
      alert(`Theme save failed: ${extractErrorMessage(err)}`);
    }
  };

  const handleResetTheme = async () => {
    if (!confirm('Reset all theme settings to defaults?')) return;
    try {
      await resetTheme();
      setSavedToast('Theme reset to enterprise defaults.');
      setTimeout(() => setSavedToast(null), 3000);
    } catch (err) {
      alert(`Theme reset failed: ${extractErrorMessage(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            The Crystal Engage CRM Settings
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              Control Panel
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize appearance, branding styles, delivery speed limits, and webhook listeners.
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{savedToast}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'theme'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          Theme Customizer
        </button>

        <button
          onClick={() => setActiveTab('throttles')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'throttles'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Rate Throttles & Queues
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'webhooks'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Webhooks & Security
        </button>

        <button
          onClick={() => setActiveTab('currency')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'currency'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          CRM Currency & Region
        </button>
      </div>

      {/* TAB 1: THEME CUSTOMIZER */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            {/* Mode Switcher */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                Appearance Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    theme.mode === 'light'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  Light Theme
                </button>

                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    theme.mode === 'dark'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  Dark Theme
                </button>

                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    theme.mode === 'custom'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Custom Palette
                </button>
              </div>
            </div>

            {/* Header Style */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                Header Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['DEFAULT', 'GLASS', 'SOLID', 'CINEMATIC'] as HeaderStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateThemeField('headerStyle', style)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      theme.headerStyle === style
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors Palette Grid */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
                Theme Color Tokens
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Primary Brand
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => updateThemeField('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {theme.primaryColor}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Accent Glow
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => updateThemeField('accentColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {theme.accentColor}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Background
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.backgroundColor}
                      onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {theme.backgroundColor}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Card Surface
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.surfaceColor}
                      onChange={(e) => updateThemeField('surfaceColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {theme.surfaceColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Border Radius & Geometry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Corner Radius
                </label>
                <select
                  value={theme.borderRadius}
                  onChange={(e) => updateThemeField('borderRadius', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="none">Sharp (0px)</option>
                  <option value="sm">Small (4px)</option>
                  <option value="md">Medium (8px)</option>
                  <option value="lg">Large (12px)</option>
                  <option value="xl">Extra Large (16px)</option>
                  <option value="2xl">2X Large (24px)</option>
                  <option value="full">Fully Pill</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Elevation Shadow
                </label>
                <select
                  value={theme.shadow}
                  onChange={(e) => updateThemeField('shadow', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="none">Flat (None)</option>
                  <option value="sm">Subtle (2xs)</option>
                  <option value="md">Medium (md)</option>
                  <option value="lg">High (lg)</option>
                </select>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetTheme}
                disabled={isSavingTheme}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={isSavingTheme}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingTheme ? 'Saving...' : 'Save Theme to Database'}
              </button>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs h-fit">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Live Theme Preview
            </h2>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50 dark:bg-slate-800/60">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Sample Campaign Card</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This preview updates instantly as you adjust theme colors, header modes, and corner radius tokens.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  style={{ backgroundColor: theme.primaryColor, color: '#ffffff' }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs"
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  style={{ borderColor: theme.borderColor }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                >
                  Secondary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RATE THROTTLES & QUEUES */}
      {activeTab === 'throttles' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Queue Delays & Anti-Spam Throttles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Delay Between Messages (Seconds)
              </label>
              <input
                type="number"
                min="0"
                value={settings.defaultPerMessageDelaySec}
                onChange={(e) => setSettings({ ...settings, defaultPerMessageDelaySec: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Batch Chunk Size (Recipients)
              </label>
              <input
                type="number"
                min="1"
                value={settings.defaultBatchSize}
                onChange={(e) => setSettings({ ...settings, defaultBatchSize: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Max Daily WhatsApp Per Connection
              </label>
              <input
                type="number"
                min="10"
                value={settings.maxDailyWhatsAppPerConnection}
                onChange={(e) => setSettings({ ...settings, maxDailyWhatsAppPerConnection: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Max Daily Email Per Account
              </label>
              <input
                type="number"
                min="10"
                value={settings.maxDailyEmailPerAccount}
                onChange={(e) => setSettings({ ...settings, maxDailyEmailPerAccount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {savingSettings ? 'Saving...' : 'Save Throttle Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: WEBHOOKS & SECURITY */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-emerald-600" />
            Meta Cloud WhatsApp Webhook Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste this webhook callback URL into your Meta for Developers App Dashboard under WhatsApp &gt; Configuration:
          </p>

          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <code className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex-1 truncate">
              {`${process.env.NEXT_PUBLIC_API_URL || 'https://backendcrm.imprenta.in/api'}/whatsapp/webhook`}
            </code>
            <button
              type="button"
              onClick={() => {
                const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendcrm.imprenta.in/api'}/whatsapp/webhook`;
                navigator.clipboard.writeText(webhookUrl);
                setCopiedWebhook(true);
                setTimeout(() => setCopiedWebhook(false), 2000);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
            >
              {copiedWebhook ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: CRM CURRENCY & REGION */}
      {activeTab === 'currency' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  CRM Default Currency & Valuation Symbol
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose the primary currency for all CRM pipeline values, deals, win analytics, and metrics.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Active Currency:</span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span>{currencyDetails.flag}</span>
                  <span>{currencyDetails.code} ({currencyDetails.symbol.trim()})</span>
                </span>
              </div>
            </div>

            {/* Currency Options Grid */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
                Select Base Currency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {supportedCurrencies.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={async () => {
                        setSavingCurrency(true);
                        try {
                          await saveCurrency(c.code);
                          setSavedToast(`CRM Currency switched to ${c.name}!`);
                          setTimeout(() => setSavedToast(null), 3000);
                        } catch (err) {
                          alert(`Failed to save currency: ${extractErrorMessage(err)}`);
                        } finally {
                          setSavingCurrency(false);
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.flag}</span>
                          <span className="font-bold text-sm">{c.code}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.name}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                          {c.symbol.trim()}
                        </span>
                        {isSelected && (
                          <div className="mt-1 flex items-center justify-end text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-0.5">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Sample Showcase */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live CRM Format Preview with {currencyDetails.name}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Sample Deal Card</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(50000)}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Enterprise License
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Pipeline Value</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatCurrency(1250000)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Across 24 opportunities</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Closed-Won Deals</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(480000)}
                  </div>
                  <div className="text-[10px] text-emerald-500 mt-0.5">72% conversion rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
