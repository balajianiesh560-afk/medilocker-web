import React from 'react';
import { Menu, AlertOctagon, Bot, Shield, Sparkles, QrCode } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  currentView: ActiveView;
  onOpenMobileSidebar: () => void;
  onQuickEmergencyCase: () => void;
  onOpenQRScanner?: () => void;
  geminiConfigured: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onQuickEmergencyCase,
  onOpenQRScanner,
  geminiConfigured,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const titles: Record<ActiveView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Emergency Care Operations',
      subtitle: 'Hospital Trauma Center Patient Identification Dashboard',
    },
    patients: {
      title: 'Patient Directory',
      subtitle: 'Comprehensive record of identified and unidentified trauma admissions',
    },
    'register-patient': {
      title: 'Register Patient',
      subtitle: 'Comprehensive biometric reference cataloging and admission record',
    },
    'search-patient': {
      title: 'Search & Match Patient',
      subtitle: 'Query database by Patient ID, Legal Name, or Biometric Reference ID',
    },
    'patient-profile': {
      title: 'Patient Clinical Profile',
      subtitle: 'Identification markers, case history, and AI clinical summaries',
    },
    'emergency-case': {
      title: 'Rapid Emergency Intake',
      subtitle: 'Fast registration protocol for acute mass casualty triage',
    },
    'emergency-cases': {
      title: 'Emergency Cases Registry',
      subtitle: 'Log of temporary accident cases, physical remarks, and triage states',
    },
    'ai-assistant': {
      title: 'MediLocker AI Assistant',
      subtitle: 'Gemini-powered clinical query assistant grounded in hospital records',
    },
    global: {
      title: 'Global Medical History Network',
      subtitle: 'Centralized cross-hospital medical history, case history, and reports exchange',
    },
    settings: {
      title: 'System & Hardware Settings',
      subtitle: 'Platform configuration, database utilities, and biometric simulator',
    },
  };

  const currentInfo = titles[currentView] || {
    title: 'MediLocker',
    subtitle: 'Hospital Emergency Identification & Clinical Records Platform',
  };

  return (
    <header className="h-18 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          id="header-mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle trigger */}
        {onToggleSidebarCollapse && (
          <button
            id="header-desktop-sidebar-toggle-btn"
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal Scan QR Button */}
        {onOpenQRScanner && (
          <button
            id="header-scan-qr-btn"
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
            title="Scan Patient QR Wristband"
          >
            <QrCode className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        )}

        {/* Gemini status indicator badge */}
        <div
          id="gemini-status-indicator"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            geminiConfigured
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
          title={geminiConfigured ? 'Gemini 3.8 Flash Active' : 'Gemini Key Not Set - Using Local Database Fallback'}
        >
          <Sparkles className={`w-3.5 h-3.5 ${geminiConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="hidden md:inline">
            {geminiConfigured ? 'Gemini AI Active' : 'AI Offline (Fallback Mode)'}
          </span>
        </div>

        {/* Quick Emergency Case Action */}
        <button
          id="header-quick-emergency-btn"
          onClick={onQuickEmergencyCase}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Rapid Emergency Intake</span>
        </button>
      </div>
    </header>
  );
};
