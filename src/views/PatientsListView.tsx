import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Fingerprint,
  Phone,
  ChevronRight,
  Filter,
  Trash2,
  Edit,
  Eye,
  Activity,
  CheckCircle2,
  QrCode,
  ArrowUpDown,
} from 'lucide-react';
import { Patient, PatientStatus, User } from '../types';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { PatientQRCodeModal } from '../components/PatientQRCodeModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { AgeFilterControls } from '../components/AgeFilterControls';
import {
  parseAgeRange,
  getPatientAgeRange,
  isPatientInAgeRange,
} from './GlobalDashboardView';

interface PatientsListViewProps {
  patients: Patient[];
  currentUser?: User | null;
  onSelectPatient: (patient: Patient) => void;
  onRegisterNew: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
}

export const PatientsListView: React.FC<PatientsListViewProps> = ({
  patients,
  currentUser,
  onSelectPatient,
  onRegisterNew,
  onEditPatient,
  onDeletePatient,
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [ageQuery, setAgeQuery] = useState('');
  const [ageSort, setAgeSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');
  const [genderFilter, setGenderFilter] = useState<'All' | string>('All');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedQRModalPatient, setSelectedQRModalPatient] = useState<Patient | null>(null);

  const filteredPatients = patients
    .filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
      if (!matchesStatus || !matchesGender) return false;

      if (ageQuery.trim()) {
        const inAge = isPatientInAgeRange(p.age, ageQuery);
        if (!inAge) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.fingerprintRefId.toLowerCase().includes(q) ||
        p.identificationRemarks.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (ageSort === 'asc') {
        return getPatientAgeRange(a.age).primary - getPatientAgeRange(b.age).primary;
      }
      if (ageSort === 'desc') {
        return getPatientAgeRange(b.age).primary - getPatientAgeRange(a.age).primary;
      }
      if (ageQuery.trim()) {
        return getPatientAgeRange(a.age).primary - getPatientAgeRange(b.age).primary;
      }
      return 0;
    });

  const handleDelete = async (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete patient record ${patient.fullName} (${patient.id})?`)) return;

    try {
      await api.deletePatient(patient.id, { user: currentUser || undefined });
      onDeletePatient(patient.id);
      showToast('success', 'Patient Deleted', `Record ${patient.id} removed.`);
    } catch (err: any) {
      showToast('error', 'Authorization Denied', err?.message || 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>Hospital Patient Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive registry of verified admissions, biometric markers, and acute trauma records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              id="directory-scan-qr-btn"
              onClick={() => setShowScannerModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-teal-400" />
              <span>Scan Patient QR</span>
            </button>

            <button
              id="directory-register-btn"
              onClick={onRegisterNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 pt-2">
          {/* Reduced Search Box */}
          <div className="relative w-full lg:w-72 xl:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="directory-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Name, Phone, Biometric..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Age Filter & Sort Column near Search Box */}
          <AgeFilterControls
            ageQuery={ageQuery}
            onAgeChange={setAgeQuery}
            ageSort={ageSort}
            onToggleSort={() =>
              setAgeSort((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc'))
            }
            theme="sky"
            idPrefix="directory-age"
          />

          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Identified">Identified Only</option>
              <option value="Unidentified">Unidentified Only</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Active Age Filter Pill */}
        {ageQuery && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <span className="font-bold">Active Age Filter:</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-700 text-white font-mono font-bold text-[11px]">
                {ageQuery}
              </span>
              <span>— {filteredPatients.length} patient record{filteredPatients.length === 1 ? '' : 's'} found</span>
            </div>
            <button
              onClick={() => {
                setAgeQuery('');
                setAgeSort('none');
              }}
              className="text-xs font-bold text-sky-700 hover:text-sky-950 underline cursor-pointer"
            >
              Clear Age Filter
            </button>
          </div>
        )}
      </div>

      {/* Patient Directory List / Table */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patient Records Match</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Patient ID & Name</th>
                  <th className="py-3.5 px-4">Identification Reference</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Age / Gender</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const isIdentified = patient.status === 'Identified';

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => onSelectPatient(patient)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Photo & Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img src={patient.photo} alt={patient.fullName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                              {patient.fullName}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400">{patient.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Fingerprint Ref */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-1 rounded-md max-w-fit">
                          <Fingerprint className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{patient.fingerprintRefId}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isIdentified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {patient.status}
                        </span>
                      </td>

                      {/* Age / Gender */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded-md text-[11px] transition-colors ${
                            ageQuery && isPatientInAgeRange(patient.age, ageQuery)
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {patient.age} yrs
                        </span>
                        <span className="mx-1 text-slate-400">•</span>
                        <span>{patient.gender}</span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {patient.phone || '—'}
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 text-[11px]">
                        {patient.identificationRemarks || 'No distinctive remarks'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`table-qr-btn-${patient.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQRModalPatient(patient);
                            }}
                            className="p-1.5 rounded-lg border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-700 transition-colors"
                            title="View / Print QR Wristband"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPatient(patient);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                            title="Edit Patient"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, patient)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPatient(patient);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Profile</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        patients={patients}
        onSelectPatient={onSelectPatient}
      />

      {/* Patient QR Code & Wristband Modal */}
      <PatientQRCodeModal
        isOpen={Boolean(selectedQRModalPatient)}
        onClose={() => setSelectedQRModalPatient(null)}
        patient={selectedQRModalPatient}
      />
    </div>
  );
};
