import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Filter,
  Lock,
  ShieldAlert,
  Building2,
  UserCheck,
  FileText,
  Pill,
  Stethoscope,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Eye,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  User,
  Fingerprint,
  HeartPulse,
  History,
  FileCheck,
  ExternalLink,
  Info,
  ArrowUpDown,
} from 'lucide-react';
import {
  Patient,
  User as UserType,
  DiagnosisRecord,
  MedicationRecord,
  MedicalReportRecord,
  TreatmentTimelineRecord,
  CaseHistoryEntry,
  AuditLogEntry,
} from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { AgeFilterControls } from '../components/AgeFilterControls';
import { Modal } from '../components/Modal';

// Helper to parse age range queries like "18-22", "18 - 22", "18 to 22", "50+", "<25", "21"
export function parseAgeRange(input: string): { min: number; max: number } | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  // Format: "18-22", "18 - 22", "18 to 22", "18..22"
  const rangeMatch = clean.match(/^(\d+)\s*(?:-|to|\.\.)\s*(\d+)$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  // Format: "50+", ">=50", ">50"
  const plusMatch = clean.match(/^(\d+)\s*\+$/) || clean.match(/^>=\s*(\d+)$/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: 150 };
  }

  // Format: "<20", "<=20"
  const underMatch = clean.match(/^<=\s*(\d+)$/) || clean.match(/^<\s*(\d+)$/);
  if (underMatch) {
    return { min: 0, max: parseInt(underMatch[1], 10) };
  }

  // Single exact age, e.g. "21"
  const singleMatch = clean.match(/^(\d+)$/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { min: val, max: val };
  }

  return null;
}

// Extracts numeric boundaries and midpoint primary age from number or approximate string like "Approx 20-25"
export function getPatientAgeRange(age: number | string): { min: number; max: number; primary: number } {
  if (typeof age === 'number') {
    return { min: age, max: age, primary: age };
  }
  if (!age) {
    return { min: 0, max: 120, primary: 0 };
  }
  const str = String(age);
  const numbers = str.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return { min: 0, max: 120, primary: 0 };
  }
  if (numbers.length >= 2) {
    const a = parseInt(numbers[0], 10);
    const b = parseInt(numbers[1], 10);
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return { min, max, primary: Math.round((min + max) / 2) };
  }
  const val = parseInt(numbers[0], 10);
  return { min: val, max: val, primary: val };
}

export function isPatientInAgeRange(age: number | string, ageQuery: string): boolean {
  if (!ageQuery.trim()) return true;
  const parsed = parseAgeRange(ageQuery);
  const patientRange = getPatientAgeRange(age);
  if (parsed) {
    return patientRange.min <= parsed.max && patientRange.max >= parsed.min;
  }
  return String(age).toLowerCase().includes(ageQuery.trim().toLowerCase());
}

interface GlobalDashboardViewProps {
  patients: Patient[];
  currentUser: UserType | null;
  onRefreshData: () => Promise<void>;
  onSwitchUser?: (newUser: UserType) => void;
}

type GlobalTab =
  | 'overview'
  | 'diagnoses'
  | 'medications'
  | 'case-history'
  | 'reports'
  | 'timeline'
  | 'audit-trail';

