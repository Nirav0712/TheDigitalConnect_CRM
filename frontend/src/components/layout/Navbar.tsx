'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  Building,
  LogOut,
  Menu,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

export function Navbar() {
  const { theme, setMode } = useTheme();
  const { organizationId, user, logout } = useAuth();
  const { toggleMobile } = useSidebar();

  return (
    <header
      className={`h-16 px-3 sm:px-6 flex items-center justify-between border-b transition-colors z-20 flex-shrink-0 ${
        theme.headerStyle === 'GLASS'
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800'
          : theme.headerStyle === 'CINEMATIC'
          ? 'bg-slate-950 text-white border-slate-800'
          : theme.headerStyle === 'SOLID'
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Left: Mobile Menu Toggle & Workspace */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-md">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">The Crystal Engage</span>
            <span className="xs:hidden">TCE</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{organizationId || 'default-org'}</span>
          </span>
        </div>

        <div className="relative flex-1 hidden xl:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contacts, chats, leads..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right: Theme Toggle & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Theme Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('light')}
            className={`p-1.5 rounded-lg transition-all ${
              theme.mode === 'light'
                ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-2xs font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Light Theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`p-1.5 rounded-lg transition-all ${
              theme.mode === 'dark'
                ? 'bg-slate-900 dark:bg-slate-700 text-cyan-400 shadow-2xs font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Dark Theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`p-1.5 rounded-lg transition-all ${
              theme.mode === 'custom'
                ? 'bg-cyan-500 text-white shadow-2xs font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Custom Theme"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <Link
          href="/import-data"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Import
        </Link>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Campaign</span>
          <span className="sm:hidden">New</span>
        </Link>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
