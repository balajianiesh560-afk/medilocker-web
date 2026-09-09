import React, { useState } from 'react';
import {
  AlertOctagon,
  Eye,
  Edit,
  Clock,
  MapPin,
  Fingerprint,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { EmergencyCase, EmergencyStatus, Patient } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

interface EmergencyCasesListViewProps {
  emergencyCases: EmergencyCase[];
  onNewEmergencyCase: () => void;
  onUpdateCase: (updated: EmergencyCase) => void;
  onDeleteCase: (caseId: string) => void;
  onPromoteToPatient?: (emergencyCase: EmergencyCase) => void;
  selectedCaseForView?: EmergencyCase | null;
  onClearSelectedCase?: () => void;
}

export const EmergencyCasesListView: React.FC<EmergencyCasesListViewProps> = ({
  emergencyCases,
  onNewEmergencyCase,
  onUpdateCase,
  onDeleteCase,
  onPromoteToPatient,
  selectedCaseForView,
  onClearSelectedCase,
}) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EmergencyStatus>('All');

  // Active modal for viewing/editing
  const [activeModalCase, setActiveModalCase] = useState<EmergencyCase | null>(selectedCaseForView || null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form states
  const [editStatus, setEditStatus] = useState<EmergencyStatus>('Unidentified');
  const [editRemarks, setEditRemarks] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editFingerprint, setEditFingerprint] = useState('');

  const openCaseDetails = (ec: EmergencyCase, edit: boolean = false) => {
    setActiveModalCase(ec);
    setIsEditMode(edit);
    setEditStatus(ec.identificationStatus);
    setEditRemarks(ec.identificationRemarks);
    setEditNotes(ec.emergencyNotes);
    setEditLocation(ec.locationFound || '');
    setEditFingerprint(ec.fingerprintRefId);
  };

  const closeModal = () => {
    setActiveModalCase(null);
    setIsEditMode(false);
    if (onClearSelectedCase) onClearSelectedCase();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalCase) return;

    setIsUpdating(true);
    try {
      const updated = await api.updateEmergencyCase(activeModalCase.id, {
        identificationStatus: editStatus,
        identificationRemarks: editRemarks.trim(),
        emergencyNotes: editNotes.trim(),
        locationFound: editLocation.trim(),
        fingerprintRefId: editFingerprint.trim(),
      });

      onUpdateCase(updated);
      setActiveModalCase(updated);
      setIsEditMode(false);
      showToast('success', 'Emergency Case Updated', `Case ${updated.temporaryId} has been successfully updated.`);
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'Error updating case');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emergency case record?')) return;
    try {
      await api.deleteEmergencyCase(id);
      onDeleteCase(id);
      closeModal();
      showToast('success', 'Emergency Case Deleted', `Case ${id} removed from triage registry.`);
    } catch (err: any) {
      showToast('error', 'Deletion Error', err?.message || 'Error deleting case');
    }
  };

  const filteredCases = emergencyCases.filter((ec) => {
    const matchesStatus = statusFilter === 'All' || ec.identificationStatus === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ec.temporaryId.toLowerCase().includes(q) ||
      ec.identificationRemarks.toLowerCase().includes(q) ||
      ec.emergencyNotes.toLowerCase().includes(q) ||
      ec.fingerprintRefId.toLowerCase().includes(q) ||
      (ec.locationFound && ec.locationFound.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>Emergency Cases Registry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active trauma intakes, unidentified admissions, and physical identification remarks.
            </p>
          </div>

          <button
            id="new-emergency-case-btn"
            onClick={onNewEmergencyCase}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Emergency Case</span>
          </button>
        </div>

        {/* Search & Filter row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="emergency-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Temporary ID (e.g. EMG-7701), remarks, or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({emergencyCases.length})
            </button>
            <button
              onClick={() => setStatusFilter('Unidentified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'Unidentified'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Unidentified ({emergencyCases.filter((c) => c.identificationStatus === 'Unidentified').length})
            </button>
            <button
              onClick={() => setStatusFilter('In Progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'In Progress'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              In Progress ({emergencyCases.filter((c) => c.identificationStatus === 'In Progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('Identified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'Identified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Identified ({emergencyCases.filter((c) => c.identificationStatus === 'Identified').length})
            </button>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <AlertOctagon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Emergency Cases Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No emergency cases match the current filter or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCases.map((ec) => {
            const statusColors = {
              Identified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              Unidentified: 'bg-rose-50 text-rose-700 border-rose-200',
              'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
            };

            return (
              <div
                key={ec.id}
                id={`emergency-case-card-${ec.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Temporary ID & Status & Photo */}
                  <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                      {ec.photo ? (
                        <img src={ec.photo} alt={ec.temporaryId} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono font-bold text-slate-400 text-xs">
                          EMG
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-sm font-extrabold text-slate-900">{ec.temporaryId}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            statusColors[ec.identificationStatus] || 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {ec.identificationStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{ec.dateTime}</span>
                      </div>
                      {ec.locationFound && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{ec.locationFound}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identification Reference & Remarks */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Fingerprint className="w-3.5 h-3.5 text-sky-600" />
                        Identification Reference:
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {ec.fingerprintRefId}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Identification Remarks
                      </span>
                      <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                        {ec.identificationRemarks || 'No physical markers noted on arrival.'}
                      </p>
                    </div>

                    {ec.emergencyNotes && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-0.5">
                          Triage & Clinical Notes
                        </span>
                        <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed font-medium">
                          {ec.emergencyNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Age: {ec.estimatedAge} • {ec.gender}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`edit-emg-btn-${ec.id}`}
                      onClick={() => openCaseDetails(ec, true)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Edit Case"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      id={`view-emg-btn-${ec.id}`}
                      onClick={() => openCaseDetails(ec, false)}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Case Details & Edit Modal */}
      {activeModalCase && (
        <Modal
          isOpen={Boolean(activeModalCase)}
          onClose={closeModal}
          title={isEditMode ? `Edit Emergency Case: ${activeModalCase.temporaryId}` : `Emergency Case: ${activeModalCase.temporaryId}`}
          subtitle={`Recorded on ${activeModalCase.dateTime}`}
          maxWidth="lg"
        >
          {isEditMode ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identification Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as EmergencyStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="Unidentified">Unidentified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Identified">Identified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identification Reference ID
                  </label>
                  <input
                    type="text"
                    value={editFingerprint}
                    onChange={(e) => setEditFingerprint(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Found / Incident Site
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identification Remarks
                </label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Triage & Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteCase(activeModalCase.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Case
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Photo & Main Status */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                  <img src={activeModalCase.photo} alt={activeModalCase.temporaryId} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">{activeModalCase.temporaryId}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {activeModalCase.identificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Estimated Age: {activeModalCase.estimatedAge} • Gender: {activeModalCase.gender}
                  </p>
                </div>
              </div>

              {/* Identification Reference */}
              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-sky-600" />
                  Identification Reference
                </span>
                <p className="font-mono text-xs font-bold text-slate-800">{activeModalCase.fingerprintRefId}</p>
              </div>

              {/* Remarks */}
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">Identification Remarks:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {activeModalCase.identificationRemarks || 'None recorded'}
                </p>
              </div>

              {/* Notes */}
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">Emergency Notes:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                  {activeModalCase.emergencyNotes || 'None recorded'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Case Details
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
