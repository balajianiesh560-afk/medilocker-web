import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Sparkles,
  Fingerprint,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Activity,
  HeartPulse,
  PlusCircle,
  Copy,
  Check,
  QrCode,
  Printer,
  Lock,
  ShieldAlert,
  Building2,
  Bell,
} from 'lucide-react';
import { Patient, AISummaryResult, CaseHistoryEntry, User } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { PatientQRCodeModal } from '../components/PatientQRCodeModal';
import { generateQRCodeDataURL, createPatientQRPayload } from '../utils/qrCode';

interface PatientProfileViewProps {
  patient: Patient;
  currentUser?: User | null;
  isGlobalView?: boolean;
  onBack: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
  onUpdatePatient: (updated: Patient) => void;
  onNotify?: (patientId: string) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  currentUser,
  isGlobalView = false,
  onBack,
  onEdit,
  onDelete,
  onUpdatePatient,
  onNotify,
}) => {
  const { showToast } = useToast();

  // Unauthorized Warning Modal State
  const [unauthorizedModal, setUnauthorizedModal] = useState<{
    open: boolean;
    action: string;
    authorName: string;
    hospitalName: string;
  }>({
    open: false,
    action: '',
    authorName: '',
    hospitalName: '',
  });

  // Check whether current user is the original creator
  const isOriginalCreator =
    !patient.registeredByDoctorId ||
    !currentUser ||
    currentUser.role === 'System Administrator' ||
    currentUser.id === patient.registeredByDoctorId;

  // QR Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  const [inlineQRUrl, setInlineQRUrl] = useState<string>('');

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<AISummaryResult | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Case History Modal
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDetails, setCaseDetails] = useState('');
  const [caseSeverity, setCaseSeverity] = useState<'Critical' | 'Severe' | 'Moderate' | 'Mild'>('Moderate');
  const [caseLocation, setCaseLocation] = useState('Emergency Department Bay 2');
  const [casePhysician, setCasePhysician] = useState('Emergency Duty Staff');
  const [isAddingCase, setIsAddingCase] = useState(false);

  // Copied state
  const [copiedRef, setCopiedRef] = useState(false);

  // Generate thumbnail QR for profile card
  useEffect(() => {
    let active = true;
    const payload = createPatientQRPayload(patient);
    generateQRCodeDataURL(payload, 180).then((url) => {
      if (active) setInlineQRUrl(url);
    }).catch(console.error);
    return () => {
      active = false;
    };
  }, [patient]);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(patient.fingerprintRefId);
    setCopiedRef(true);
    showToast('info', 'Copied to Clipboard', `Reference ID ${patient.fingerprintRefId} copied.`);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await api.generatePatientSummary(patient);
      setAiSummary(result);
      showToast(
        'success',
        'AI Summary Generated',
        result.isAiAvailable
          ? 'Gemini 3.8 Flash summarized recorded clinical data.'
          : 'Structured clinical summary generated from stored database.'
      );
    } catch (err: any) {
      showToast('error', 'AI Generation Failed', err?.message || 'Network error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deletePatient(patient.id);
      showToast('success', 'Patient Deleted', `Record ${patient.id} has been permanently removed.`);
      setShowDeleteModal(false);
      onDelete(patient.id);
    } catch (err: any) {
      showToast('error', 'Deletion Error', err?.message || 'Could not delete patient record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) return;

    setIsAddingCase(true);
    try {
      const newEntry = await api.addCaseHistory(patient.id, {
        incidentTitle: caseTitle.trim(),
        details: caseDetails.trim(),
        severity: caseSeverity,
        location: caseLocation.trim(),
        treatingPhysician: casePhysician.trim(),
      });

      const updatedPatient: Patient = {
        ...patient,
        caseHistory: [newEntry, ...(patient.caseHistory || [])],
        updatedAt: new Date().toISOString(),
      };

      onUpdatePatient(updatedPatient);
      showToast('success', 'Case Entry Logged', 'Incident record appended to patient history.');
      setShowAddCaseModal(false);
      setCaseTitle('');
      setCaseDetails('');
    } catch (err: any) {
      showToast('error', 'Failed to Add Case', err?.message || 'Error writing case entry');
    } finally {
      setIsAddingCase(false);
    }
  };

  const isIdentified = patient.status === 'Identified';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            id="profile-back-btn"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{patient.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isIdentified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {patient.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">{patient.fullName}</h2>
          </div>
        </div>

        {/* Action buttons: Edit, Delete, Generate AI Summary, QR */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="profile-qr-btn"
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-200 bg-sky-50/80 hover:bg-sky-100 text-sky-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-600" />
            <span>QR & Wristband</span>
          </button>

          {onNotify && (
            <button
              id="profile-notify-doctor-btn"
              onClick={() => onNotify(patient.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Send Emergency Treatment Update to Patient's Regular Doctor"
            >
              <Bell className="w-3.5 h-3.5 text-teal-200" />
              <span>Notify Doctor</span>
            </button>
          )}

          <button
            id="profile-ai-summary-btn"
            onClick={handleGenerateAISummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
            <span>{isGeneratingSummary ? 'Synthesizing Summary...' : 'Generate AI Summary'}</span>
          </button>

          <button
            id="profile-edit-btn"
            onClick={() => {
              if (isGlobalView) {
                setUnauthorizedModal({
                  open: true,
                  action: 'Edit Patient Profile',
                  authorName: patient.registeredByDoctor || 'Attending Physician',
                  hospitalName: patient.originHospital || "St. Jude Children's & General Hospital",
                });
                return;
              }
              if (!isOriginalCreator) {
                setUnauthorizedModal({
                  open: true,
                  action: 'Edit Patient Profile',
                  authorName: patient.registeredByDoctor || 'Attending Physician',
                  hospitalName: patient.originHospital || "St. Jude Children's & General Hospital",
                });
                return;
              }
              onEdit(patient);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
              !isOriginalCreator || isGlobalView
                ? 'border-slate-200 bg-slate-100/70 text-slate-500 hover:border-slate-300'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {(!isOriginalCreator || isGlobalView) ? (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Edit className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Edit</span>
          </button>

          <button
            id="profile-delete-btn"
            onClick={() => {
              if (isGlobalView || !isOriginalCreator) {
                setUnauthorizedModal({
                  open: true,
                  action: 'Delete Patient Profile',
                  authorName: patient.registeredByDoctor || 'Attending Physician',
                  hospitalName: patient.originHospital || "St. Jude Children's & General Hospital",
                });
                return;
              }
              setShowDeleteModal(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
              !isOriginalCreator || isGlobalView
                ? 'border-slate-200 bg-slate-100/70 text-slate-400 hover:border-slate-300'
                : 'border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            {(!isOriginalCreator || isGlobalView) ? (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* AI-Generated Patient Summary Display (Requirement #9) */}
      {aiSummary && (
        <div
          id="ai-summary-container"
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-slate-100 rounded-2xl p-6 shadow-xl border border-teal-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">AI-Generated Patient Summary</h3>
                <p className="text-xs text-slate-400">
                  Concise clinical overview synthesized from stored identification and emergency data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                Generated {new Date(aiSummary.generatedAt).toLocaleTimeString()}
              </span>
              <button
                id="close-summary-btn"
                onClick={() => setAiSummary(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Formatted Content */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3 font-sans text-slate-200">
            {(aiSummary?.summary || '').split('### ').map((section, idx) => {
              if (!section.trim()) return null;
              const lines = (section || '').split('\n');
              const heading = lines[0];
              const body = lines.slice(1).join('\n');

              return (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">{heading}</h4>
                  <div className="whitespace-pre-line text-xs text-slate-300">{body}</div>
                </div>
              );
            })}
          </div>

          {/* Mandatory Medical Disclaimer */}
          <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-200 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
            <div>
              <span className="font-bold">Clinical Advisory: </span>
              {aiSummary.disclaimer ||
                'AI summary is for organizing recorded information only and does not replace professional medical judgment. The AI must NOT diagnose diseases, prescribe medicines, or make treatment decisions.'}
            </div>
          </div>
        </div>
      )}

      {/* Main Clinical Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photo & Core Identifiers */}
        <div className="space-y-6">
          {/* Photo & Biometric Identification Reference */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative shadow-inner">
              <img src={patient.photo} alt={patient.fullName} className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-center text-xs font-semibold">
                Identification Reference Photo
              </div>
            </div>

            {/* Fingerprint Identification Reference ID */}
            <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-sky-600" />
                  Identification Reference
                </span>
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded font-mono">
                  NIST ITL
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-sky-200 flex-1 truncate">
                  {patient.fingerprintRefId}
                </span>
                <button
                  id="copy-fingerprint-btn"
                  onClick={handleCopyRef}
                  className="p-1.5 rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
                  title="Copy Reference ID"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Standardized template hash for cross-referencing against incoming trauma admissions.
              </p>
            </div>

            {/* Bedside QR Wristband Preview Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  Bedside QR Wristband
                </span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  SCANNABLE
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                {inlineQRUrl ? (
                  <img
                    src={inlineQRUrl}
                    alt="Patient QR"
                    className="w-16 h-16 object-contain rounded border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                    <QrCode className="w-6 h-6 animate-pulse" />
                  </div>
                )}
                <div className="text-[11px] text-slate-600 space-y-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">Hospital Wristband Tag</p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Encoded with Patient ID, NIST fingerprint reference, and critical blood/allergy profile.
                  </p>
                </div>
              </div>

              <button
                id="view-wristband-btn"
                type="button"
                onClick={() => setShowQRModal(true)}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View / Print Wristband</span>
              </button>
            </div>

            {/* Vitals quick badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Blood Group</span>
                <span className="font-bold text-slate-800 text-sm">{patient.bloodType || 'Pending Lab'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Age & Gender</span>
                <span className="font-bold text-slate-800 text-sm">
                  {patient.age} • {patient.gender}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Registration</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                </span>
                <span className="font-semibold text-slate-800 font-mono">{patient.phone || 'None'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Admitted:
                </span>
                <span className="font-medium text-slate-700">
                  {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Allergies:</span>
                <span className="font-semibold text-rose-700">{patient.allergies || 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Remarks, Emergency Notes, Case History (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distinctive Identification Remarks */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Identification Remarks & Physical Markers</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs leading-relaxed text-slate-800">
              {patient.identificationRemarks || 'No distinctive physical markings, scars, or jewelry recorded.'}
            </div>
          </div>

          {/* Emergency Clinical Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>Emergency Clinical Notes</span>
            </h3>
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-xs leading-relaxed text-slate-800 font-medium">
              {patient.emergencyNotes || 'No acute triage emergency notes on record.'}
            </div>
          </div>

          {/* Case History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Case History & Incident Log</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Recorded admissions, emergencies, and trauma events</p>
              </div>
              <button
                id="add-case-entry-btn"
                onClick={() => setShowAddCaseModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Incident</span>
              </button>
            </div>

            {/* Case List */}
            {(!patient.caseHistory || patient.caseHistory.length === 0) ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No previous case history logged for this patient record.
              </div>
            ) : (
              <div className="space-y-3">
                {patient.caseHistory.map((item) => {
                  const severityColors = {
                    Critical: 'bg-red-50 text-red-700 border-red-200',
                    Severe: 'bg-rose-50 text-rose-700 border-rose-200',
                    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
                    Mild: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  };

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.incidentTitle}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              severityColors[item.severity] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.severity}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        {item.location && <span>Unit: {item.location}</span>}
                        {item.treatingPhysician && <span>• Attending: {item.treatingPhysician}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Patient Record?"
        subtitle="This action permanently removes the stored patient record and biometric references."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              You are about to delete <span className="font-bold">{patient.fullName}</span> ({patient.id}). All
              incident records and identification markers will be purged.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              id="cancel-delete-modal-btn"
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-modal-btn"
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete Record'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Case History Entry Modal */}
      <Modal
        isOpen={showAddCaseModal}
        onClose={() => setShowAddCaseModal(false)}
        title="Add Case Incident Entry"
        subtitle={`Log emergency trauma admission or incident event for ${patient.fullName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleAddCaseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="case-title-input">
              Incident Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="case-title-input"
              type="text"
              required
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="e.g. Multi-Vehicle Collision Admission or Acute Respiratory Distress"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="case-severity-select">
                Triage Severity
              </label>
              <select
                id="case-severity-select"
                value={caseSeverity}
                onChange={(e) => setCaseSeverity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="Critical">Critical (Immediate Resuscitation)</option>
                <option value="Severe">Severe (Urgent Acute Care)</option>
                <option value="Moderate">Moderate (Delayed Observation)</option>
                <option value="Mild">Mild (Ambulatory Minor Procedure)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="case-location-input">
                Unit / Location
              </label>
              <input
                id="case-location-input"
                type="text"
                value={caseLocation}
                onChange={(e) => setCaseLocation(e.target.value)}
                placeholder="e.g. Bay 3 Trauma Suite"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="case-physician-input">
              Treating Physician / Staff
            </label>
            <input
              id="case-physician-input"
              type="text"
              value={casePhysician}
              onChange={(e) => setCasePhysician(e.target.value)}
              placeholder="e.g. Dr. Evelyn Reed, MD"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="case-details-textarea">
              Incident Clinical Details
            </label>
            <textarea
              id="case-details-textarea"
              rows={3}
              value={caseDetails}
              onChange={(e) => setCaseDetails(e.target.value)}
              placeholder="Observations on arrival, interventions performed, stabilization vitals."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="cancel-add-case-btn"
              type="button"
              onClick={() => setShowAddCaseModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-case-entry-btn"
              type="submit"
              disabled={isAddingCase}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isAddingCase ? 'Saving...' : 'Save Case Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Patient Identification QR & Wristband Modal */}
      <PatientQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        patient={patient}
      />

      {/* Record Creator Authorization Warning Modal */}
      <Modal
        isOpen={unauthorizedModal.open}
        onClose={() =>
          setUnauthorizedModal({ open: false, action: '', authorName: '', hospitalName: '' })
        }
        title="Creator-Only Authorization Enforced"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              Cannot {unauthorizedModal.action}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This patient profile was originally created by{' '}
              <strong className="text-slate-900">{unauthorizedModal.authorName}</strong> at{' '}
              <strong className="text-slate-900">{unauthorizedModal.hospitalName}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Multi-Hospital Data Security Policy
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              To preserve forensic clinical integrity across hospitals, existing records can only be
              edited or deleted by their original author. If you are examining this patient at another
              hospital, please use the Global Medical History exchange to view records or append new
              clinical findings under your facility.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() =>
                setUnauthorizedModal({ open: false, action: '', authorName: '', hospitalName: '' })
              }
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
