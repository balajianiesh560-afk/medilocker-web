import React, { useState, useMemo } from 'react';
import {
  Bell,
  Send,
  Inbox,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Plus,
  Trash2,
  UploadCloud,
  ShieldCheck,
  Eye,
  AlertTriangle,
  ChevronRight,
  Paperclip,
  Check,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  Patient,
  User as UserType,
  TreatmentNotification,
  NotificationStatus,
  PrescribedMedicine,
  TreatmentNotificationAttachment,
  ActiveView,
} from '../types';
import { AVAILABLE_DOCTORS } from '../data/sampleData';
import { api } from '../services/api';

interface NotifyViewProps {
  currentUser: UserType;
  patients: Patient[];
  notifications: TreatmentNotification[];
  onRefreshNotifications: () => Promise<void>;
  onRefreshPatients: () => Promise<void>;
  onNavigateToPatient?: (patientId: string) => void;
  onNavigate?: (view: ActiveView) => void;
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning') => void;
  initialPatientId?: string | null;
}

export const NotifyView: React.FC<NotifyViewProps> = ({
  currentUser,
  patients,
  notifications,
  onRefreshNotifications,
  onRefreshPatients,
  onNavigateToPatient,
  onNavigate,
  showToast,
  initialPatientId,
}) => {
  // Tabs: 'send' | 'received' | 'sent'
  const [activeTab, setActiveTab] = useState<'send' | 'received' | 'sent'>('received');

  // Status Filter for Received tab
  const [statusFilter, setStatusFilter] = useState<'All' | NotificationStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Notification for Treatment Review Modal
  const [selectedNotification, setSelectedNotification] = useState<TreatmentNotification | null>(
    null
  );
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // ================= Form State for "Send Notification" =================
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // Auto-fill selected patient
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // Recipient Doctor auto-detection
  const defaultRecipientDoctor = useMemo(() => {
    if (!selectedPatient) return null;
    // Attempt match by registeredByDoctorId or registeredByDoctor
    const matched = AVAILABLE_DOCTORS.find(
      (d) =>
        (selectedPatient.registeredByDoctorId && d.id === selectedPatient.registeredByDoctorId) ||
        (selectedPatient.registeredByDoctor &&
          d.name.toLowerCase() === selectedPatient.registeredByDoctor.toLowerCase()) ||
        (selectedPatient.originHospital && d.hospitalName === selectedPatient.originHospital)
    );
    return matched || AVAILABLE_DOCTORS[0];
  }, [selectedPatient]);

  const [customRecipientDoctorId, setCustomRecipientDoctorId] = useState<string>('');

  const activeRecipientDoctor = useMemo(() => {
    if (customRecipientDoctorId) {
      return (
        AVAILABLE_DOCTORS.find((d) => d.id === customRecipientDoctorId) || defaultRecipientDoctor
      );
    }
    return defaultRecipientDoctor;
  }, [customRecipientDoctorId, defaultRecipientDoctor]);

  // Clinical Form Fields
  const [treatmentDate, setTreatmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [clinicalFindings, setClinicalFindings] = useState<string>('');
  const [treatmentProvided, setTreatmentProvided] = useState<string>('');
  const [procedures, setProcedures] = useState<string>('');
  const [followUpInstructions, setFollowUpInstructions] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');

  // Prescribed Medicines list
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>([
    {
      id: 'med-1',
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    },
  ]);

  // Attachments
  const [attachments, setAttachments] = useState<TreatmentNotificationAttachment[]>([]);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Filtered lists
  const receivedNotifications = useMemo(() => {
    const docLower = currentUser.id.toLowerCase();
    const docNameLower = currentUser.name.toLowerCase();
    return notifications.filter(
      (n) =>
        n.recipientDoctorId.toLowerCase() === docLower ||
        n.recipientDoctorName.toLowerCase() === docNameLower ||
        // If current user is St. Jude admin or demo doctor, show matching
        n.recipientHospital.toLowerCase() === (currentUser.hospitalName || '').toLowerCase()
    );
  }, [notifications, currentUser]);

  const sentNotifications = useMemo(() => {
    const docLower = currentUser.id.toLowerCase();
    const docNameLower = currentUser.name.toLowerCase();
    return notifications.filter(
      (n) =>
        n.senderDoctorId.toLowerCase() === docLower ||
        n.senderDoctorName.toLowerCase() === docNameLower
    );
  }, [notifications, currentUser]);

  const pendingReceivedCount = useMemo(
    () => receivedNotifications.filter((n) => n.status === 'Pending Review').length,
    [receivedNotifications]
  );

  const filteredReceived = useMemo(() => {
    return receivedNotifications.filter((n) => {
      const matchesStatus = statusFilter === 'All' ? true : n.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        n.patientName.toLowerCase().includes(q) ||
        n.patientId.toLowerCase().includes(q) ||
        n.diagnosis.toLowerCase().includes(q) ||
        n.senderDoctorName.toLowerCase().includes(q) ||
        n.senderHospital.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [receivedNotifications, statusFilter, searchQuery]);

  const filteredSent = useMemo(() => {
    return sentNotifications.filter((n) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        n.patientName.toLowerCase().includes(q) ||
        n.patientId.toLowerCase().includes(q) ||
        n.diagnosis.toLowerCase().includes(q) ||
        n.recipientDoctorName.toLowerCase().includes(q) ||
        n.recipientHospital.toLowerCase().includes(q)
      );
    });
  }, [sentNotifications, searchQuery]);

  // Quick preset sample data filler for testing
  const handleLoadSampleEmergencyCase = () => {
    if (!selectedPatient && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
    setEmergencyReason('Severe Motor Vehicle Accident - Multi-Contusion & Acute Fracture Check');
    setDiagnosis('Acute Right Rib Contusion and Distal Radius Sprain');
    setClinicalFindings(
      'Patient brought to Emergency Room immobilized with cervical collar. Vital signs: BP 130/84, HR 92, SpO2 98% on room air. Point-of-care ultrasound negative for hemothorax. Focal tenderness over right 5th–6th ribs.'
    );
    setTreatmentProvided(
      'Analgesia loading, closed diagnostic radiographic imaging, short-arm fiberglass splinting, and respiratory spirometry training.'
    );
    setProcedures('Short-arm radial splint application, thoracic radiography, extremity neurological check');
    setMedicines([
      {
        id: `med-${Date.now()}-1`,
        name: 'Ketorolac Tromethamine',
        dosage: '10 mg',
        frequency: 'Every 6 hours as needed for severe pain',
        duration: '5 days',
        instructions: 'Take with food. Do not exceed recommended dosage.',
      },
      {
        id: `med-${Date.now()}-2`,
        name: 'Cyclobenzaprine',
        dosage: '5 mg',
        frequency: 'At bedtime',
        duration: '7 days',
        instructions: 'Muscle relaxant. May cause drowsiness.',
      },
    ]);
    setFollowUpInstructions(
      'Follow up with primary care physician Dr. Evelyn Reed within 48-72 hours. Repeat chest radiography if shortness of breath develops.'
    );
    setClinicalNotes(
      'Patient discharge authorized in stable condition. Family instructed to coordinate definitive orthopedic review.'
    );
    setAttachments([
      {
        id: `att-${Date.now()}`,
        fileName: 'Emergency_Trauma_Intake_Summary.pdf',
        fileType: 'Discharge Summary',
        fileSize: '2.1 MB',
        summary: 'Emergency trauma intake notes, splinting photos, and medication administration records.',
      },
    ]);
    showToast?.('Sample Case Loaded', 'Form pre-populated with realistic emergency encounter data.');
  };

  // Medicine dynamic handlers
  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleUpdateMedicine = (id: string, field: keyof PrescribedMedicine, value: string) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  // Attachment upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const newAtt: TreatmentNotificationAttachment = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fileName: file.name,
        fileType: 'Medical Report',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        summary: `Uploaded clinical file: ${file.name}`,
      };
      setAttachments((prev) => [...prev, newAtt]);
    });

    showToast?.('File Attached', 'Document successfully attached to emergency update.');
  };

  const handleAttachSampleDocument = () => {
    const sampleAtt: TreatmentNotificationAttachment = {
      id: `att-${Date.now()}`,
      fileName: 'Emergency_Physician_Clinical_Report.pdf',
      fileType: 'Discharge Summary',
      fileSize: '1.4 MB',
      summary: 'Certified emergency discharge summary with prescription details and vitals log.',
    };
    setAttachments((prev) => [...prev, sampleAtt]);
    showToast?.('Document Attached', 'Sample emergency clinical summary attached.');
  };

  // Submit Handler
  const handleSendNotificationSubmit = async () => {
    if (!selectedPatient) {
      showToast?.('Missing Patient', 'Please select a patient to notify.', 'error');
      return;
    }
    if (!emergencyReason.trim() || !treatmentProvided.trim() || !diagnosis.trim()) {
      showToast?.(
        'Missing Information',
        'Please enter Emergency Reason, Diagnosis, and Treatment Provided.',
        'error'
      );
      return;
    }

    const recipient = activeRecipientDoctor || AVAILABLE_DOCTORS[0];

    setIsSending(true);
    try {
      const validMedicines = medicines.filter((m) => m.name.trim() !== '');

      const payload: Partial<TreatmentNotification> = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        patientFingerprintRef: selectedPatient.fingerprintRefId,
        patientBloodType: selectedPatient.bloodType,

        senderDoctorId: currentUser.id,
        senderDoctorName: currentUser.name,
        senderHospital: currentUser.hospitalName || 'Emergency Center',
        senderRole: currentUser.role || 'Emergency Attending Physician',

        recipientDoctorId: recipient.id,
        recipientDoctorName: recipient.name,
        recipientHospital: recipient.hospitalName,

        treatmentDate,
        emergencyReason,
        diagnosis,
        clinicalFindings,
        treatmentProvided,
        procedures,
        medications: validMedicines,
        followUpInstructions,
        notes: clinicalNotes,
        attachments,
      };

      const result = await api.sendNotification(payload);

      if (result.success) {
        showToast?.(
          'Treatment Update Sent',
          `Emergency treatment information has been securely sent to Dr. ${recipient.name} (${recipient.hospitalName}).`
        );
        setShowConfirmSendModal(false);

        // Reset form
        setEmergencyReason('');
        setDiagnosis('');
        setClinicalFindings('');
        setTreatmentProvided('');
        setProcedures('');
        setFollowUpInstructions('');
        setClinicalNotes('');
        setMedicines([{ id: 'med-1', name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        setAttachments([]);

        await onRefreshNotifications();
        setActiveTab('sent');
      }
    } catch (err: any) {
      showToast?.('Send Failed', err?.message || 'Could not transmit emergency update.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Treatment Review Handlers
  const handleOpenReviewModal = async (notif: TreatmentNotification) => {
    setSelectedNotification(notif);

    // If pending, mark as viewed
    if (notif.status === 'Pending Review') {
      try {
        await api.viewNotification(notif.id, {
          id: currentUser.id,
          name: currentUser.name,
          badge: currentUser.badgeNumber,
          role: currentUser.role,
          hospital: currentUser.hospitalName,
        });
        await onRefreshNotifications();
      } catch (e) {
        console.warn('Failed to mark notification as viewed:', e);
      }
    }
  };

  const handleUpdatePatientRecord = async () => {
    if (!selectedNotification) return;

    setIsProcessingAction(true);
    try {
      const result = await api.updatePatientRecordFromNotification(selectedNotification.id, {
        id: currentUser.id,
        name: currentUser.name,
        badge: currentUser.badgeNumber,
        role: currentUser.role,
        hospital: currentUser.hospitalName,
      });

      if (result.success) {
        showToast?.(
          'Patient Record Updated',
          'Emergency treatment successfully appended to Case History, Diagnosis, Medications, Reports, and Timeline.'
        );
        await onRefreshPatients();
        await onRefreshNotifications();
        setSelectedNotification(null);
      }
    } catch (err: any) {
      showToast?.(
        'Update Failed',
        err?.message || 'Failed to update patient record from emergency notification',
        'error'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectNotification = async () => {
    if (!selectedNotification) return;

    setIsProcessingAction(true);
    try {
      const result = await api.rejectNotification(
        selectedNotification.id,
        rejectionReason || 'Details rejected by primary attending physician.',
        {
          id: currentUser.id,
          name: currentUser.name,
          badge: currentUser.badgeNumber,
          role: currentUser.role,
          hospital: currentUser.hospitalName,
        }
      );

      if (result.success) {
        showToast?.(
          'Notification Rejected',
          'Notification rejected and logged in security audit trail.',
          'warning'
        );
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedNotification(null);
        await onRefreshNotifications();
      }
    } catch (err: any) {
      showToast?.('Reject Failed', err?.message || 'Failed to reject notification', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-white">Notify</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Emergency Doctor-to-Doctor Network
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                  Secure cross-hospital clinical notification channel. Emergency physicians transmit
                  acute treatments, procedures, and prescriptions directly to the patient's Regular
                  Doctor for clinical review and permanent medical record integration.
                </p>
              </div>
            </div>
          </div>

          {/* Current Doctor Badge */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 shrink-0 min-w-[240px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-teal-400" />
                Active Clinician
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800">
                {currentUser.badgeNumber || 'STAFF'}
              </span>
            </div>
            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-teal-300/90 font-medium truncate">
              {currentUser.hospitalName}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-teal-800/40">
          <button
            id="tab-notifications-received"
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Notifications Received</span>
            {pendingReceivedCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce">
                {pendingReceivedCount}
              </span>
            )}
          </button>

          <button
            id="tab-send-notification"
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Emergency Treatment Update</span>
          </button>

          <button
            id="tab-sent-notifications"
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sent Updates ({sentNotifications.length})</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: NOTIFICATIONS RECEIVED ================= */}
      {activeTab === 'received' && (
        <div className="space-y-5">
          {/* Filter Bar & Search */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="search-received-notifications"
                  type="text"
                  placeholder="Search patient, doctor, diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Pending Review', 'Reviewed', 'Record Updated', 'Rejected'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                      {st === 'Pending Review' && pendingReceivedCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
                          {pendingReceivedCount}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {filteredReceived.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Notifications Received</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {statusFilter === 'All'
                  ? 'No emergency treatment updates have been sent to you yet. You can use the "Send Emergency Treatment Update" tab or switch doctors to test cross-hospital notifications.'
                  : `No notifications currently match the "${statusFilter}" filter.`}
              </p>
              <button
                onClick={() => setActiveTab('send')}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send a Test Notification</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReceived.map((notif) => {
                const isPending = notif.status === 'Pending Review';
                const isUpdated = notif.status === 'Record Updated';
                const isRejected = notif.status === 'Rejected';

                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-2xl border transition-all p-5 space-y-4 relative overflow-hidden ${
                      isPending
                        ? 'border-amber-300/80 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/20'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Status & Patient Tag */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {notif.patientId}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">• {notif.id}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                          {notif.patientName}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5 ${
                          isPending
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : isUpdated
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-sky-50 text-sky-700 border-sky-300'
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                        {isUpdated && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                        {notif.status}
                      </span>
                    </div>

                    {/* Sender Info & Diagnosis */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {notif.senderHospital}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {notif.treatmentDate}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Emergency Physician
                        </span>
                        <p className="font-bold text-slate-800">{notif.senderDoctorName}</p>
                      </div>

                      <div className="pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Emergency Diagnosis
                        </span>
                        <p className="font-semibold text-slate-900 leading-snug">{notif.diagnosis}</p>
                      </div>

                      {notif.medications && notif.medications.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-teal-700 pt-0.5">
                          <Pill className="w-3.5 h-3.5 shrink-0" />
                          <span>{notif.medications.length} Prescribed Medicine(s) Included</span>
                        </div>
                      )}

                      {notif.attachments && notif.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <Paperclip className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{notif.attachments.length} Attachment(s) Available</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-400">
                        Received {new Date(notif.createdAt).toLocaleDateString()}
                      </div>

                      <button
                        id={`btn-view-treatment-${notif.id}`}
                        onClick={() => handleOpenReviewModal(notif)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isPending
                            ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Treatment</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: SEND NOTIFICATION FORM ================= */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" />
                Emergency Treatment Update
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Transmit emergency procedures, prescriptions, and diagnosis to the patient's Regular
                Doctor.
              </p>
            </div>

            {/* Quick Sample Button */}
            <button
              id="btn-load-sample-case"
              onClick={handleLoadSampleEmergencyCase}
              className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Fill Sample Emergency Case</span>
            </button>
          </div>

          {/* Section A: Patient Selection & Auto-Fill */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" />
              1. Select Patient from MediLocker Database
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <select
                  id="select-patient-for-notification"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                >
                  <option value="">-- Choose Patient to Send Emergency Update --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) — Origin: {p.originHospital || 'General Hospital'} — Reg
                      Doc: {p.registeredByDoctor || 'Attending'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-2.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800">
                      ID Reference
                    </span>
                    <p className="font-mono font-bold text-teal-950">
                      {selectedPatient.fingerprintRefId || 'FP-VERIFIED'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-teal-800">
                      Blood / Allergies
                    </span>
                    <p className="font-semibold text-teal-950">
                      {selectedPatient.bloodType || 'Unknown'} •{' '}
                      {selectedPatient.allergies ? 'Allergies logged' : 'No allergies'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Patient Card Preview */}
            {selectedPatient && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {selectedPatient.photo ? (
                    <img
                      src={selectedPatient.photo}
                      alt={selectedPatient.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
                      {selectedPatient.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        {selectedPatient.fullName}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {selectedPatient.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Age: {selectedPatient.age} • Gender: {selectedPatient.gender} • Blood:{' '}
                      {selectedPatient.bloodType || 'N/A'} • Allergies:{' '}
                      <span className="text-rose-600 font-semibold">
                        {selectedPatient.allergies || 'None recorded'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Origin Hospital
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedPatient.originHospital || "St. Jude Children's & General Hospital"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Doctor Routing (Sender & Recipient) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender: Automatically Logged-In Emergency Doctor */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  Emergency Doctor (Sender)
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                  Auto-Verified
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-600">{currentUser.hospitalName}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Badge: {currentUser.badgeNumber || 'STAFF-EMG'} • Role: {currentUser.role}
                </p>
              </div>
            </div>

            {/* Recipient: Patient's Regular Doctor */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                  Recipient (Regular Doctor)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Detected from Registry
                </span>
              </div>
              {activeRecipientDoctor ? (
                <div>
                  <p className="text-sm font-bold text-teal-950">{activeRecipientDoctor.name}</p>
                  <p className="text-xs text-teal-800">{activeRecipientDoctor.hospitalName}</p>
                  <p className="text-[11px] text-teal-700 font-mono mt-0.5">
                    Badge: {activeRecipientDoctor.badgeNumber} • Unit:{' '}
                    {activeRecipientDoctor.hospitalUnit}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Select a patient to automatically resolve their Regular Doctor.
                </p>
              )}

              {/* Override / Switch Recipient Doctor */}
              <div className="pt-2 border-t border-teal-200/60">
                <label className="text-[10px] text-teal-800 font-medium block mb-1">
                  Route to different doctor (optional):
                </label>
                <select
                  id="select-custom-recipient-doctor"
                  value={customRecipientDoctorId}
                  onChange={(e) => setCustomRecipientDoctorId(e.target.value)}
                  className="w-full bg-white border border-teal-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="">Default: Use Patient's Primary Doctor</option>
                  {AVAILABLE_DOCTORS.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.hospitalName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section C: Treatment Details */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              2. Emergency Encounter & Treatment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Treatment Date *
                </label>
                <input
                  id="input-treatment-date"
                  type="date"
                  value={treatmentDate}
                  onChange={(e) => setTreatmentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Emergency Reason / Chief Complaint *
                </label>
                <input
                  id="input-emergency-reason"
                  type="text"
                  placeholder="e.g. Acute chest trauma, motor accident laceration, collapse..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Emergency Diagnosis *
              </label>
              <input
                id="input-emergency-diagnosis"
                type="text"
                placeholder="e.g. Right Tibiofibular Contusion, Acute Bronchospasm..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Symptoms & Clinical Findings
                </label>
                <textarea
                  id="input-clinical-findings"
                  rows={3}
                  placeholder="Vital signs, physical exam observations, pain scores, ecchymosis, auscultation findings..."
                  value={clinicalFindings}
                  onChange={(e) => setClinicalFindings(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Emergency Treatment Provided *
                </label>
                <textarea
                  id="input-treatment-provided"
                  rows={3}
                  placeholder="Acute interventions administered, splinting, wound closure, IV fluids, nebulizers..."
                  value={treatmentProvided}
                  onChange={(e) => setTreatmentProvided(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Procedures Performed
              </label>
              <input
                id="input-emergency-procedures"
                type="text"
                placeholder="e.g. Splinting, wound irrigation & primary suture, portable radiology..."
                value={procedures}
                onChange={(e) => setProcedures(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Section D: Prescribed Medications */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                3. Medicines Prescribed (Appended to Patient Locker)
              </h3>
              <button
                id="btn-add-medicine-row"
                type="button"
                onClick={handleAddMedicine}
                className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2">
              {medicines.map((med, idx) => (
                <div
                  key={med.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ketorolac, Amoxicillin"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(med.id, 'name', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Dosage
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10 mg"
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedicine(med.id, 'dosage', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Frequency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Oral every 6 hrs PRN"
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedicine(med.id, 'frequency', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Duration & Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days with meals"
                      value={med.instructions}
                      onChange={(e) => handleUpdateMedicine(med.id, 'instructions', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={medicines.length === 1 && idx === 0}
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Follow-Up & Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Follow-Up Instructions for Regular Doctor
                </label>
                <textarea
                  id="input-follow-up-instructions"
                  rows={2}
                  placeholder="e.g. Suture removal in 10 days, repeat pulmonary function testing, orthopedic referral..."
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Additional Clinical Notes
                </label>
                <textarea
                  id="input-clinical-notes"
                  rows={2}
                  placeholder="Special instructions, patient discharge disposition, family contacts informed..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Document Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Prescription / Clinical Documents
                </label>
                <button
                  type="button"
                  onClick={handleAttachSampleDocument}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                >
                  + Sample Document
                </button>
              </div>

              {/* Upload Drop Area */}
              <label className="border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors block">
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Click or drag files here</span>
                <span className="text-[10px] text-slate-400">
                  PDF, Discharge Summary, Lab Report, Radiology Note (Max 15MB)
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </label>

              {/* Uploaded List */}
              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between bg-teal-50/50 border border-teal-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {att.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          ({att.fileSize || '1 MB'})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              * By clicking send, an official emergency care update will be registered in the
              cross-hospital notification network and recorded in the audit trail.
            </p>

            <button
              id="btn-open-send-confirm-modal"
              type="button"
              onClick={() => {
                if (!selectedPatient) {
                  showToast?.('Select Patient', 'Please select a patient first.', 'error');
                  return;
                }
                if (!diagnosis.trim() || !treatmentProvided.trim()) {
                  showToast?.(
                    'Incomplete Information',
                    'Please fill in diagnosis and emergency treatment.',
                    'error'
                  );
                  return;
                }
                setShowConfirmSendModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send Treatment Update</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: SENT NOTIFICATIONS ================= */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Emergency Updates Transmitted by {currentUser.name}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {filteredSent.length} sent
            </span>
          </div>

          {filteredSent.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Sent Updates Yet</h3>
              <p className="text-xs text-slate-500">
                You haven't transmitted any emergency treatment notifications to other doctors yet.
              </p>
              <button
                onClick={() => setActiveTab('send')}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
              >
                Send Emergency Update
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSent.map((notif) => (
                <div
                  key={notif.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {notif.patientId}
                        </span>
                        <span className="text-xs text-slate-400">• {notif.id}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{notif.patientName}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                        notif.status === 'Record Updated'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : notif.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {notif.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 rounded-xl p-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Sent To Regular Doctor
                      </span>
                      <p className="font-semibold text-slate-800">{notif.recipientDoctorName}</p>
                      <p className="text-slate-500 text-[11px]">{notif.recipientHospital}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Diagnosis & Date
                      </span>
                      <p className="font-semibold text-slate-800">{notif.diagnosis}</p>
                      <p className="text-slate-500 text-[11px]">Treated: {notif.treatmentDate}</p>
                    </div>

                    <div className="flex flex-col justify-between items-start sm:items-end">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Sent Timestamp
                      </span>
                      <p className="text-slate-600 font-mono text-[11px]">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleOpenReviewModal(notif)}
                        className="mt-1 text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= CONFIRMATION MODAL BEFORE SENDING ================= */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-teal-900">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Send Emergency Treatment Update?
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm recipient doctor and emergency summary details before transmitting.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Patient:</span>
                <span className="font-bold text-slate-900">
                  {selectedPatient?.fullName} ({selectedPatient?.id})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Emergency Physician:</span>
                <span className="font-bold text-slate-900">
                  {currentUser.name} ({currentUser.hospitalName})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Receiving Regular Doctor:</span>
                <span className="font-bold text-teal-800">
                  {activeRecipientDoctor?.name} ({activeRecipientDoctor?.hospitalName})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Treatment Date:</span>
                <span className="font-bold text-slate-900">{treatmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Diagnosis:</span>
                <span className="font-bold text-slate-900 text-right">{diagnosis}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upon transmission, the receiving doctor will be notified. The receiving doctor will
              have exclusive authority to merge these emergency details into the patient's permanent
              medical locker.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSending}
                onClick={() => setShowConfirmSendModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-and-send"
                type="button"
                disabled={isSending}
                onClick={handleSendNotificationSubmit}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Send Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TREATMENT REVIEW SCREEN (MODAL) ================= */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0 font-black text-lg">
                  <Stethoscope className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Treatment Review Screen
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        selectedNotification.status === 'Record Updated'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : selectedNotification.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {selectedNotification.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Notification Reference: {selectedNotification.id} • Transmitted:{' '}
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Patient Summary */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Patient Medical Identity
                </span>
                <span className="text-xs font-mono font-bold text-teal-700">
                  {selectedNotification.patientId}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {selectedNotification.patientName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Age: {selectedNotification.patientAge || 'N/A'} • Gender:{' '}
                    {selectedNotification.patientGender || 'N/A'} • Blood Type:{' '}
                    {selectedNotification.patientBloodType || 'Verified'}
                  </p>
                </div>

                {onNavigateToPatient && (
                  <button
                    onClick={() => {
                      const pid = selectedNotification.patientId;
                      setSelectedNotification(null);
                      onNavigateToPatient(pid);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <span>Open Patient Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Section 2: Emergency Doctor Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-teal-50/50 border border-teal-200/80 rounded-2xl p-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Treating Emergency Doctor
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedNotification.senderDoctorName}
                </p>
                <p className="text-slate-600">{selectedNotification.senderHospital}</p>
                <p className="text-[11px] text-teal-700 font-mono mt-0.5">
                  Role: {selectedNotification.senderRole || 'Emergency Care Physician'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Designated Regular Doctor (Recipient)
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedNotification.recipientDoctorName}
                </p>
                <p className="text-slate-600">{selectedNotification.recipientHospital}</p>
              </div>
            </div>

            {/* Section 3: Emergency Treatment Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Emergency Encounter Data
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Chief Complaint / Emergency Reason
                  </span>
                  <p className="font-semibold text-slate-900">
                    {selectedNotification.emergencyReason}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Emergency Diagnosis
                  </span>
                  <p className="font-bold text-teal-900">{selectedNotification.diagnosis}</p>
                </div>
              </div>

              {selectedNotification.clinicalFindings && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Clinical Findings & Symptoms
                  </span>
                  <p className="text-slate-800 leading-relaxed">
                    {selectedNotification.clinicalFindings}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Treatment Provided
                </span>
                <p className="text-slate-900 font-semibold leading-relaxed">
                  {selectedNotification.treatmentProvided}
                </p>
              </div>

              {selectedNotification.procedures && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Procedures Performed
                  </span>
                  <p className="text-slate-800">{selectedNotification.procedures}</p>
                </div>
              )}

              {/* Prescribed Medications Table */}
              {selectedNotification.medications && selectedNotification.medications.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    Medicines Prescribed in Emergency
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase">
                        <tr>
                          <th className="p-2.5">Medication</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedNotification.medications.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                            <td className="p-2.5 font-mono text-slate-700">{m.dosage}</td>
                            <td className="p-2.5 text-slate-700">{m.frequency}</td>
                            <td className="p-2.5 text-slate-600 text-[11px]">
                              {m.instructions || m.duration || 'As directed'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedNotification.followUpInstructions && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Follow-Up Instructions from Emergency Physician
                  </span>
                  <p className="text-amber-950 font-medium">
                    {selectedNotification.followUpInstructions}
                  </p>
                </div>
              )}

              {/* Attachments Preview */}
              {selectedNotification.attachments &&
                selectedNotification.attachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                      Attached Clinical Documents ({selectedNotification.attachments.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedNotification.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-800 truncate">{att.fileName}</p>
                              <p className="text-[10px] text-slate-400">
                                {att.fileType} • {att.fileSize || 'Standard PDF'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              showToast?.(
                                'Viewing Document',
                                `Opening document preview: ${att.fileName}`
                              );
                            }}
                            className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg cursor-pointer"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Section 4: Three Treatment Review Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedNotification.status === 'Record Updated' ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Already Appended to Patient Medical Locker</span>
                  </div>
                ) : (
                  <>
                    {/* Action 3: Reject Button */}
                    <button
                      id="btn-reject-notification"
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => setShowRejectModal(true)}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    {/* Action 2: Review Later */}
                    <button
                      id="btn-review-later"
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => {
                        showToast?.(
                          'Review Postponed',
                          'Notification remains saved in your pending inbox.'
                        );
                        setSelectedNotification(null);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Review Later
                    </button>
                  </>
                )}
              </div>

              {selectedNotification.status !== 'Record Updated' && (
                /* Action 1: Update Patient Record (Primary Action) */
                <button
                  id="btn-update-patient-record"
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleUpdatePatientRecord}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingAction ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Appending to Medical Locker...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Patient Record</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Sub-Modal */}
      {showRejectModal && selectedNotification && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Reject Emergency Update</h4>
                <p className="text-xs text-slate-500">
                  Provide a clinical reason why this notification is being rejected.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Rejection Reason (Logged in Audit Trail)
              </label>
              <textarea
                id="textarea-rejection-reason"
                rows={3}
                placeholder="e.g. Patient not known to this facility, duplicate notification, or information discrepancy..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject"
                type="button"
                disabled={isProcessingAction}
                onClick={handleRejectNotification}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
