import React from 'react';
import { Sidebar } from './Sidebar';
import { BrandKit } from '../../types/brandKit';
import { ShieldCheck } from 'lucide-react';

interface AppShellProps {
  activeView: string;
  onNavigate: (view: string) => void;
  brandKit: BrandKit;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeView,
  onNavigate,
  brandKit,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Left Sidebar */}
      <Sidebar activeView={activeView} onNavigate={onNavigate} brandKit={brandKit} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
              ZAW REAL ESTATE STUDIO
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800 capitalize">
              {activeView.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anti-Slop Engine Active</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center font-mono shadow-sm">
                AC
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden md:inline">
                {brandKit.companyName.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
