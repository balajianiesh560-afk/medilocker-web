import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ShieldAlert,
  Clock,
  Pill,
  Trash2,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { DischargeSummaryRecord, User } from '../../types';
import { Modal } from '../Modal';

interface DischargeSummariesSectionProps {
  summaries: DischargeSummaryRecord[];
  currentUser?: User | null;
  patientId: string;
  patientName: string;
  onAddDischargeSummary: (newSummary: Partial<DischargeSummaryRecord>) => Promise<void>;
  onDeleteDischargeSummary?: (summaryId: string) => Promise<void>;
}

export const DischargeSummariesSection: React.FC<DischargeSummariesSectionProps> = ({
  summaries,
  currentUser,
  patientId,
  patientName,
  onAddDischargeSummary,
  onDeleteDischargeSummary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSummaryForPrint, setSelectedSummaryForPrint] = useState<DischargeSummaryRecord | null>(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    admissionDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    dischargeDate: new Date().toISOString().slice(0, 10),
    lengthOfStay: '3 Days (Acute Inpatient)',
    department: 'Trauma & Emergency Surgery',
    attendingPhysician: currentUser?.name || 'Dr. Evelyn Reed, MD (Chief of Trauma)',
    hospitalName: currentUser?.hospitalName || 'St. Jude Memorial Trauma Center',
    primaryDiagnosis: '',
    icdCode: 'S22.42XA',
    secondaryDiagnoses: '',
    clinicalSummary: '',
    proceduresPerformed: '',
    conditionAtDischarge: 'Stable' as DischargeSummaryRecord['conditionAtDischarge'],
    dietaryAdvice: 'Normal diet as tolerated. Adequate hydration.',
    activityRestrictions: 'Rest for 7 days. Avoid strenuous exertion or heavy lifting (>10 lbs).',
    followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    followUpInstructions: 'Follow-up with trauma clinic for suture inspection and symptom check.',
    emergencyWarningSigns: 'Sudden shortness of breath, severe chest pain, fever > 101°F, bleeding, dizziness.',
  });

  const filteredSummaries = summaries.filter((summary) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      summary.primaryDiagnosis.toLowerCase().includes(q) ||
      summary.clinicalSummary.toLowerCase().includes(q) ||
      summary.attendingPhysician.toLowerCase().includes(q) ||
      summary.hospitalName.toLowerCase().includes(q) ||
      (summary.icdCode && summary.icdCode.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryDiagnosis || !formData.clinicalSummary) return;

    setIsSubmitting(true);
    try {
      await onAddDischargeSummary({
        ...formData,
        patientId,
        secondaryDiagnoses: formData.secondaryDiagnoses
          ? formData.secondaryDiagnoses.split(',').map((s) => s.trim())
          : [],
        proceduresPerformed: formData.proceduresPerformed
          ? formData.proceduresPerformed.split(',').map((s) => s.trim())
          : [],
        emergencyWarningSigns: formData.emergencyWarningSigns
          ? formData.emergencyWarningSigns.split(',').map((s) => s.trim())
          : [],
      });

      setShowAddModal(false);
      setFormData({
        admissionDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
        dischargeDate: new Date().toISOString().slice(0, 10),
        lengthOfStay: '3 Days (Acute Inpatient)',
        department: 'Trauma & Emergency Surgery',
        attendingPhysician: currentUser?.name || 'Dr. Evelyn Reed, MD (Chief of Trauma)',
        hospitalName: currentUser?.hospitalName || 'St. Jude Memorial Trauma Center',
        primaryDiagnosis: '',
        icdCode: 'S22.42XA',
        secondaryDiagnoses: '',
        clinicalSummary: '',
        proceduresPerformed: '',
        conditionAtDischarge: 'Stable',
        dietaryAdvice: 'Normal diet as tolerated. Adequate hydration.',
        activityRestrictions: 'Rest for 7 days. Avoid strenuous exertion or heavy lifting (>10 lbs).',
        followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        followUpInstructions: 'Follow-up with trauma clinic for suture inspection and symptom check.',
        emergencyWarningSigns: 'Sudden shortness of breath, severe chest pain, fever > 101°F, bleeding, dizziness.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConditionBadge = (cond: DischargeSummaryRecord['conditionAtDischarge']) => {
    switch (cond) {
      case 'Stable':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Improved':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Guarded':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Transferred':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search discharge summaries by diagnosis, doctor, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <button
          id="btn-add-discharge-summary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Discharge Summary</span>
        </button>
      </div>

      {/* Discharge Summaries List */}
      {filteredSummaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Discharge Summaries Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No discharge records match "${searchQuery}".`
              : 'No formal inpatient or emergency discharge summaries logged for this patient yet.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold hover:bg-teal-100"
          >
            Create Discharge Summary
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((summary) => (
            <div
              key={summary.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-teal-500/40 shadow-xs transition-all p-5 space-y-4"
            >
              {/* Header: Diagnosis, Dates, Condition Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getConditionBadge(
                        summary.conditionAtDischarge
                      )}`}
                    >
                      Condition: {summary.conditionAtDischarge}
                    </span>
                    {summary.icdCode && (
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        ICD-10: {summary.icdCode}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">{summary.id}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {summary.primaryDiagnosis}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Department: <span className="font-semibold text-slate-700">{summary.department}</span> • Facility:{' '}
                    <span className="font-semibold text-teal-800">{summary.hospitalName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <button
                    onClick={() => setSelectedSummaryForPrint(summary)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                    title="View official discharge paper"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Summary</span>
                  </button>

                  {onDeleteDischargeSummary && (
                    <button
                      onClick={() => onDeleteDischargeSummary(summary.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                      title="Delete summary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Admission & Stay Timeline Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Admission Date:
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {summary.admissionDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Discharge Date:
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {summary.dischargeDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Length of Inpatient Stay:
                  </span>
                  <span className="font-bold text-teal-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    {summary.lengthOfStay}
                  </span>
                </div>
              </div>

              {/* Clinical Summary & Course of Treatment */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                  Clinical Course & Hospital Management:
                </span>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-line">
                  {summary.clinicalSummary}
                </p>
              </div>

              {/* Procedures Performed Badges */}
              {summary.proceduresPerformed && summary.proceduresPerformed.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Procedures & Interventions Performed:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.proceduresPerformed.map((proc, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 font-medium text-[11px]"
                      >
                        ✓ {proc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Discharge Medications if any */}
              {summary.dischargeMedications && summary.dischargeMedications.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Discharge Medication Regimen:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {summary.dischargeMedications.map((med, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{med.medicationName}</span>
                          <span className="text-teal-800 font-mono">{med.dosage}</span>
                        </div>
                        <p className="text-slate-600">
                          {med.frequency} • {med.duration}
                        </p>
                        {med.instructions && (
                          <p className="text-slate-500 italic text-[10px]">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up & Emergency Warning Signs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                {/* Follow up instructions */}
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-teal-950 text-xs">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span>Follow-Up Appointment: {summary.followUpDate || 'Within 7-10 Days'}</span>
                  </div>
                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    {summary.followUpInstructions || 'Contact attending department for wound care check.'}
                  </p>
                </div>

                {/* Emergency Red Flags */}
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Immediate Emergency Return Signs:</span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                    {Array.isArray(summary.emergencyWarningSigns)
                      ? summary.emergencyWarningSigns.join(' • ')
                      : summary.emergencyWarningSigns ||
                        'Sudden chest pain, high fever, dyspnea, or wound hemorrhage.'}
                  </p>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Attending: <strong className="text-slate-700">{summary.attendingPhysician}</strong>
                </span>
                <span>{summary.hospitalName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Discharge Summary Slip Modal */}
      {selectedSummaryForPrint && (
        <Modal
          isOpen={Boolean(selectedSummaryForPrint)}
          onClose={() => setSelectedSummaryForPrint(null)}
          title="Official Hospital Discharge Summary"
          subtitle={`Department of Inpatient Care • MediLocker Health Record`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm space-y-4 text-xs font-sans text-slate-900">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-950 uppercase tracking-tight">
                    {selectedSummaryForPrint.hospitalName}
                  </h3>
                  <p className="text-xs text-slate-600">{selectedSummaryForPrint.department}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    DISCHARGE DOCUMENT ID: {selectedSummaryForPrint.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold block">
                    ADMIT: {selectedSummaryForPrint.admissionDate}
                  </span>
                  <span className="text-xs font-mono font-bold block">
                    DISCHARGE: {selectedSummaryForPrint.dischargeDate}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Patient:</span>
                  <span className="font-bold text-slate-900">{patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Patient ID:</span>
                  <span className="font-mono font-bold text-slate-900">{patientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Discharge Status:</span>
                  <span className="font-bold text-emerald-800">
                    {selectedSummaryForPrint.conditionAtDischarge}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider mb-1">
                  Primary Diagnosis:
                </span>
                <p className="text-slate-900 font-semibold bg-slate-100 p-2 rounded">
                  {selectedSummaryForPrint.primaryDiagnosis}
                  {selectedSummaryForPrint.icdCode && ` (ICD-10: ${selectedSummaryForPrint.icdCode})`}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider mb-1">
                  Hospital Course & Summary:
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-line p-3 border border-slate-200 rounded">
                  {selectedSummaryForPrint.clinicalSummary}
                </p>
              </div>

              {selectedSummaryForPrint.dietaryAdvice && (
                <div>
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider mb-0.5">
                    Dietary & Lifestyle Advice:
                  </span>
                  <p className="text-slate-700">{selectedSummaryForPrint.dietaryAdvice}</p>
                </div>
              )}

              {selectedSummaryForPrint.activityRestrictions && (
                <div>
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider mb-0.5">
                    Activity Restrictions:
                  </span>
                  <p className="text-slate-700">{selectedSummaryForPrint.activityRestrictions}</p>
                </div>
              )}

              <div className="pt-4 flex items-end justify-between border-t border-slate-200">
                <div className="text-[11px] text-slate-500">
                  <p>Certified Electronic Health Record</p>
                  <p>MediLocker Federated Clinical Network</p>
                </div>
                <div className="text-right">
                  <div className="font-cursive text-base italic border-b border-slate-400 pb-1">
                    {selectedSummaryForPrint.attendingPhysician}
                  </div>
                  <span className="font-bold text-slate-900 block">
                    {selectedSummaryForPrint.attendingPhysician}
                  </span>
                  <span className="text-[10px] text-slate-500">Attending Physician</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setSelectedSummaryForPrint(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Discharge Summary Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Prepare Discharge Summary"
          subtitle={`Discharge documentation for ${patientName} (${patientId})`}
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discharge Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dischargeDate}
                  onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Length of Stay</label>
                <input
                  type="text"
                  placeholder="e.g. 4 Days (Inpatient)"
                  value={formData.lengthOfStay}
                  onChange={(e) => setFormData({ ...formData, lengthOfStay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Discharge Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Multiple Rib Fractures with Resolved Left Pneumothorax"
                  value={formData.primaryDiagnosis}
                  onChange={(e) => setFormData({ ...formData, primaryDiagnosis: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ICD-10 Code</label>
                <input
                  type="text"
                  placeholder="e.g. S22.42XA"
                  value={formData.icdCode}
                  onChange={(e) => setFormData({ ...formData, icdCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition at Discharge</label>
                <select
                  value={formData.conditionAtDischarge}
                  onChange={(e) => setFormData({ ...formData, conditionAtDischarge: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Stable">Stable</option>
                  <option value="Improved">Improved</option>
                  <option value="Guarded">Guarded</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Discharged AMA">Discharged Against Medical Advice</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Course & Hospital Management <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize admission reason, diagnostic findings, interventions, and progression..."
                  value={formData.clinicalSummary}
                  onChange={(e) => setFormData({ ...formData, clinicalSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procedures Performed (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Left Tube Thoracostomy, FAST Trauma Ultrasound, Wound Debridement"
                  value={formData.proceduresPerformed}
                  onChange={(e) => setFormData({ ...formData, proceduresPerformed: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Advice</label>
                <input
                  type="text"
                  value={formData.dietaryAdvice}
                  onChange={(e) => setFormData({ ...formData, dietaryAdvice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Restrictions</label>
                <input
                  type="text"
                  value={formData.activityRestrictions}
                  onChange={(e) => setFormData({ ...formData, activityRestrictions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Follow-up Instructions & Date
                </label>
                <input
                  type="text"
                  value={formData.followUpInstructions}
                  onChange={(e) => setFormData({ ...formData, followUpInstructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Return Warning Signs
                </label>
                <input
                  type="text"
                  value={formData.emergencyWarningSigns}
                  onChange={(e) => setFormData({ ...formData, emergencyWarningSigns: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Finalize Discharge Summary'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
