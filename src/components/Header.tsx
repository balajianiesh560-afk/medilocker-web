import React from 'react';
import { Menu, AlertOctagon, Bot, Shield, Sparkles, QrCode, HeartPulse, Building2, Mic } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  currentView: ActiveView;
  onOpenMobileSidebar: () => void;
  onQuickEmergencyCase: () => void;
  onOpenQRScanner?: () => void;
  onOpenVoiceRounds?: () => void;
  geminiConfigured: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  hospitalName?: string;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onQuickEmergencyCase,
  onOpenQRScanner,
  onOpenVoiceRounds,
  geminiConfigured,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  hospitalName,
  onOpenSettings,
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
    'doctor-voice': {
      title: 'Doctor Voice Rounds (குரல் உதவியாளர்)',
      subtitle: 'Ask about patient details verbally • AI speaks back concise clinical summary in English and Tamil',
    },
    'ai-assistant': {
      title: 'MediLocker AI Assistant',
      subtitle: 'Gemini-powered clinical query assistant grounded in hospital records',
    },
    global: {
      title: 'Global Medical History Network',
      subtitle: 'Centralized cross-hospital medical history, case history, and reports exchange',
    },
    notify: {
      title: 'Notify & Emergency Treatment Updates',
      subtitle: 'Doctor-to-doctor emergency treatment updates, procedures, and medication routing',
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
        {/* Active Hospital Wing Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-teal-50/80 border border-teal-200/80 text-teal-900 text-xs font-semibold shadow-2xs">
          <HeartPulse className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span className="truncate max-w-[200px]">{hospitalName || "St. Jude Trauma Center"}</span>
          <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-100/80 px-1.5 py-0.2 rounded font-mono">
            ER Unit
          </span>
        </div>

        {/* Universal Doctor Voice Rounds Quick Button */}
        {onOpenVoiceRounds && (
          <button
            id="header-voice-rounds-btn"
            onClick={onOpenVoiceRounds}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer shadow-xs border border-teal-400/30"
            title="Doctor Voice Assistant (பேசுங்கள்)"
          >
            <Mic className="w-3.5 h-3.5 text-teal-200 shrink-0" />
            <span className="hidden md:inline">Doctor Voice AI</span>
            <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-mono hidden sm:inline">குரல்</span>
          </button>
        )}

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

        {/* Gemini status indicator badge (Online Live vs Standalone) */}
        <button
          id="gemini-status-indicator"
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
            geminiConfigured
              ? 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 hover:bg-amber-100/70 text-amber-800 border-amber-200'
          }`}
          title={
            geminiConfigured
              ? 'Google Gemini 3.8 Flash Online Cloud Intelligence Active'
              : 'Gemini Key Not Set - Click to Configure Online AI'
          }
        >
          {geminiConfigured ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span className="hidden md:inline">
            {geminiConfigured ? 'Online Live AI' : 'Offline Mode'}
          </span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/5 text-slate-600 hidden lg:inline">
            {geminiConfigured ? 'Gemini 3.8 Flash' : 'Setup Key'}
          </span>
        </button>

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
