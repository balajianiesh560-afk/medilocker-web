import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Search,
  AlertOctagon,
  Bot,
  Settings,
  LogOut,
  Stethoscope,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  Bell,
} from 'lucide-react';
import { ActiveView, User } from '../types';

interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  user?: User | null;
  currentUser?: User | null;
  onLogout: () => void;
  unidentifiedCount: number;
  emergencyCount: number;
  pendingNotificationsCount?: number;
  isOpenMobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  currentUser,
  onLogout,
  unidentifiedCount,
  emergencyCount,
  pendingNotificationsCount = 0,
  isOpenMobile,
  mobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const activeUser = user || currentUser || null;
  const isDrawerOpen = Boolean(isOpenMobile || mobileOpen);

  const navItems = [
    {
      id: 'dashboard' as ActiveView,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'patients' as ActiveView,
      label: 'Patients',
      icon: Users,
    },
    {
      id: 'register-patient' as ActiveView,
      label: 'Register Patient',
      icon: UserPlus,
    },
    {
      id: 'search-patient' as ActiveView,
      label: 'Search & Match',
      icon: Search,
    },
    {
      id: 'emergency-case' as ActiveView,
      label: 'Rapid Intake',
      icon: Zap,
    },
    {
      id: 'emergency-cases' as ActiveView,
      label: 'Emergency Cases',
      icon: AlertOctagon,
      badge: emergencyCount > 0 ? emergencyCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'ai-assistant' as ActiveView,
      label: 'AI Assistant',
      icon: Bot,
      highlight: true,
    },
    {
      id: 'global' as ActiveView,
      label: 'Global',
      icon: Globe,
      badge: 'All Records',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'notify' as ActiveView,
      label: 'Notify',
      icon: Bell,
      badge:
        pendingNotificationsCount && pendingNotificationsCount > 0
          ? pendingNotificationsCount
          : undefined,
      badgeColor: 'bg-rose-500 text-white font-black animate-pulse shadow-sm',
    },
    {
      id: 'settings' as ActiveView,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleItemClick = (id: ActiveView) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Drawer on mobile/tablet, Static column on desktop */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-200 flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 select-none ${
          isDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div
            onClick={() => handleItemClick('dashboard')}
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            title="MediLocker"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Stethoscope className="w-5 h-5 stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white truncate">
                    MediLocker
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">Trauma Identification</p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            id="sidebar-close-mobile-btn"
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unidentified trauma beacon banner */}
        {unidentifiedCount > 0 && (
          <div
            onClick={() => handleItemClick('patients')}
            className={`cursor-pointer transition-all hover:bg-rose-500/15 ${
              isCollapsed
                ? 'mx-2 mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center justify-center text-rose-300'
                : 'mx-3 mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between'
            }`}
            title={`${unidentifiedCount} unidentified patient records require cross-matching`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              {!isCollapsed && <span className="text-xs font-semibold">Unidentified Records</span>}
            </div>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono ${
                isCollapsed ? 'mt-1' : ''
              }`}
            >
              {unidentifiedCount}
            </span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <React.Fragment key={item.id}>
                {!isCollapsed && item.id === 'global' && (
                  <div className="pt-3 pb-1.5 px-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Global Options
                    </span>
                  </div>
                )}
                <button
                  id={`nav-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
                    isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-teal-400'
                          : 'text-slate-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge !== undefined && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full font-mono ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && !isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          AI
                        </span>
                      )}
                    </div>
                  )}

                  {/* Collapsed view badge indicator */}
                  {isCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Desktop Collapse / Expand Toggle */}
        {onToggleCollapse && (
          <div className="hidden lg:block px-3 py-2 border-t border-slate-800/80">
            <button
              id="sidebar-desktop-toggle-btn"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium gap-2"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-teal-400" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Collapse sidebar</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {activeUser && (
            <div
              className={`flex items-center rounded-xl bg-slate-850 p-2 ${
                isCollapsed ? 'justify-center' : 'gap-2.5'
              }`}
              title={`${activeUser.name} (${activeUser.role})`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0 shadow-inner">
                {activeUser.name ? activeUser.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{activeUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{activeUser.role}</p>
                </div>
              )}
            </div>
          )}

          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            title={isCollapsed ? 'Log Out' : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
