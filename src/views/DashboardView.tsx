import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  AlertOctagon,
  UserPlus,
  Search,
  Bot,
  ArrowRight,
  Clock,
  Eye,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Patient, EmergencyCase, ActiveView } from '../types';

interface DashboardViewProps {
  patients: Patient[];
  emergencyCases: EmergencyCase[];
  onNavigate: (view: ActiveView) => void;
  onSelectPatient: (patient: Patient) => void;
  onSelectEmergencyCase: (emergencyCase: EmergencyCase) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  emergencyCases,
  onNavigate,
  onSelectPatient,
  onSelectEmergencyCase,
}) => {
  const totalPatients = patients.length;
  const identifiedPatients = patients.filter((p) => p.status === 'Identified').length;
  const unidentifiedPatients = patients.filter((p) => p.status === 'Unidentified').length;
  const totalEmergencyCases = emergencyCases.length;
  const unidentifiedEmergencyCases = emergencyCases.filter(
    (c) => c.identificationStatus === 'Unidentified'
  ).length;

  const recentEmergencyCases = [...emergencyCases].slice(0, 5);
  const recentPatients = [...patients].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Trauma Alert Banner if there are unidentified emergency cases */}
      {unidentifiedEmergencyCases > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white p-5 shadow-lg shadow-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-rose-700 font-mono">
                  ACTION REQUIRED
                </span>
                <span className="text-xs font-medium text-rose-100">Mass Casualty / Acute Intake</span>
              </div>
              <h3 className="text-lg font-bold mt-1 tracking-tight">
                {unidentifiedEmergencyCases} Unidentified Emergency Case{unidentifiedEmergencyCases > 1 ? 's' : ''} Awaiting Biometric Match
              </h3>
              <p className="text-xs text-rose-100 mt-0.5 max-w-xl">
                Immediate clinical review recommended. Cross-reference fingerprint reference IDs or run AI Assistant to search recorded physical marks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="dashboard-resolve-emergency-btn"
              onClick={() => onNavigate('emergency-cases')}
              className="px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 active:scale-95 transition-all shadow-sm"
            >
              Review Emergency Cases
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Patients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{totalPatients}</span>
            <span className="text-xs text-slate-500 font-medium">registered in database</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Identified Ratio:</span>
            <span className="font-semibold text-slate-800">
              {totalPatients > 0 ? Math.round((identifiedPatients / totalPatients) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Identified Patients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Identified Patients</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">
              {identifiedPatients}
            </span>
            <span className="text-xs text-slate-500 font-medium">verified records</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Status:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Full profile
            </span>
          </div>
        </div>

        {/* Unidentified Patients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Unidentified Patients</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight font-mono">
              {unidentifiedPatients}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending identification</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Reference Tracking:</span>
            <span className="font-semibold text-amber-700">Active</span>
          </div>
        </div>

        {/* Emergency Cases */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Emergency Cases</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight font-mono">
              {totalEmergencyCases}
            </span>
            <span className="text-xs text-slate-500 font-medium">intake incidents</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Unidentified Intake:</span>
            <span className="font-semibold text-rose-600 font-mono">{unidentifiedEmergencyCases} active</span>
          </div>
        </div>
      </div>

      {/* Quick Buttons Row */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            id="quick-btn-register"
            onClick={() => onNavigate('register-patient')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/60 text-slate-800 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Register Patient</p>
              <p className="text-xs text-slate-500 mt-0.5">New intake record</p>
            </div>
          </button>

          <button
            id="quick-btn-search"
            onClick={() => onNavigate('search-patient')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/60 text-slate-800 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Search Patient</p>
              <p className="text-xs text-slate-500 mt-0.5">Query ID / Biometric</p>
            </div>
          </button>

          <button
            id="quick-btn-emergency"
            onClick={() => onNavigate('emergency-case')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 text-slate-800 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-950 leading-tight">Emergency Case</p>
              <p className="text-xs text-rose-700 mt-0.5">Rapid triage intake</p>
            </div>
          </button>

          <button
            id="quick-btn-ai-assistant"
            onClick={() => onNavigate('ai-assistant')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-300 text-slate-800 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-950 leading-tight">AI Assistant</p>
              <p className="text-xs text-teal-700 mt-0.5">Clinical synthesis</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Split: Recent Emergency Cases & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Emergency Cases (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Emergency Cases</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest trauma cases received via emergency services</p>
              </div>
              <button
                id="view-all-emergency-cases-btn"
                onClick={() => onNavigate('emergency-cases')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <span>View All ({emergencyCases.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentEmergencyCases.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No emergency cases logged yet.</div>
              ) : (
                recentEmergencyCases.map((ec) => {
                  const statusColors = {
                    Identified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Unidentified: 'bg-rose-50 text-rose-700 border-rose-200',
                    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
                  };

                  return (
                    <div
                      key={ec.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {ec.photo ? (
                            <img src={ec.photo} alt={ec.temporaryId} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400 font-mono">EMG</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{ec.temporaryId}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                statusColors[ec.identificationStatus] || 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              {ec.identificationStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5 max-w-sm">
                            {ec.identificationRemarks || 'No physical remarks noted'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {ec.dateTime}
                            </span>
                            {ec.locationFound && <span>• {ec.locationFound}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        id={`dashboard-view-emg-${ec.id}`}
                        onClick={() => onSelectEmergencyCase(ec)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Patient Directory Snapshot (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Patients</h3>
                <p className="text-xs text-slate-500 mt-0.5">Trauma intake directory</p>
              </div>
              <button
                id="view-all-patients-btn"
                onClick={() => onNavigate('patients')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <span>Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img src={p.photo} alt={p.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            p.status === 'Identified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              id="dashboard-new-patient-link"
              onClick={() => onNavigate('register-patient')}
              className="w-full py-2.5 rounded-xl border border-dashed border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
