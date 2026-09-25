'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../../context/AuthContext';
import { AuthGuard } from '../auth/AuthGuard';
import { SidebarProvider } from '../../context/SidebarContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <AuthProvider>
      <AuthGuard>
        {isLoginPage ? (
          children
        ) : (
          <SidebarProvider>
            <div className="flex h-full w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 overflow-hidden relative">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 flex flex-col min-h-0 bg-slate-50 dark:bg-[#0b0f19]">
                  <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0">{children}</div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        )}
      </AuthGuard>
    </AuthProvider>
  );
}
