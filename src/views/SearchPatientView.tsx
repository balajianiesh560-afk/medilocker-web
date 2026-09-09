import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Fingerprint,
  UserCheck,
  UserX,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  QrCode,
} from 'lucide-react';
import { Patient, PatientStatus } from '../types';
import { QRScannerModal } from '../components/QRScannerModal';
import { PatientQRCodeModal } from '../components/PatientQRCodeModal';

interface SearchPatientViewProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onRegisterNew: () => void;
}

export const SearchPatientView: React.FC<SearchPatientViewProps> = ({
  patients,
  onSelectPatient,
  onRegisterNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedQRModalPatient, setSelectedQRModalPatient] = useState<Patient | null>(null);

  // Multi-field search algorithm (Patient ID, Name, Fingerprint Ref ID)
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesStatus = statusFilter === 'All' || patient.status === statusFilter;
      if (!matchesStatus) return false;

      if (!q) return true;

      const idMatch = patient.id.toLowerCase().includes(q);
      const nameMatch = patient.fullName.toLowerCase().includes(q);
      const fpMatch = patient.fingerprintRefId.toLowerCase().includes(q);
      const remarksMatch = patient.identificationRemarks.toLowerCase().includes(q);

      return idMatch || nameMatch || fpMatch || remarksMatch;
    });
  }, [patients, searchQuery, statusFilter]);

  const quickSamples = ['FP-8842', 'PID-1042', 'Unidentified', 'Walker', 'Doe'];

  return (
    <div className="space-y-6">
      {/* Search Header & Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Patient Search & Cross-Reference</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Locate patient records by Patient ID, Name, Physical Remarks, Biometric Fingerprint Ref, or Scanned QR.
            </p>
          </div>

          <button
            id="search-scan-qr-btn"
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span>Scan Patient QR Code</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="patient-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient ID (e.g. PID-1042), Name, or Fingerprint Ref ID (e.g. FP-8842-A1)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
            />
            {searchQuery && (
              <button
                id="patient-search-clear-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              id="filter-all-btn"
              type="button"
              onClick={() => setStatusFilter('All')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({patients.length})
            </button>
            <button
              id="filter-identified-btn"
              type="button"
              onClick={() => setStatusFilter('Identified')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'Identified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Identified ({patients.filter((p) => p.status === 'Identified').length})
            </button>
            <button
              id="filter-unidentified-btn"
              type="button"
              onClick={() => setStatusFilter('Unidentified')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'Unidentified'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Unidentified ({patients.filter((p) => p.status === 'Unidentified').length})
            </button>
          </div>
        </div>

        {/* Quick query sample chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick search:</span>
          {quickSamples.map((sample) => (
            <button
              key={sample}
              id={`quick-search-${sample}`}
              type="button"
              onClick={() => setSearchQuery(sample)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Count */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          Showing <span className="text-slate-900 font-bold">{filteredPatients.length}</span> matching patient record
          {filteredPatients.length === 1 ? '' : 's'}
        </span>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">No Matching Patient Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any patient matching "{searchQuery}". Try a different name, Patient ID, or reference ID.
            </p>
          </div>
          <div className="pt-2">
            <button
              id="search-empty-register-btn"
              onClick={onRegisterNew}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Register New Patient
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPatients.map((patient) => {
            const isIdentified = patient.status === 'Identified';

            return (
              <div
                key={patient.id}
                id={`patient-card-${patient.id}`}
                onClick={() => onSelectPatient(patient)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Avatar, Name, Status Badge */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                      <img
                        src={patient.photo}
                        alt={patient.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
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
                      <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5 group-hover:text-sky-700 transition-colors">
                        {patient.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {patient.age} yrs • {patient.gender} • Blood: {patient.bloodType || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Reference & Remarks Data */}
                  <div className="py-3.5 space-y-2.5 text-xs">
                    {/* Fingerprint Reference */}
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-sky-600" />
                        <span>Identification Reference:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                        {patient.fingerprintRefId}
                      </span>
                    </div>

                    {/* Remarks snippet */}
                    {patient.identificationRemarks && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Distinctive Remarks
                        </span>
                        <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                          {patient.identificationRemarks}
                        </p>
                      </div>
                    )}

                    {/* Emergency notes snippet */}
                    {patient.emergencyNotes && (
                      <div>
                        <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block mb-0.5">
                          Emergency Notes
                        </span>
                        <p className="text-slate-700 line-clamp-2 text-xs leading-relaxed font-medium">
                          {patient.emergencyNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      id={`card-qr-btn-${patient.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQRModalPatient(patient);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-semibold transition-colors"
                      title="View QR Wristband"
                    >
                      <QrCode className="w-3 h-3 text-sky-600" />
                      <span>QR Tag</span>
                    </button>
                    <span className="text-slate-400 text-[11px]">
                      {patient.caseHistory?.length || 0} incident{(patient.caseHistory?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>

                  <span className="font-bold text-sky-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        patients={patients}
        onSelectPatient={onSelectPatient}
      />

      {/* Patient QR Code / Wristband Modal */}
      <PatientQRCodeModal
        isOpen={Boolean(selectedQRModalPatient)}
        onClose={() => setSelectedQRModalPatient(null)}
        patient={selectedQRModalPatient}
      />
    </div>
  );
};
