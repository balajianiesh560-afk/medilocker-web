import React, { useState } from 'react';
import {
  FileImage,
  Pill,
  FlaskConical,
  FileText,
  Clock,
  PlusCircle,
  FolderHeart,
} from 'lucide-react';
import { Patient, User, ScanReportRecord, PrescriptionRecord, LabReportRecord, DischargeSummaryRecord } from '../../types';
import { ScanReportsSection } from './ScanReportsSection';
import { PrescriptionsSection } from './PrescriptionsSection';
import { LabReportsSection } from './LabReportsSection';
import { DischargeSummariesSection } from './DischargeSummariesSection';
import { api } from '../../services/api';

export type ClinicalTabType = 'scans' | 'prescriptions' | 'labs' | 'discharge' | 'cases';

interface ClinicalRecordsTabsProps {
  patient: Patient;
  currentUser?: User | null;
  onUpdatePatient: (updated: Patient) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  onOpenAddCaseModal: () => void;
}

export const ClinicalRecordsTabs: React.FC<ClinicalRecordsTabsProps> = ({
  patient,
  currentUser,
  onUpdatePatient,
  showToast,
  onOpenAddCaseModal,
}) => {
  const [activeTab, setActiveTab] = useState<ClinicalTabType>('scans');

  const scansCount = patient.scanReports?.length || 0;
  const rxCount = patient.prescriptions?.length || 0;
  const labCount = patient.labReports?.length || 0;
  const dischargeCount = patient.dischargeSummaries?.length || 0;
  const casesCount = patient.caseHistory?.length || 0;

  const activeUser: User = currentUser || {
    id: 'DR-ER-01',
    name: 'Dr. Evelyn Reed, MD',
    role: 'doctor',
    hospitalId: 'HOSP-01',
    hospitalName: 'St. Jude Memorial Trauma Center',
    badgeNumber: 'MD-8821',
  };

  // Append handlers for new clinical records
  const handleAddScan = async (newScan: Partial<ScanReportRecord>) => {
    try {
      const res = await api.appendPatientRecord(patient.id, {
        type: 'scanReport',
        record: newScan,
        user: activeUser,
      });
      const saved: ScanReportRecord = res.item;
      const updatedList = [saved, ...(patient.scanReports || [])];
      onUpdatePatient({
        ...patient,
        scanReports: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('success', 'Scan Report Uploaded', `Radiology study "${saved.title || 'Imaging'}" added to patient file.`);
    } catch (err: any) {
      showToast('error', 'Upload Error', err?.message || 'Failed to save scan report');
      throw err;
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      await api.deletePatientRecord(patient.id, {
        recordType: 'scanReport',
        recordId: scanId,
        user: activeUser,
      });
      const updatedList = (patient.scanReports || []).filter((s) => s.id !== scanId);
      onUpdatePatient({
        ...patient,
        scanReports: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('info', 'Record Deleted', 'Scan report was removed from patient profile.');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Unable to delete scan report');
    }
  };

  const handleAddPrescription = async (newRx: Partial<PrescriptionRecord>) => {
    try {
      const res = await api.appendPatientRecord(patient.id, {
        type: 'prescription',
        record: newRx,
        user: activeUser,
      });
      const saved: PrescriptionRecord = res.item;
      const updatedList = [saved, ...(patient.prescriptions || [])];
      onUpdatePatient({
        ...patient,
        prescriptions: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('success', 'Prescription Signed', `Rx for "${saved.medicationName || 'Medication'}" issued successfully.`);
    } catch (err: any) {
      showToast('error', 'Prescription Error', err?.message || 'Failed to issue prescription');
      throw err;
    }
  };

  const handleDeletePrescription = async (rxId: string) => {
    try {
      await api.deletePatientRecord(patient.id, {
        recordType: 'prescription',
        recordId: rxId,
        user: activeUser,
      });
      const updatedList = (patient.prescriptions || []).filter((r) => r.id !== rxId);
      onUpdatePatient({
        ...patient,
        prescriptions: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('info', 'Record Deleted', 'Prescription was removed from record.');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Unable to delete prescription');
    }
  };

  const handleAddLabReport = async (newLab: Partial<LabReportRecord>) => {
    try {
      const res = await api.appendPatientRecord(patient.id, {
        type: 'labReport',
        record: newLab,
        user: activeUser,
      });
      const saved: LabReportRecord = res.item;
      const updatedList = [saved, ...(patient.labReports || [])];
      onUpdatePatient({
        ...patient,
        labReports: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('success', 'Lab Panel Recorded', `Pathology report "${saved.testName || 'Lab Panel'}" filed.`);
    } catch (err: any) {
      showToast('error', 'Save Failed', err?.message || 'Failed to save lab report');
      throw err;
    }
  };

  const handleDeleteLabReport = async (labId: string) => {
    try {
      await api.deletePatientRecord(patient.id, {
        recordType: 'labReport',
        recordId: labId,
        user: activeUser,
      });
      const updatedList = (patient.labReports || []).filter((l) => l.id !== labId);
      onUpdatePatient({
        ...patient,
        labReports: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('info', 'Record Deleted', 'Lab report removed from file.');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Unable to delete lab report');
    }
  };

  const handleAddDischargeSummary = async (newSummary: Partial<DischargeSummaryRecord>) => {
    try {
      const res = await api.appendPatientRecord(patient.id, {
        type: 'dischargeSummary',
        record: newSummary,
        user: activeUser,
      });
      const saved: DischargeSummaryRecord = res.item;
      const updatedList = [saved, ...(patient.dischargeSummaries || [])];
      onUpdatePatient({
        ...patient,
        dischargeSummaries: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('success', 'Discharge Summary Finalized', 'Inpatient discharge records archived.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err?.message || 'Failed to save discharge summary');
      throw err;
    }
  };

  const handleDeleteDischargeSummary = async (summaryId: string) => {
    try {
      await api.deletePatientRecord(patient.id, {
        recordType: 'dischargeSummary',
        recordId: summaryId,
        user: activeUser,
      });
      const updatedList = (patient.dischargeSummaries || []).filter((d) => d.id !== summaryId);
      onUpdatePatient({
        ...patient,
        dischargeSummaries: updatedList,
        updatedAt: new Date().toISOString(),
      });
      showToast('info', 'Record Deleted', 'Discharge summary was removed.');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Unable to delete discharge summary');
    }
  };

  const tabs: Array<{
    id: ClinicalTabType;
    label: string;
    tamilLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }> = [
    {
      id: 'scans',
      label: 'Scan Reports',
      tamilLabel: 'ஸ்கேன் ரிப்போர்ட்ஸ்',
      icon: FileImage,
      count: scansCount,
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      tamilLabel: 'பிரிஸ்கிரிப்ஷன்',
      icon: Pill,
      count: rxCount,
    },
    {
      id: 'labs',
      label: 'Lab Reports',
      tamilLabel: 'லேப் ரிப்போர்ட்ஸ்',
      icon: FlaskConical,
      count: labCount,
    },
    {
      id: 'discharge',
      label: 'Discharge Summaries',
      tamilLabel: 'டிஸ்சார்ஜ் சம்மரிஸ்',
      icon: FileText,
      count: dischargeCount,
    },
    {
      id: 'cases',
      label: 'Case History',
      tamilLabel: 'கேஸ் ஹிஸ்டரி',
      icon: Clock,
      count: casesCount,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
      {/* Header bar with title */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-50 via-teal-50/20 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center">
            <FolderHeart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Electronic Health Record (EHR) Dossier
            </h3>
            <p className="text-[11px] text-slate-500">
              Complete diagnostic imaging, medication charts, pathology results, and discharge paperwork
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-teal-700 font-mono font-medium">
          Total Records: {scansCount + rxCount + labCount + dischargeCount + casesCount}
        </div>
      </div>

      {/* Tabs navigation bar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200/70 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <div className="text-left leading-tight">
                <span className="block">{tab.label}</span>
                <span className="text-[9px] font-normal text-slate-400 block -mt-0.5">{tab.tamilLabel}</span>
              </div>
              <span
                className={`ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="p-5">
        {activeTab === 'scans' && (
          <ScanReportsSection
            scans={patient.scanReports || []}
            currentUser={currentUser}
            patientId={patient.id}
            patientName={patient.fullName}
            onAddScan={handleAddScan}
            onDeleteScan={handleDeleteScan}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsSection
            prescriptions={patient.prescriptions || []}
            currentUser={currentUser}
            patientId={patient.id}
            patientName={patient.fullName}
            onAddPrescription={handleAddPrescription}
            onDeletePrescription={handleDeletePrescription}
          />
        )}

        {activeTab === 'labs' && (
          <LabReportsSection
            labReports={patient.labReports || []}
            currentUser={currentUser}
            patientId={patient.id}
            patientName={patient.fullName}
            onAddLabReport={handleAddLabReport}
            onDeleteLabReport={handleDeleteLabReport}
          />
        )}

        {activeTab === 'discharge' && (
          <DischargeSummariesSection
            summaries={patient.dischargeSummaries || []}
            currentUser={currentUser}
            patientId={patient.id}
            patientName={patient.fullName}
            onAddDischargeSummary={handleAddDischargeSummary}
            onDeleteDischargeSummary={handleDeleteDischargeSummary}
          />
        )}

        {activeTab === 'cases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Incident & Case Admissions</h4>
                <p className="text-xs text-slate-500">Trauma intake records and emergency department history</p>
              </div>
              <button
                onClick={onOpenAddCaseModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Incident</span>
              </button>
            </div>

            {(!patient.caseHistory || patient.caseHistory.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                No incident admissions logged yet.
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
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
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
        )}
      </div>
    </div>
  );
};