export const GlobalDashboardView: React.FC<GlobalDashboardViewProps> = ({
  patients,
  currentUser,
  onRefreshData,
  onSwitchUser,
}) => {
  const { showToast } = useToast();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ageQuery, setAgeQuery] = useState('');
  const [ageSort, setAgeSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [hospitalFilter, setHospitalFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Identified' | 'Unidentified'>('All');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'unknown-only'>('all');

  // Selected Patient for Global Centralized History
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GlobalTab>('overview');

  // Available Doctors for Multi-Hospital simulation
  const [availableDoctors, setAvailableDoctors] = useState<UserType[]>([]);
  const [activeDoctor, setActiveDoctor] = useState<UserType | null>(currentUser);
  const [isSwitchingDoctor, setIsSwitchingDoctor] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Append Record Modal state
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [appendType, setAppendType] = useState<
    'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline'
  >('diagnosis');
  const [isSubmittingAppend, setIsSubmittingAppend] = useState(false);

  // Append Form fields
  const [appendCondition, setAppendCondition] = useState('');
  const [appendIcdCode, setAppendIcdCode] = useState('');
  const [appendSeverity, setAppendSeverity] = useState('Moderate');
  const [appendNotes, setAppendNotes] = useState('');
  const [appendMedName, setAppendMedName] = useState('');
  const [appendMedDosage, setAppendMedDosage] = useState('');
  const [appendMedFreq, setAppendMedFreq] = useState('Once daily');
  const [appendMedInstructions, setAppendMedInstructions] = useState('');
  const [appendReportTitle, setAppendReportTitle] = useState('');
  const [appendReportCategory, setAppendReportCategory] = useState<'Lab' | 'Radiology' | 'ECG' | 'Discharge' | 'Other'>('Lab');
  const [appendReportSummary, setAppendReportSummary] = useState('');
  const [appendReportFindings, setAppendReportFindings] = useState('');
  const [appendCaseTitle, setAppendCaseTitle] = useState('');
  const [appendCaseDetails, setAppendCaseDetails] = useState('');
  const [appendTimelineTitle, setAppendTimelineTitle] = useState('');
  const [appendTimelineOutcome, setAppendTimelineOutcome] = useState('');

  // Selected Report Preview Modal
  const [previewReport, setPreviewReport] = useState<MedicalReportRecord | null>(null);

  // Unauthorized Action Alert Modal
  const [securityBlockModal, setSecurityBlockModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    targetAuthor?: string;
    targetHospital?: string;
  }>({
    open: false,
    title: '',
    message: '',
  });

  // Load doctor directory and initial audit trail
  useEffect(() => {
    loadDoctorsAndAudit();
  }, []);

  const loadDoctorsAndAudit = async () => {
    try {
      setIsLoadingAudit(true);
      const [docRes, logs] = await Promise.all([
        api.getDoctors().catch(() => null),
        api.getAuditLogs().catch(() => []),
      ]);
      if (docRes && docRes.availableDoctors) {
        setAvailableDoctors(docRes.availableDoctors);
        if (!activeDoctor && docRes.currentDoctor) {
          setActiveDoctor(docRes.currentDoctor);
        }
      }
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load global context:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Find active patient reference
  const currentPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Log cross-hospital view whenever a patient is selected in Global view
  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setActiveTab('overview');

    // Audit log cross-hospital view
    if (activeDoctor) {
      try {
        await api.addAuditLog({
          action: 'CROSS_HOSPITAL_RECORD_ACCESSED',
          actorId: activeDoctor.id,
          actorName: activeDoctor.name,
          actorBadge: activeDoctor.badgeNumber,
          actorRole: activeDoctor.role,
          actorHospital: activeDoctor.hospitalName,
          targetPatientId: patient.id,
          targetPatientName: patient.fullName,
          details: `Clinician accessed centralized medical history from Global Dashboard. Origin hospital: ${patient.originHospital || 'Unspecified'}.`,
          status: 'SUCCESS',
        });
        // Refresh audit logs
        const updatedLogs = await api.getAuditLogs();
        setAuditLogs(updatedLogs);
      } catch (err) {
        console.error('Audit log failed:', err);
      }
    }
  };

  // Handle Switch Doctor
  const handleDoctorSwitch = async (docId: string) => {
    const target = availableDoctors.find((d) => d.id === docId);
    if (!target) return;
    try {
      setIsSwitchingDoctor(true);
      const res = await api.switchDoctor(docId);
      if (res.success) {
        setActiveDoctor(res.user);
        if (onSwitchUser) onSwitchUser(res.user);
        showToast(
          'info',
          'Clinician Context Switched',
          `Active user is now ${res.user.name} at ${res.user.hospitalName}.`
        );
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      showToast('error', 'Switch Failed', err.message);
    } finally {
      setIsSwitchingDoctor(false);
    }
  };

  // Enforce View-Only Block on Edit
  const handleAttemptEditRecord = (
    recordType: string,
    recordAuthorName?: string,
    recordAuthorHospital?: string,
    recordAuthorId?: string
  ) => {
    const isOriginalAuthor =
      activeDoctor && recordAuthorId && activeDoctor.id === recordAuthorId;

    // In Global Dashboard, everything is strictly View-Only
    setSecurityBlockModal({
      open: true,
      title: 'Global Record-Level Security: View-Only Enforced',
      message: `The Global option is view-only by default. Existing medical records, diagnoses, medications, case history, and reports cannot be edited or deleted from the Global Dashboard. ${
        recordAuthorName
          ? `This record was originally created by ${recordAuthorName} (${recordAuthorHospital || 'another hospital'}).`
          : ''
      } To add new clinical observations without modifying previous records, use the "Append New Record" feature under ${
        activeDoctor?.hospitalName || 'your authorized hospital'
      }.`,
      targetAuthor: recordAuthorName,
      targetHospital: recordAuthorHospital,
    });

    // Write audit trail entry for blocked unauthorized edit attempt
    if (activeDoctor && currentPatient) {
      api.addAuditLog({
        action: 'BLOCKED_UNAUTHORIZED_EDIT',
        actorId: activeDoctor.id,
        actorName: activeDoctor.name,
        actorBadge: activeDoctor.badgeNumber,
        actorRole: activeDoctor.role,
        actorHospital: activeDoctor.hospitalName,
        targetPatientId: currentPatient.id,
        targetPatientName: currentPatient.fullName,
        details: `Blocked edit attempt on ${recordType} in Global Dashboard. View-Only policy enforced. Record author: ${recordAuthorName || 'Unknown'} (${recordAuthorHospital || 'Unknown facility'}).`,
        status: 'DENIED',
      }).then(() => {
        api.getAuditLogs().then(setAuditLogs);
      });
    }
  };

  // Handle Append Record submission
  const handleAppendRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient || !activeDoctor) return;

    try {
      setIsSubmittingAppend(true);
      let payloadRecord: any = {};

      if (appendType === 'diagnosis') {
        if (!appendCondition.trim()) {
          showToast('error', 'Missing Field', 'Condition name is required');
          return;
        }
        payloadRecord = {
          condition: appendCondition.trim(),
          icd10Code: appendIcdCode.trim() || 'R69',
          severity: appendSeverity,
          status: 'Active',
          notes: appendNotes.trim(),
        };
      } else if (appendType === 'medication') {
        if (!appendMedName.trim()) {
          showToast('error', 'Missing Field', 'Medication name is required');
          return;
        }
        payloadRecord = {
          name: appendMedName.trim(),
          dosage: appendMedDosage.trim() || 'Standard Dose',
          frequency: appendMedFreq.trim(),
          status: 'Active',
          instructions: appendMedInstructions.trim(),
        };
      } else if (appendType === 'report') {
        if (!appendReportTitle.trim()) {
          showToast('error', 'Missing Field', 'Report title is required');
          return;
        }
        payloadRecord = {
          title: appendReportTitle.trim(),
          category: appendReportCategory,
          summary: appendReportSummary.trim(),
          keyFindings: appendReportFindings.split('\n').filter((f) => f.trim().length > 0),
        };
      } else if (appendType === 'caseHistory') {
        if (!appendCaseTitle.trim()) {
          showToast('error', 'Missing Field', 'Encounter title is required');
          return;
        }
        payloadRecord = {
          incidentTitle: appendCaseTitle.trim(),
          details: appendCaseDetails.trim() || 'Clinical evaluation recorded.',
          severity: 'Moderate',
          location: activeDoctor.hospitalName,
        };
      } else if (appendType === 'timeline') {
        if (!appendTimelineTitle.trim()) {
          showToast('error', 'Missing Field', 'Milestone title is required');
          return;
        }
        payloadRecord = {
          stageTitle: appendTimelineTitle.trim(),
          outcome: appendTimelineOutcome.trim() || 'Under observation',
          category: 'Consultation',
        };
      }

      const res = await api.appendPatientRecord(currentPatient.id, {
        type: appendType,
        record: payloadRecord,
        user: activeDoctor,
      });

      if (res.success) {
        showToast(
          'success',
          'Clinical Record Appended',
          `New ${appendType} successfully saved under ${activeDoctor.hospitalName}. Prior records preserved.`
        );
        setShowAppendModal(false);
        // Reset form
        setAppendCondition('');
        setAppendIcdCode('');
        setAppendNotes('');
        setAppendMedName('');
        setAppendMedDosage('');
        setAppendMedInstructions('');
        setAppendReportTitle('');
        setAppendReportSummary('');
        setAppendReportFindings('');
        setAppendCaseTitle('');
        setAppendCaseDetails('');
        setAppendTimelineTitle('');
        setAppendTimelineOutcome('');

        // Refresh global data
        await onRefreshData();
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      showToast('error', 'Append Failed', err.message || 'Unable to record entry');
    } finally {
      setIsSubmittingAppend(false);
    }
  };

  // Hospital list extracted from all patients
  const hospitalList = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((p) => {
      if (p.originHospital) set.add(p.originHospital);
      p.diagnoses?.forEach((d) => d.hospitalName && set.add(d.hospitalName));
      p.medications?.forEach((m) => m.hospitalName && set.add(m.hospitalName));
      p.medicalReports?.forEach((r) => r.hospitalName && set.add(r.hospitalName));
    });
    return Array.from(set);
  }, [patients]);

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    const list = patients.filter((p) => {
      // Unknown-only quick filter
      if (activeCategoryFilter === 'unknown-only' && p.status !== 'Unidentified') {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && p.status !== statusFilter) {
        return false;
      }

      // Hospital filter
      if (hospitalFilter !== 'All') {
        const hasHospital =
          p.originHospital === hospitalFilter ||
          p.diagnoses?.some((d) => d.hospitalName === hospitalFilter) ||
          p.medications?.some((m) => m.hospitalName === hospitalFilter) ||
          p.medicalReports?.some((r) => r.hospitalName === hospitalFilter);
        if (!hasHospital) return false;
      }

      // Age range / group filter
      if (ageQuery.trim()) {
        const inAgeRange = isPatientInAgeRange(p.age, ageQuery);
        if (!inAgeRange) return false;
      }

      // Search query across fields
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const inBasic =
        p.fullName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.fingerprintRefId.toLowerCase().includes(q) ||
        p.identificationRemarks.toLowerCase().includes(q) ||
        p.emergencyNotes.toLowerCase().includes(q) ||
        (p.bloodType && p.bloodType.toLowerCase().includes(q)) ||
        (p.allergies && p.allergies.toLowerCase().includes(q)) ||
        (p.originHospital && p.originHospital.toLowerCase().includes(q)) ||
        (p.registeredByDoctor && p.registeredByDoctor.toLowerCase().includes(q));

      if (inBasic) return true;

      // Search in diagnoses
      const inDiagnoses = p.diagnoses?.some(
        (d) =>
          d.condition.toLowerCase().includes(q) ||
          d.hospitalName?.toLowerCase().includes(q) ||
          d.doctorName?.toLowerCase().includes(q)
      );
      if (inDiagnoses) return true;

      // Search in medications
      const inMedications = p.medications?.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.hospitalName?.toLowerCase().includes(q) ||
          m.prescribingDoctor?.toLowerCase().includes(q)
      );
      if (inMedications) return true;

      // Search in reports
      const inReports = p.medicalReports?.some(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.hospitalName?.toLowerCase().includes(q) ||
          r.summary?.toLowerCase().includes(q)
      );
      if (inReports) return true;

      return false;
    });

    // Sort by age
    if (ageSort === 'asc') {
      list.sort((a, b) => getPatientAgeRange(a.age).primary - getPatientAgeRange(b.age).primary);
    } else if (ageSort === 'desc') {
      list.sort((a, b) => getPatientAgeRange(b.age).primary - getPatientAgeRange(a.age).primary);
    } else if (ageQuery.trim()) {
      // Auto-sort ascending when age bracket is entered so records are sequentially organized
      list.sort((a, b) => getPatientAgeRange(a.age).primary - getPatientAgeRange(b.age).primary);
    }

    return list;
  }, [patients, searchQuery, ageQuery, ageSort, hospitalFilter, statusFilter, activeCategoryFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Global Network Header & Active Doctor Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Global Medical History Network
                  </h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    View-Only by Default
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                  Centralized cross-hospital electronic health record network. Search and view
                  complete medical history, case history, case studies, diagnoses, medications,
                  reports, and treatment timelines across all participating healthcare institutions.
                </p>
              </div>
            </div>
          </div>

          {/* Active Clinician Context & Interactive Switcher for Verification */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shrink-0 min-w-[280px] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                Active Attending Clinician
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800">
                {activeDoctor?.badgeNumber || 'Badge Active'}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                {activeDoctor?.name || 'Dr. Evelyn Reed, MD'}
              </p>
              <p className="text-xs text-teal-300/90 font-medium truncate">
                {activeDoctor?.hospitalName || "St. Jude Children's & General Hospital"}
              </p>
            </div>

            {/* Quick Doctor Switcher to verify record-level permissions */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-[10px] text-slate-400 font-medium block mb-1.5">
                Switch Clinician (Test Cross-Hospital Permissions):
              </label>
              <select
                id="global-doctor-switcher"
                value={activeDoctor?.id || ''}
                onChange={(e) => handleDoctorSwitch(e.target.value)}
                disabled={isSwitchingDoctor}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {availableDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.hospitalName.split(' ')[0]} ({doc.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Viewport: Patient Selection View or Detail Centralized History */}
      {!currentPatient ? (
        <div className="space-y-6">
          {/* Quick Help for Unidentified / Unknown Patient Protocol */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-amber-900">
                  Unidentified / Unknown Patient Protocol
                </h3>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  If an unknown patient arrives at your facility, search the Global Dashboard by
                  physical remarks, tattoos, biometric reference, or blood type. You can retrieve
                  previously stored medical history from other hospitals without logging into
                  another hospital account.
                </p>
              </div>
            </div>
            <button
              id="filter-unknown-patients-btn"
              onClick={() => {
                setActiveCategoryFilter((prev) =>
                  prev === 'unknown-only' ? 'all' : 'unknown-only'
                );
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                activeCategoryFilter === 'unknown-only'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              {activeCategoryFilter === 'unknown-only'
                ? 'Showing Unknown Patients (Click to Reset)'
                : 'Filter Unknown Patients Only'}
            </button>
          </div>

          {/* Search Bar & Multi-Hospital Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Reduced Search Box */}
              <div className="relative w-full lg:w-72 xl:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="global-search-input"
                  type="text"
                  placeholder="Search patient, ID, condition, doc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Age Column (Filter & Sort by Age) near search box */}
              <AgeFilterControls
                ageQuery={ageQuery}
                onAgeChange={setAgeQuery}
                ageSort={ageSort}
                onToggleSort={() =>
                  setAgeSort((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc'))
                }
                theme="teal"
                idPrefix="global-age"
              />

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto">
                {(['All', 'Identified', 'Unidentified'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'All' ? 'All Status' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Age Filter Notification Pill */}
            {ageQuery && (
              <div className="flex items-center justify-between px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Active Age Filter:</span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-700 text-white font-mono font-bold text-[11px]">
                    {ageQuery}
                  </span>
                  <span>
                    — Matching <strong className="font-bold text-teal-950">{filteredPatients.length}</strong> patient{filteredPatients.length === 1 ? '' : 's'} in this age group
                  </span>
                  {ageSort === 'asc' && (
                    <span className="text-teal-700 text-[11px] font-semibold">(Sorted by Youngest first)</span>
                  )}
                  {ageSort === 'desc' && (
                    <span className="text-teal-700 text-[11px] font-semibold">(Sorted by Oldest first)</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAgeQuery('');
                    setAgeSort('none');
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-950 underline shrink-0 ml-3 cursor-pointer"
                >
                  Clear Age Filter
                </button>
              </div>
            )}

            {/* Hospital Origin Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Hospital Filter:
              </span>
              <button
                onClick={() => setHospitalFilter('All')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  hospitalFilter === 'All'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Hospitals ({patients.length})
              </button>
              {hospitalList.map((hosp) => (
                <button
                  key={hosp}
                  onClick={() => setHospitalFilter(hosp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    hospitalFilter === hosp
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {hosp}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards Grid */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-700">
                  Centralized Patient Directory ({filteredPatients.length} records found)
                </h2>
                {ageQuery && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                    Age: {ageQuery}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                Click any patient to open complete cross-hospital medical history
              </span>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Patient Records Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {ageQuery
                    ? `No medical records matched the age criteria "${ageQuery}". Try clearing the age filter or expanding the range.`
                    : 'No medical records matched your current query or hospital filter. Try adjusting your search terms or clearing filters.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setAgeQuery('');
                    setAgeSort('none');
                    setHospitalFilter('All');
                    setStatusFilter('All');
                    setActiveCategoryFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => {
                  const isIdentified = patient.status === 'Identified';
                  const isAgeMatch = ageQuery ? isPatientInAgeRange(patient.age, ageQuery) : false;
                  const diagCount = patient.diagnoses?.length || 0;
                  const medCount = patient.medications?.length || 0;
                  const repCount = patient.medicalReports?.length || 0;
                  const caseCount = patient.caseHistory?.length || 0;

                  return (
                    <div
                      key={patient.id}
                      id={`global-patient-card-${patient.id}`}
                      onClick={() => handleSelectPatient(patient)}
                      className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between gap-4 cursor-pointer group ${
                        isAgeMatch
                          ? 'border-teal-400 ring-2 ring-teal-500/10 hover:shadow-md'
                          : 'border-slate-200 hover:border-teal-400/80 hover:shadow-md'
                      }`}
                    >
                      {/* Top info */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {patient.photo ? (
                                <img
                                  src={patient.photo}
                                  alt={patient.fullName}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold text-base">
                                  {patient.fullName.charAt(0)}
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  isIdentified ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] font-bold text-slate-500">
                                  {patient.id}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                    isIdentified
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {patient.status}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                                {patient.fullName}
                              </h3>
                              <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 mt-0.5">
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded-md text-[11px] transition-colors ${
                                    isAgeMatch
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {patient.age} yrs
                                </span>
                                <span>•</span>
                                <span>{patient.gender}</span>
                                <span>•</span>
                                <span>Blood: {patient.bloodType || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Originating Hospital & Author Badge */}
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">
                              {patient.originHospital || "St. Jude Children's & General Hospital"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Author: {patient.registeredByDoctor || 'Attending Staff'}</span>
                            <span className="font-mono">
                              {patient.createdAt?.slice(0, 10) || 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Identification Remarks / Biometrics (Critical for Unknown Patients) */}
                        <div className="text-[11px] text-slate-600 line-clamp-2">
                          <span className="font-semibold text-slate-700">Biometric Ref:</span>{' '}
                          <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1 py-0.2 rounded">
                            {patient.fingerprintRefId || 'None'}
                          </span>
                          {patient.identificationRemarks && (
                            <p className="mt-0.5 italic text-slate-500">
                              "{patient.identificationRemarks}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom clinical counts & CTA */}
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="grid grid-cols-4 gap-1 text-center">
                          <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Diag</p>
                            <p className="text-xs font-black text-slate-700">{diagCount}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Meds</p>
                            <p className="text-xs font-black text-slate-700">{medCount}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Reports</p>
                            <p className="text-xs font-black text-slate-700">{repCount}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Cases</p>
                            <p className="text-xs font-black text-slate-700">{caseCount}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View Centralized History
                          </span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed Centralized Medical History View */
        <div className="space-y-6">
          {/* Top Patient Header with View-Only Notice & Back Button */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  id="global-back-to-list-btn"
                  onClick={() => setSelectedPatientId(null)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Global List</span>
                </button>

                <div className="flex items-center gap-3">
                  {currentPatient.photo ? (
                    <img
                      src={currentPatient.photo}
                      alt={currentPatient.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-black text-xl">
                      {currentPatient.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {currentPatient.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          currentPatient.status === 'Identified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {currentPatient.status}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Blood: {currentPatient.bloodType || 'Unverified'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {currentPatient.fullName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Age: {currentPatient.age} • Gender: {currentPatient.gender} • Allergies:{' '}
                      <span className="font-semibold text-rose-600">
                        {currentPatient.allergies || 'None documented'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action: Append Record Button under current doctor */}
              <div className="flex items-center gap-2">
                <button
                  id="global-append-record-btn"
                  onClick={() => setShowAppendModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Append Record ({activeDoctor?.hospitalName.split(' ')[0]})</span>
                </button>
              </div>
            </div>

            {/* MANDATORY VIEW-ONLY SECURITY NOTICE */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-sky-900">
              <Lock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-bold text-sky-950">
                  Global Dashboard: View-Only Mode Active
                </p>
                <p className="text-sky-800">
                  This centralized dashboard displays the complete medical history of this patient
                  originally recorded by{' '}
                  <strong className="text-sky-950">
                    {currentPatient.registeredByDoctor || 'Attending Physician'}
                  </strong>{' '}
                  at{' '}
                  <strong className="text-sky-950">
                    {currentPatient.originHospital || "St. Jude Children's & General Hospital"}
                  </strong>
                  . To protect patient safety and medical record integrity, existing records cannot
                  be edited or deleted from the Global Dashboard. Any new diagnoses, medications, or
                  findings must be saved as new records under your facility (
                  <strong className="text-sky-950">
                    {activeDoctor?.hospitalName || 'your hospital'}
                  </strong>
                  ).
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100">
              {[
                { id: 'overview' as GlobalTab, label: 'Overview & Case Study', icon: Layers },
                {
                  id: 'diagnoses' as GlobalTab,
                  label: `Diagnoses (${currentPatient.diagnoses?.length || 0})`,
                  icon: Stethoscope,
                },
                {
                  id: 'medications' as GlobalTab,
                  label: `Medications (${currentPatient.medications?.length || 0})`,
                  icon: Pill,
                },
                {
                  id: 'case-history' as GlobalTab,
                  label: `Case History (${currentPatient.caseHistory?.length || 0})`,
                  icon: Activity,
                },
                {
                  id: 'reports' as GlobalTab,
                  label: `Medical Reports (${currentPatient.medicalReports?.length || 0})`,
                  icon: FileText,
                },
                {
                  id: 'timeline' as GlobalTab,
                  label: `Treatment Timeline (${currentPatient.treatmentTimeline?.length || 0})`,
                  icon: Clock,
                },
                {
                  id: 'audit-trail' as GlobalTab,
                  label: `Audit Trail (${
                    auditLogs.filter((l) => l.targetPatientId === currentPatient.id).length
                  })`,
                  icon: History,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`global-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: OVERVIEW & CASE STUDY */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Emergency Notes & Clinical Remarks */}
              <div className="lg:col-span-2 space-y-6">
                {/* Emergency Notes & Triage Alerts */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency Notes & Triage Directives</span>
                  </div>
                  <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {currentPatient.emergencyNotes || 'No acute emergency conditions documented.'}
                  </div>
                </div>

                {/* Identification Remarks & Biometrics */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Fingerprint className="w-4 h-4 text-teal-600" />
                    <span>Identification Reference & Physical Descriptors</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Biometric Reference ID
                      </span>
                      <p className="font-mono font-bold text-teal-800 text-sm">
                        {currentPatient.fingerprintRefId || 'Not cataloged'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Phone / Family Contact
                      </span>
                      <p className="font-medium text-slate-800">
                        {currentPatient.phone || 'None recorded'}
                      </p>
                    </div>
                  </div>

                  {currentPatient.identificationRemarks && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Physical Markers / Tattoos / Identification Details
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {currentPatient.identificationRemarks}
                      </p>
                    </div>
                  )}
                </div>

                {/* Case Study Overview Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <FileCheck className="w-4 h-4 text-sky-600" />
                      <span>Case Studies & Hospital Clinical Records</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Consolidated from {hospitalList.length} Network Health Systems
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    This patient's centralized electronic chart aggregates real-time records from all
                    affiliated trauma centers, emergency departments, and specialty institutes. Use the tabs
                    above to view individual diagnoses, active medications, diagnostic reports, and
                    treatment milestones.
                  </p>
                </div>
              </div>

              {/* Right Col: Origin Hospital & Master Registration Authority */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Master Origin Authority</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-teal-700 uppercase">
                        Registering Health System
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {currentPatient.originHospital || "St. Jude Children's & General Hospital"}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Authorized Physician
                      </span>
                      <p className="font-bold text-slate-900">
                        {currentPatient.registeredByDoctor || 'Dr. Evelyn Reed, MD'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Author ID: {currentPatient.registeredByDoctorId || 'DOC-7701'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Registration Timestamp
                      </span>
                      <p className="text-slate-700 font-mono text-[11px]">
                        {currentPatient.createdAt || 'Standard Registry Entry'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Access Rules Box */}
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-teal-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Control Policies</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>
                        <strong>Global View:</strong> View-only access across all hospitals.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>
                        <strong>Author Permissions:</strong> Only the original clinician who
                        recorded an entry can edit or delete it.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>
                        <strong>Multi-Hospital Integrity:</strong> New hospitals append independent
                        records under their own name.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIAGNOSES */}
          {activeTab === 'diagnoses' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Diagnoses & Clinical Conditions</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing all diagnoses cataloged across network hospitals
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAppendType('diagnosis');
                    setShowAppendModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Append Diagnosis</span>
                </button>
              </div>

              {!currentPatient.diagnoses || currentPatient.diagnoses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No diagnoses recorded yet for this patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPatient.diagnoses.map((diag) => {
                    const isAuthor =
                      activeDoctor && diag.doctorId && activeDoctor.id === diag.doctorId;
                    return (
                      <div
                        key={diag.id}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500">
                                {diag.id}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                ICD-10: {diag.icd10Code || diag.icdCode || 'R69'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  diag.status === 'Active'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {diag.status}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                Severity: {diag.severity || 'Moderate'}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mt-1">
                              {diag.condition}
                            </h4>
                          </div>

                          {/* Hospital & Doctor Attribution Tag + Locked / Protected Edit */}
                          <div className="flex items-center gap-2">
                            <div className="text-right text-[11px]">
                              <p className="font-bold text-slate-800 flex items-center justify-end gap-1">
                                <Building2 className="w-3 h-3 text-teal-600" />
                                {diag.hospitalName || currentPatient.originHospital}
                              </p>
                              <p className="text-slate-500">
                                Dr: {diag.doctorName || currentPatient.registeredByDoctor}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleAttemptEditRecord(
                                  'Diagnosis',
                                  diag.doctorName || currentPatient.registeredByDoctor,
                                  diag.hospitalName || currentPatient.originHospital,
                                  diag.doctorId || currentPatient.registeredByDoctorId
                                )
                              }
                              title="Global option is View-Only"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {diag.notes && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                            {diag.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Diagnosed Date: {diag.diagnosedDate}</span>
                          <span>Recorded on {diag.createdAt?.slice(0, 10) || 'Registry'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDICATIONS */}
          {activeTab === 'medications' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Medications & Prescriptions</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive drug regimen prescribed across network facilities
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAppendType('medication');
                    setShowAppendModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Append Prescription</span>
                </button>
              </div>

              {!currentPatient.medications || currentPatient.medications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No medication records on file for this patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPatient.medications.map((med) => {
                    return (
                      <div
                        key={med.id}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500">
                                {med.id}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  med.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {med.status}
                              </span>
                              <span className="text-xs font-semibold text-teal-700">
                                {med.dosage}
                              </span>
                              <span className="text-xs text-slate-500">• {med.frequency}</span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mt-1">{med.name}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right text-[11px]">
                              <p className="font-bold text-slate-800 flex items-center justify-end gap-1">
                                <Building2 className="w-3 h-3 text-teal-600" />
                                {med.hospitalName || currentPatient.originHospital}
                              </p>
                              <p className="text-slate-500">
                                Prescriber:{' '}
                                {med.prescribedByDoctor ||
                                  med.prescribingDoctor ||
                                  currentPatient.registeredByDoctor}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleAttemptEditRecord(
                                  'Medication',
                                  med.prescribedByDoctor ||
                                    med.prescribingDoctor ||
                                    currentPatient.registeredByDoctor,
                                  med.hospitalName || currentPatient.originHospital,
                                  med.prescribedByDoctorId ||
                                    med.doctorId ||
                                    currentPatient.registeredByDoctorId
                                )
                              }
                              title="Global option is View-Only"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {med.instructions && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                            <strong>Instructions:</strong> {med.instructions}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Prescribed Date: {med.prescribedDate}</span>
                          <span>Recorded on {med.createdAt?.slice(0, 10) || 'Registry'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CASE HISTORY */}
          {activeTab === 'case-history' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>Case History & Clinical Encounters</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological record of hospital admissions, ER intakes, and specialist consultations
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAppendType('caseHistory');
                    setShowAppendModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Append Encounter</span>
                </button>
              </div>

              {!currentPatient.caseHistory || currentPatient.caseHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No case history entries recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPatient.caseHistory.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">
                              {c.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.severity === 'Critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : c.severity === 'Severe'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {c.severity}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{c.date}</span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1">
                            {c.incidentTitle}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right text-[11px]">
                            <p className="font-bold text-slate-800 flex items-center justify-end gap-1">
                              <Building2 className="w-3 h-3 text-teal-600" />
                              {c.hospitalName || c.location || currentPatient.originHospital}
                            </p>
                            <p className="text-slate-500">
                              Physician: {c.treatingPhysician || 'Duty Staff'}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              handleAttemptEditRecord(
                                'Case History',
                                c.treatingPhysician,
                                c.hospitalName || c.location,
                                c.treatingPhysicianId
                              )
                            }
                            title="Global option is View-Only"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {c.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MEDICAL REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Uploaded Medical Reports & Diagnostic Studies</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Radiology, Laboratory assays, Cardiac ECGs, and operative pathology
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAppendType('report');
                    setShowAppendModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Append Medical Report</span>
                </button>
              </div>

              {!currentPatient.medicalReports || currentPatient.medicalReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No diagnostic medical reports uploaded for this patient.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentPatient.medicalReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500">
                                {rep.id}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                {rep.category || rep.type || 'Lab Report'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{rep.title}</h4>
                          </div>

                          <button
                            onClick={() =>
                              handleAttemptEditRecord(
                                'Medical Report',
                                rep.doctorName || currentPatient.registeredByDoctor,
                                rep.hospitalName || currentPatient.originHospital,
                                rep.doctorId || currentPatient.registeredByDoctorId
                              )
                            }
                            title="Global option is View-Only"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {rep.summary || rep.findings || 'Standard clinical study recorded.'}
                        </p>

                        <div className="bg-white p-2 rounded-xl border border-slate-100 text-[11px] space-y-0.5">
                          <p className="font-semibold text-slate-700 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-teal-600" />
                            {rep.hospitalName || currentPatient.originHospital}
                          </p>
                          <p className="text-slate-500">
                            Attending: {rep.doctorName || currentPatient.registeredByDoctor}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Date: {rep.reportDate || rep.date || 'Active'}
                        </span>
                        <button
                          onClick={() => setPreviewReport(rep)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TREATMENT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Cross-Hospital Treatment Timeline</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological progression of treatments and clinical milestones across healthcare systems
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAppendType('timeline');
                    setShowAppendModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Append Milestone</span>
                </button>
              </div>

              {!currentPatient.treatmentTimeline || currentPatient.treatmentTimeline.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No timeline milestones documented yet.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-teal-300 space-y-6 my-2">
                  {currentPatient.treatmentTimeline.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-teal-600 border-4 border-white shadow-xs" />
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-800">
                              {item.date}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {item.category || 'Clinical Milestone'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-teal-600" />
                            {item.hospitalName || currentPatient.originHospital}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">{item.stageTitle}</h4>

                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>
                            <strong>Outcome:</strong> {item.outcome || 'Progressing'}
                          </span>
                          <span>Physician: {item.doctorName || 'Attending'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit-trail' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-teal-600" />
                    <span>Real-Time Audit Trail & Access Logs</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tamper-evident logs of cross-hospital record access, additions, and blocked unauthorized edits
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const logs = await api.getAuditLogs();
                    setAuditLogs(logs);
                    showToast('info', 'Audit Logs Refreshed', 'Latest events synchronized.');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {auditLogs.filter((l) => l.targetPatientId === currentPatient.id).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No audit events recorded for this patient yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs
                    .filter((l) => l.targetPatientId === currentPatient.id)
                    .map((log) => {
                      const isDenied = log.status === 'DENIED';
                      return (
                        <div
                          key={log.id}
                          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            isDenied
                              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : 'bg-slate-50/70 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                {log.id}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDenied
                                    ? 'bg-rose-200 text-rose-900'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700">
                                {log.actorName} ({log.actorHospital})
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{log.details}</p>
                          </div>

                          <div className="shrink-0 text-right text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: APPEND NEW RECORD (Multi-Hospital Preservation) */}
      <Modal
        isOpen={showAppendModal}
        onClose={() => setShowAppendModal(false)}
        title={`Append Record under ${activeDoctor?.hospitalName || 'Your Hospital'}`}
      >
        <form onSubmit={handleAppendRecordSubmit} className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              Attribution & Data Integrity Guarantee
            </p>
            <p className="text-teal-800 text-[11px]">
              This new entry will be permanently stamped with{' '}
              <strong>{activeDoctor?.name}</strong> at{' '}
              <strong>{activeDoctor?.hospitalName}</strong>. Previous hospitals' records will remain
              untouched.
            </p>
          </div>

          {/* Record Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Record Type to Append
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'diagnosis', label: 'Diagnosis' },
                  { id: 'medication', label: 'Medication' },
                  { id: 'report', label: 'Report' },
                  { id: 'caseHistory', label: 'Encounter' },
                  { id: 'timeline', label: 'Milestone' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAppendType(t.id)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold text-center transition-colors cursor-pointer ${
                    appendType === t.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type-Specific Fields */}
          {appendType === 'diagnosis' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Condition / Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Bronchitis, Hypertensive Urgency"
                  value={appendCondition}
                  onChange={(e) => setAppendCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ICD-10 Code</label>
                  <input
                    type="text"
                    placeholder="e.g. J20.9, I10"
                    value={appendIcdCode}
                    onChange={(e) => setAppendIcdCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={appendSeverity}
                    onChange={(e) => setAppendSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Clinical evaluation and treatment directives..."
                  value={appendNotes}
                  onChange={(e) => setAppendNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {appendType === 'medication' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Drug Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin, Atorvastatin"
                  value={appendMedName}
                  onChange={(e) => setAppendMedName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 10mg"
                    value={appendMedDosage}
                    onChange={(e) => setAppendMedDosage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Twice daily with meals"
                    value={appendMedFreq}
                    onChange={(e) => setAppendMedFreq(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions / Warnings</label>
                <input
                  type="text"
                  placeholder="e.g. Complete full 7-day course"
                  value={appendMedInstructions}
                  onChange={(e) => setAppendMedInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {appendType === 'report' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contrast Chest CT Angiogram, Serum Chemistry Panel"
                  value={appendReportTitle}
                  onChange={(e) => setAppendReportTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={appendReportCategory}
                  onChange={(e: any) => setAppendReportCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                >
                  <option value="Lab">Laboratory Assay</option>
                  <option value="Radiology">Radiology / CT / MRI / X-Ray</option>
                  <option value="ECG">ECG / Cardiac Study</option>
                  <option value="Discharge">Discharge Summary</option>
                  <option value="Other">Other Diagnostic Study</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Summary / Impression</label>
                <textarea
                  rows={2}
                  placeholder="Summary of diagnostic impressions..."
                  value={appendReportSummary}
                  onChange={(e) => setAppendReportSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Key Findings (One per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="• Normal cardiac silhouette&#10;• No acute infiltrates"
                  value={appendReportFindings}
                  onChange={(e) => setAppendReportFindings(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {appendType === 'caseHistory' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Encounter Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Department Rapid Intake"
                  value={appendCaseTitle}
                  onChange={(e) => setAppendCaseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Encounter Details</label>
                <textarea
                  rows={3}
                  placeholder="Details of triage, assessment, and treatment provided..."
                  value={appendCaseDetails}
                  onChange={(e) => setAppendCaseDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {appendType === 'timeline' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology Consult & Echo Performed"
                  value={appendTimelineTitle}
                  onChange={(e) => setAppendTimelineTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Milestone Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. Preserved ejection fraction, cleared for discharge"
                  value={appendTimelineOutcome}
                  onChange={(e) => setAppendTimelineOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAppendModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAppend}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmittingAppend ? 'Appending Record...' : 'Confirm & Append to Central Chart'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: SECURITY & PERMISSION BLOCKED MODAL */}
      <Modal
        isOpen={securityBlockModal.open}
        onClose={() => setSecurityBlockModal({ open: false, title: '', message: '' })}
        title="Security Enforcement"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-base font-bold text-slate-900">{securityBlockModal.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {securityBlockModal.message}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1 text-xs">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Access Control Rule (Strictly Enforced)
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              • Global Dashboard is View-Only by default.
              <br />• Only the original author ({securityBlockModal.targetAuthor || 'origin doctor'})
              is authorized to modify this record.
              <br />• This security check and denial has been recorded to the Centralized Audit Log.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSecurityBlockModal({ open: false, title: '', message: '' })}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: MEDICAL REPORT PREVIEW */}
      <Modal
        isOpen={Boolean(previewReport)}
        onClose={() => setPreviewReport(null)}
        title={previewReport?.title || 'Diagnostic Report'}
      >
        {previewReport && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono font-bold text-teal-800">{previewReport.id}</span>
                <span>Date: {previewReport.reportDate || previewReport.date}</span>
              </div>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                {previewReport.hospitalName}
              </p>
              <p className="text-slate-600">Attending: {previewReport.doctorName}</p>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-800">Diagnostic Summary & Impression</h5>
              <div className="bg-white p-3 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
                {previewReport.summary || 'No detailed text available.'}
              </div>
            </div>

            {previewReport.keyFindings && previewReport.keyFindings.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-800">Key Findings</h5>
                <ul className="list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-slate-700">
                  {previewReport.keyFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
