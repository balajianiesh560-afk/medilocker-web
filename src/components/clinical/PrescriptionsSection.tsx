import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  UserCheck,
  FileText,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { PrescriptionRecord, User } from '../../types';
import { Modal } from '../Modal';

interface PrescriptionsSectionProps {
  prescriptions: PrescriptionRecord[];
  currentUser?: User | null;
  patientId: string;
  patientName: string;
  onAddPrescription: (newRx: Partial<PrescriptionRecord>) => Promise<void>;
  onDeletePrescription?: (rxId: string) => Promise<void>;
}

export const PrescriptionsSection: React.FC<PrescriptionsSectionProps> = ({
  prescriptions,
  currentUser,
  patientId,
  patientName,
  onAddPrescription,
  onDeletePrescription,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Active' | 'Completed' | 'Discontinued'>('ALL');
  const [selectedRxForSlip, setSelectedRxForSlip] = useState<PrescriptionRecord | null>(null);

  // Add Prescription state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    medicationName: '',
    genericName: '',
    dosage: '',
    route: 'Oral' as PrescriptionRecord['route'],
    frequency: 'TID (Three times daily)',
    timing: 'After meals',
    duration: '7 Days',
    status: 'Active' as PrescriptionRecord['status'],
    dispensedStatus: 'Dispensed' as PrescriptionRecord['dispensedStatus'],
    instructions: '',
    refillsRemaining: 1,
    prescribingDoctor: currentUser?.name || 'Dr. Evelyn Reed, MD',
    doctorSpecialty: 'Emergency Medicine / Trauma',
    hospitalName: currentUser?.hospitalName || 'St. Jude Memorial Trauma Center',
  });

  const filteredRx = prescriptions.filter((rx) => {
    const matchesStatus = filterStatus === 'ALL' || rx.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rx.medicationName.toLowerCase().includes(q) ||
      (rx.genericName && rx.genericName.toLowerCase().includes(q)) ||
      rx.prescribingDoctor.toLowerCase().includes(q) ||
      rx.hospitalName.toLowerCase().includes(q) ||
      rx.instructions.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicationName || !formData.dosage) return;

    setIsSubmitting(true);
    try {
      await onAddPrescription({
        ...formData,
        patientId,
        prescribedDate: new Date().toISOString().slice(0, 10),
      });

      setShowAddModal(false);
      setFormData({
        medicationName: '',
        genericName: '',
        dosage: '',
        route: 'Oral',
        frequency: 'TID (Three times daily)',
        timing: 'After meals',
        duration: '7 Days',
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: '',
        refillsRemaining: 1,
        prescribingDoctor: currentUser?.name || 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Emergency Medicine / Trauma',
        hospitalName: currentUser?.hospitalName || 'St. Jude Memorial Trauma Center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PrescriptionRecord['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Discontinued':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDispensedBadge = (dispensed: PrescriptionRecord['dispensedStatus']) => {
    switch (dispensed) {
      case 'Dispensed':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Pending Pharmacy':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Partial':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prescriptions by drug name, doctor, instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'Active', 'Completed', 'Discontinued'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-add-prescription"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Prescription (Rx)</span>
        </button>
      </div>

      {/* Prescription Slips Grid */}
      {filteredRx.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Pill className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Prescriptions Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No prescriptions match "${searchQuery}".`
              : 'No medication prescriptions have been recorded for this patient yet.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold hover:bg-teal-100"
          >
            Issue New Prescription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRx.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-teal-500/40 hover:shadow-md transition-all p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Rx Symbol, Drug Name, Status Badges */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-serif font-black text-base flex items-center justify-center shrink-0">
                      ℞
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {rx.medicationName}
                      </h4>
                      {rx.genericName && (
                        <p className="text-[11px] text-slate-500 font-mono italic">
                          ({rx.genericName})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                        rx.status
                      )}`}
                    >
                      {rx.status}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getDispensedBadge(
                        rx.dispensedStatus
                      )}`}
                    >
                      {rx.dispensedStatus}
                    </span>
                  </div>
                </div>

                {/* Dosage & Administration Protocol */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Dosage:
                    </span>
                    <span className="font-bold text-slate-800">{rx.dosage}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Route:
                    </span>
                    <span className="font-semibold text-teal-800">{rx.route}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Frequency:
                    </span>
                    <span className="font-medium text-slate-700">{rx.frequency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Duration:
                    </span>
                    <span className="font-medium text-slate-700">{rx.duration}</span>
                  </div>
                </div>

                {/* Timing & Patient Instructions */}
                <div className="space-y-1 text-xs">
                  {rx.timing && (
                    <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">Timing: {rx.timing}</span>
                    </div>
                  )}
                  {rx.instructions && (
                    <p className="text-[11px] text-slate-600 bg-amber-50/50 p-2 rounded-md border border-amber-200/50 leading-relaxed">
                      <span className="font-semibold text-amber-900">Directions: </span>
                      {rx.instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer: Doctor Signature & Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="truncate max-w-[200px]" title={rx.prescribingDoctor}>
                  <span className="font-semibold text-slate-700 block truncate">
                    {rx.prescribingDoctor}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {rx.hospitalName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRxForSlip(rx)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                    title="View printable Rx Slip"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Rx Slip</span>
                  </button>

                  {onDeletePrescription && (
                    <button
                      onClick={() => onDeletePrescription(rx.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Prescription Slip Modal */}
      {selectedRxForSlip && (
        <Modal
          isOpen={Boolean(selectedRxForSlip)}
          onClose={() => setSelectedRxForSlip(null)}
          title="Clinical Prescription Order (Rx)"
          subtitle={`Official Medical Order Slip • MediLocker Healthcare Network`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Printable Paper Slip View */}
            <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm space-y-4 font-sans text-slate-900">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-950 uppercase tracking-tight">
                    {selectedRxForSlip.hospitalName}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">Department of Emergency & Inpatient Care</p>
                  <p className="text-[11px] text-slate-500 font-mono">RX ORDER ID: {selectedRxForSlip.id}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-800 block">
                    DATE: {selectedRxForSlip.prescribedDate}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                    {selectedRxForSlip.status}
                  </span>
                </div>
              </div>

              {/* Patient Demographics Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Patient Name:</span>
                  <span className="font-bold text-slate-900">{patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Patient ID:</span>
                  <span className="font-mono font-bold text-slate-900">{patientId}</span>
                </div>
              </div>

              {/* The Rx Symbol and Medication Order */}
              <div className="pt-2 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-black text-2xl text-teal-800">℞</span>
                  <div>
                    <span className="font-bold text-base text-slate-900">
                      {selectedRxForSlip.medicationName}
                    </span>
                    {selectedRxForSlip.genericName && (
                      <span className="text-xs text-slate-500 font-mono italic ml-2">
                        [{selectedRxForSlip.genericName}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-6 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-2 bg-slate-100/70 p-2.5 rounded-lg font-medium text-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Dosage:</span>
                      {selectedRxForSlip.dosage}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Frequency:</span>
                      {selectedRxForSlip.frequency}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Duration:</span>
                      {selectedRxForSlip.duration}
                    </div>
                  </div>

                  <div className="text-slate-700">
                    <span className="font-semibold">Route: </span>
                    {selectedRxForSlip.route} • <span className="font-semibold">Timing: </span>
                    {selectedRxForSlip.timing || 'As directed'}
                  </div>

                  {selectedRxForSlip.instructions && (
                    <div className="text-slate-700 bg-amber-50/70 border border-amber-200 p-2 rounded">
                      <span className="font-semibold text-amber-900">Patient Advice: </span>
                      {selectedRxForSlip.instructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Stamp & Signature Line */}
              <div className="pt-6 flex items-end justify-between border-t border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 block">DISPENSE VERIFICATION</span>
                  <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pharmacy: {selectedRxForSlip.dispensedStatus}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-cursive text-base text-slate-700 italic border-b border-slate-400 pb-1">
                    {selectedRxForSlip.prescribingDoctor}
                  </div>
                  <span className="font-bold text-slate-900 block">{selectedRxForSlip.prescribingDoctor}</span>
                  <span className="text-[10px] text-slate-500 block">{selectedRxForSlip.doctorSpecialty}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Rx</span>
              </button>
              <button
                onClick={() => setSelectedRxForSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Prescription Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Issue New Prescription (℞)"
          subtitle={`Prescribe medications for ${patientName} (${patientId})`}
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin 625mg or Paracetamol"
                  value={formData.medicationName}
                  onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin + Clavulanic Acid"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dosage & Strength <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500mg, 10ml, 1 puff"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Route</label>
                <select
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Oral">Oral (PO)</option>
                  <option value="IV">Intravenous (IV)</option>
                  <option value="IM">Intramuscular (IM)</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Sublingual">Sublingual</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                <input
                  type="text"
                  placeholder="e.g. BID (Twice daily), TID, Once at bedtime"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 5 Days, 10 Days, Chronic"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meal Timing</label>
                <input
                  type="text"
                  placeholder="e.g. After meals with water, Empty stomach"
                  value={formData.timing}
                  onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacy Dispense Status</label>
                <select
                  value={formData.dispensedStatus}
                  onChange={(e) => setFormData({ ...formData, dispensedStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Dispensed">Dispensed to Patient</option>
                  <option value="Pending Pharmacy">Pending Pharmacy Verification</option>
                  <option value="Partial">Partially Dispensed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Clinical / Patient Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete full course; avoid driving; monitor for rash..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
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
                {isSubmitting ? 'Issuing Rx...' : 'Sign & Issue Prescription'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
