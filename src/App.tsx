import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PatientsListView } from './views/PatientsListView';
import { RegisterPatientView } from './views/RegisterPatientView';
import { SearchPatientView } from './views/SearchPatientView';
import { PatientProfileView } from './views/PatientProfileView';
import { EmergencyCaseView } from './views/EmergencyCaseView';
import { EmergencyCasesListView } from './views/EmergencyCasesListView';
import { AIAssistantView } from './views/AIAssistantView';
import { GlobalDashboardView } from './views/GlobalDashboardView';
import { SettingsView } from './views/SettingsView';
import { NotifyView } from './views/NotifyView';
import { QRScannerModal } from './components/QRScannerModal';
import { api } from './services/api';
import { Patient, EmergencyCase, ActiveView, User, TreatmentNotification } from './types';
import { Loader2 } from 'lucide-react';

function MediLockerApp() {
  const { showToast } = useToast();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('emergency_care_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.name) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isGlobalQRScannerOpen, setIsGlobalQRScannerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('emergency_care_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('emergency_care_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Core Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([]);
  const [notifications, setNotifications] = useState<TreatmentNotification[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedEmergencyCase, setSelectedEmergencyCase] = useState<EmergencyCase | null>(null);
  const [notifyInitialPatientId, setNotifyInitialPatientId] = useState<string | null>(null);

  // Deep-link from Scanned QR Code URL (e.g. ?patientId=PID-1042)
  const [pendingQRTarget, setPendingQRTarget] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.get('patientId') ||
      searchParams.get('pid') ||
      searchParams.get('caseId') ||
      searchParams.get('cid')
    );
  });

  // System States
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [patientsData, casesData, healthData, notifsData] = await Promise.all([
        api.getPatients(),
        api.getEmergencyCases(),
        api.getHealth(),
        api.getNotifications(),
      ]);

      setPatients(patientsData);
      setEmergencyCases(casesData);
      setGeminiConfigured(healthData.geminiConfigured);
      setNotifications(notifsData || []);

      // If a patient was selected, refresh their reference
      if (selectedPatient) {
        const refreshed = patientsData.find((p) => p.id === selectedPatient.id);
        if (refreshed) setSelectedPatient(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to load emergency care data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPatient?.id]);

  useEffect(() => {
    loadData();
  }, []);

  // Automatically navigate into the patient profile when a QR code was scanned
  useEffect(() => {
    if (patients.length === 0 && emergencyCases.length === 0) return;

    const searchParams =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const targetPatientId =
      searchParams?.get('patientId') || searchParams?.get('pid') || pendingQRTarget;
    const targetCaseId = searchParams?.get('caseId') || searchParams?.get('cid');

    if (targetPatientId && patients.length > 0) {
      const found = patients.find(
        (p) => p.id.toLowerCase() === targetPatientId.toLowerCase()
      );
      if (found) {
        setSelectedPatient(found);
        setActiveView('patient-profile');
        setPendingQRTarget(null);
        showToast(
          'success',
          'Patient Record Loaded',
          `Scanned QR Code navigated directly to ${found.fullName} (${found.id}).`
        );
        try {
          window.history.replaceState({}, '', window.location.pathname);
        } catch {}
      }
    } else if (targetCaseId && emergencyCases.length > 0) {
      const foundCase = emergencyCases.find(
        (c) =>
          c.temporaryId.toLowerCase() === targetCaseId.toLowerCase() ||
          c.id.toLowerCase() === targetCaseId.toLowerCase()
      );
      if (foundCase) {
        setSelectedEmergencyCase(foundCase);
        setActiveView('emergency-cases');
        setPendingQRTarget(null);
        showToast(
          'info',
          'Emergency Case Loaded',
          `Scanned QR Code navigated directly to triage case ${foundCase.temporaryId}.`
        );
        try {
          window.history.replaceState({}, '', window.location.pathname);
        } catch {}
      }
    }
  }, [patients, emergencyCases, pendingQRTarget, showToast]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('emergency_care_user', JSON.stringify(user));

    if (pendingQRTarget && patients.length > 0) {
      const found = patients.find((p) => p.id.toLowerCase() === pendingQRTarget.toLowerCase());
      if (found) {
        setSelectedPatient(found);
        setActiveView('patient-profile');
        setPendingQRTarget(null);
        showToast(
          'success',
          `Welcome, ${user.name}`,
          `Directly navigated to scanned patient ${found.fullName} (${found.id}).`
        );
        return;
      }
    }

    setActiveView('dashboard');
    showToast('success', `Welcome, ${user.name}`, 'Authorized session initialized.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('emergency_care_user');
    setActiveView('dashboard');
    showToast('info', 'Logged Out', 'You have been safely signed out.');
  };

  // Patient Actions
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('patient-profile');
  };

  const handleStartEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setActiveView('register-patient');
  };

  const handlePatientSaved = (saved: Patient) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });

    setEditingPatient(null);
    setSelectedPatient(saved);
    setActiveView('patient-profile');
  };

  const handlePatientDeleted = (deletedId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== deletedId));
    if (selectedPatient?.id === deletedId) {
      setSelectedPatient(null);
    }
    setActiveView('patients');
  };

  const handlePatientUpdated = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPatient(updated);
  };

  // Emergency Case Actions
  const handleSelectEmergencyCase = (ec: EmergencyCase) => {
    setSelectedEmergencyCase(ec);
    setActiveView('emergency-cases');
  };

  const handleEmergencyCaseSaved = (saved: EmergencyCase) => {
    setEmergencyCases((prev) => [saved, ...prev]);
    setSelectedEmergencyCase(saved);
    setActiveView('emergency-cases');
  };

  const handleEmergencyCaseUpdated = (updated: EmergencyCase) => {
    setEmergencyCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleEmergencyCaseDeleted = (caseId: string) => {
    setEmergencyCases((prev) => prev.filter((c) => c.id !== caseId));
  };

  // View Navigation Helper
  const navigateTo = (view: ActiveView) => {
    if (view === 'register-patient' && activeView !== 'register-patient') {
      setEditingPatient(null); // Fresh registration unless specifically editing
    }
    setActiveView(view);
    setMobileSidebarOpen(false);
  };

  // Unauthenticated: Show Login View
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        pendingQRTarget={pendingQRTarget}
      />
    );
  }

  // Active counts
  const unidentifiedCount = patients.filter((p) => p.status === 'Unidentified').length;
  const emergencyCount = emergencyCases.length;
  const pendingNotificationsCount = currentUser
    ? notifications.filter(
        (n) =>
          n.status === 'Pending Review' &&
          (n.recipientDoctorId.toLowerCase() === currentUser.id.toLowerCase() ||
            n.recipientDoctorName.toLowerCase() === currentUser.name.toLowerCase() ||
            n.recipientHospital.toLowerCase() === (currentUser.hospitalName || '').toLowerCase())
      ).length
    : 0;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={activeView}
        onNavigate={(v) => {
          if (v === 'notify') setNotifyInitialPatientId(null);
          navigateTo(v);
        }}
        user={currentUser}
        currentUser={currentUser}
        onLogout={handleLogout}
        unidentifiedCount={unidentifiedCount}
        emergencyCount={emergencyCount}
        pendingNotificationsCount={pendingNotificationsCount}
        isOpenMobile={mobileSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentView={activeView}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onQuickEmergencyCase={() => navigateTo('emergency-case')}
          onOpenQRScanner={() => setIsGlobalQRScannerOpen(true)}
          geminiConfigured={geminiConfigured}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          hospitalName={currentUser?.hospitalName}
          onOpenSettings={() => navigateTo('settings')}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs font-semibold text-slate-500">Connecting to MediLocker database...</p>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView
                  patients={patients}
                  emergencyCases={emergencyCases}
                  onNavigate={navigateTo}
                  onSelectPatient={handleSelectPatient}
                  onSelectEmergencyCase={handleSelectEmergencyCase}
                />
              )}

              {activeView === 'patients' && (
                <PatientsListView
                  patients={patients}
                  currentUser={currentUser}
                  onSelectPatient={handleSelectPatient}
                  onRegisterNew={() => {
                    setEditingPatient(null);
                    navigateTo('register-patient');
                  }}
                  onEditPatient={handleStartEditPatient}
                  onDeletePatient={handlePatientDeleted}
                />
              )}

              {activeView === 'register-patient' && (
                <RegisterPatientView
                  initialPatient={editingPatient}
                  onSaved={handlePatientSaved}
                  onCancel={() => navigateTo('patients')}
                />
              )}

              {activeView === 'search-patient' && (
                <SearchPatientView
                  patients={patients}
                  onSelectPatient={handleSelectPatient}
                  onRegisterNew={() => {
                    setEditingPatient(null);
                    navigateTo('register-patient');
                  }}
                />
              )}

              {activeView === 'patient-profile' && (
                selectedPatient ? (
                  <PatientProfileView
                    patient={selectedPatient}
                    currentUser={currentUser}
                    isGlobalView={false}
                    onBack={() => navigateTo('patients')}
                    onEdit={handleStartEditPatient}
                    onDelete={handlePatientDeleted}
                    onUpdatePatient={handlePatientUpdated}
                    onNotify={(pid) => {
                      setNotifyInitialPatientId(pid);
                      navigateTo('notify');
                    }}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-700">No patient currently selected.</p>
                    <button
                      onClick={() => navigateTo('patients')}
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
                    >
                      Browse Patient Directory
                    </button>
                  </div>
                )
              )}

              {activeView === 'emergency-case' && (
                <EmergencyCaseView
                  onSaved={handleEmergencyCaseSaved}
                  onCancel={() => navigateTo('dashboard')}
                />
              )}

              {activeView === 'emergency-cases' && (
                <EmergencyCasesListView
                  emergencyCases={emergencyCases}
                  onNewEmergencyCase={() => navigateTo('emergency-case')}
                  onUpdateCase={handleEmergencyCaseUpdated}
                  onDeleteCase={handleEmergencyCaseDeleted}
                  selectedCaseForView={selectedEmergencyCase}
                  onClearSelectedCase={() => setSelectedEmergencyCase(null)}
                />
              )}

              {activeView === 'ai-assistant' && (
                <AIAssistantView
                  geminiConfigured={geminiConfigured}
                  onNavigateToPatient={(pid) => {
                    const p = patients.find((pat) => pat.id === pid);
                    if (p) handleSelectPatient(p);
                  }}
                />
              )}

              {activeView === 'global' && (
                <GlobalDashboardView
                  patients={patients}
                  currentUser={currentUser}
                  onRefreshData={loadData}
                  onSwitchUser={(newUser) => {
                    setCurrentUser(newUser);
                    try {
                      localStorage.setItem('emergency_care_user', JSON.stringify(newUser));
                    } catch {}
                  }}
                  onNavigate={(view) => {
                    if (view === 'notify') setNotifyInitialPatientId(null);
                    navigateTo(view);
                  }}
                  pendingNotificationsCount={pendingNotificationsCount}
                />
              )}

              {activeView === 'notify' && (
                <NotifyView
                  currentUser={currentUser}
                  patients={patients}
                  notifications={notifications}
                  onRefreshNotifications={async () => {
                    const notifs = await api.getNotifications();
                    setNotifications(notifs);
                  }}
                  onRefreshPatients={loadData}
                  onNavigateToPatient={(pid) => {
                    const p = patients.find((pat) => pat.id === pid);
                    if (p) handleSelectPatient(p);
                  }}
                  onNavigate={navigateTo}
                  showToast={(title, msg, type) => showToast(type || 'success', title, msg)}
                  initialPatientId={notifyInitialPatientId}
                />
              )}

              {activeView === 'settings' && (
                <SettingsView
                  geminiConfigured={geminiConfigured}
                  totalPatients={patients.length}
                  totalEmergencyCases={emergencyCases.length}
                  onDataReset={loadData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Universal Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isGlobalQRScannerOpen}
        onClose={() => setIsGlobalQRScannerOpen(false)}
        patients={patients}
        emergencyCases={emergencyCases}
        onSelectPatient={(patient) => {
          handleSelectPatient(patient);
        }}
        onSelectEmergencyCase={(ec) => {
          handleSelectEmergencyCase(ec);
        }}
        onRegisterWithId={(id) => {
          setEditingPatient(null);
          navigateTo('register-patient');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MediLockerApp />
    </ToastProvider>
  );
}
