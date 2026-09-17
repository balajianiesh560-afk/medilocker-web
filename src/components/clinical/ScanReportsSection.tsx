import React, { useState } from 'react';
import {
  FileImage,
  Search,
  Plus,
  Eye,
  Calendar,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  Download,
  Share2,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ScanReportRecord, User } from '../../types';
import { Modal } from '../Modal';
import { SCAN_SAMPLE_IMAGES } from '../../data/clinicalRecordsData';

interface ScanReportsSectionProps {
  scans: ScanReportRecord[];
  currentUser?: User | null;
  patientId: string;
  patientName: string;
  onAddScan: (newScan: Partial<ScanReportRecord>) => Promise<void>;
  onDeleteScan?: (scanId: string) => Promise<void>;
}

export const ScanReportsSection: React.FC<ScanReportsSectionProps> = ({
  scans,
  currentUser,
  patientId,
  patientName,
  onAddScan,
  onDeleteScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [selectedScanForView, setSelectedScanForView] = useState<ScanReportRecord | null>(null);

  // Add Scan Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    modality: 'CT Scan' as ScanReportRecord['modality'],
    bodyRegion: '',
    clinicalIndication: '',
    technique: '',
    findings: '',
    impression: '',
    status: 'Normal' as ScanReportRecord['status'],
    hospitalName: currentUser?.hospitalName || 'Metropolitan Trauma Hospital',
    radiologistName: currentUser?.name || 'Dr. Sarah Lin, MD (Chief Radiologist)',
  });

  const modalities: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Modalities' },
    { id: 'CT Scan', label: 'CT Scan' },
    { id: 'MRI', label: 'MRI' },
    { id: 'X-Ray', label: 'X-Ray' },
    { id: 'Ultrasound', label: 'Ultrasound' },
    { id: 'Echocardiogram', label: 'Echo' },
  ];

  const filteredScans = scans.filter((scan) => {
    const matchesModality = selectedModality === 'ALL' || scan.modality === selectedModality;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      scan.title.toLowerCase().includes(q) ||
      scan.bodyRegion.toLowerCase().includes(q) ||
      scan.impression.toLowerCase().includes(q) ||
      scan.findings.toLowerCase().includes(q) ||
      scan.radiologistName.toLowerCase().includes(q) ||
      scan.hospitalName.toLowerCase().includes(q);
    return matchesModality && matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.findings) return;

    setIsSubmitting(true);
    try {
      // Choose an appropriate thumbnail based on modality
      let autoImage = SCAN_SAMPLE_IMAGES.chestXRay;
      if (formData.modality === 'CT Scan') autoImage = SCAN_SAMPLE_IMAGES.ctBrain;
      else if (formData.modality === 'MRI') autoImage = SCAN_SAMPLE_IMAGES.mriKneeOrSpine;
      else if (formData.modality === 'Ultrasound') autoImage = SCAN_SAMPLE_IMAGES.ultrasoundAbdomen;

      await onAddScan({
        ...formData,
        patientId,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        imageUrl: autoImage,
        fileSize: '16.4 MB',
      });

      setShowAddModal(false);
      setFormData({
        title: '',
        modality: 'CT Scan',
        bodyRegion: '',
        clinicalIndication: '',
        technique: '',
        findings: '',
        impression: '',
        status: 'Normal',
        hospitalName: currentUser?.hospitalName || 'Metropolitan Trauma Hospital',
        radiologistName: currentUser?.name || 'Dr. Sarah Lin, MD (Chief Radiologist)',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalityBadgeColor = (modality: string) => {
    switch (modality) {
      case 'CT Scan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MRI':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'X-Ray':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Ultrasound':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Echocardiogram':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Abnormal':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Critical Review':
        return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scans by organ, finding, impression..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Modality Chips */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-0.5">
            {modalities.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModality(mod.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedModality === mod.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-add-scan-report"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Scan Report</span>
        </button>
      </div>

      {/* Scans Grid */}
      {filteredScans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileImage className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Scan Reports Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No scan records match "${searchQuery}". Try another keyword or clear filter.`
              : 'No diagnostic radiological imaging has been uploaded for this patient yet.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold hover:bg-teal-100"
          >
            Upload First Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScans.map((scan) => (
            <div
              key={scan.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-teal-500/40 hover:shadow-md transition-all p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getModalityBadgeColor(
                          scan.modality
                        )}`}
                      >
                        {scan.modality}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadgeColor(
                          scan.status
                        )}`}
                      >
                        {scan.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{scan.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{scan.title}</h4>
                    <p className="text-xs text-teal-700 font-medium">{scan.bodyRegion}</p>
                  </div>
                </div>

                {/* Thumbnail Preview and Quick Stats */}
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 group">
                  <img
                    src={scan.imageUrl || SCAN_SAMPLE_IMAGES.chestXRay}
                    alt={scan.title}
                    className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5 justify-between">
                    <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      {scan.fileSize || '15.0 MB'} • DICOM 3.0
                    </span>
                    <button
                      onClick={() => setSelectedScanForView(scan)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-white bg-teal-600/90 hover:bg-teal-500 px-2.5 py-1 rounded-md shadow-xs backdrop-blur-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Scan</span>
                    </button>
                  </div>
                </div>

                {/* Clinical Findings & Impression */}
                <div className="space-y-2 text-xs">
                  {scan.impression && (
                    <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2.5 text-amber-900">
                      <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wider mb-0.5">
                        Clinical Impression:
                      </span>
                      <p className="text-[11px] leading-relaxed line-clamp-2">{scan.impression}</p>
                    </div>
                  )}

                  <div className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                    <span className="font-semibold text-slate-700">Findings: </span>
                    {scan.findings}
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 truncate max-w-[200px]" title={scan.radiologistName}>
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{scan.radiologistName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {scan.date}
                  </span>
                  {onDeleteScan && (
                    <button
                      onClick={() => onDeleteScan(scan.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete scan report"
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

      {/* Full Scan Image Viewer Lightbox Modal */}
      {selectedScanForView && (
        <Modal
          isOpen={Boolean(selectedScanForView)}
          onClose={() => setSelectedScanForView(null)}
          title={`${selectedScanForView.modality}: ${selectedScanForView.title}`}
          subtitle={`Patient: ${patientName} (${patientId}) • Exam Date: ${selectedScanForView.date}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* DICOM Radiographic Viewport */}
            <div className="bg-black rounded-xl p-3 border border-slate-800 text-white space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span>FACILITY: {selectedScanForView.hospitalName}</span>
                <span className="text-teal-400 font-bold">STATUS: {selectedScanForView.status}</span>
              </div>

              <div className="w-full flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden p-2">
                <img
                  src={selectedScanForView.imageUrl || SCAN_SAMPLE_IMAGES.chestXRay}
                  alt={selectedScanForView.title}
                  className="w-full max-h-[380px] object-contain rounded"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>SLICE THICKNESS: 2.5mm • WINDOW: BONE/SOFT</span>
                <span>FILE: {selectedScanForView.id}.dcm ({selectedScanForView.fileSize || '15 MB'})</span>
              </div>
            </div>

            {/* Diagnostic Report Content */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600 border-b border-slate-200 pb-2">
                <div>
                  <span className="font-semibold text-slate-700 block text-[10px] uppercase">Body Region:</span>
                  <span>{selectedScanForView.bodyRegion}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block text-[10px] uppercase">Radiologist:</span>
                  <span>{selectedScanForView.radiologistName}</span>
                </div>
                {selectedScanForView.technique && (
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-700 block text-[10px] uppercase">Technique:</span>
                    <span>{selectedScanForView.technique}</span>
                  </div>
                )}
                {selectedScanForView.clinicalIndication && (
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-700 block text-[10px] uppercase">Clinical Indication:</span>
                    <span>{selectedScanForView.clinicalIndication}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider mb-1">
                  Radiologic Findings:
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                  {selectedScanForView.findings}
                </p>
              </div>

              {selectedScanForView.impression && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-900 block text-xs uppercase tracking-wider mb-1">
                    Impression & Recommendations:
                  </span>
                  <p className="text-amber-950 font-medium leading-relaxed whitespace-pre-line">
                    {selectedScanForView.impression}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedScanForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Scan Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Patient Scan Report"
          subtitle={`Log radiographic imaging for ${patientName} (${patientId})`}
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scan Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-Contrast Brain CT or AP Chest Radiograph"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modality</label>
                <select
                  value={formData.modality}
                  onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="CT Scan">CT Scan (Computed Tomography)</option>
                  <option value="MRI">MRI (Magnetic Resonance Imaging)</option>
                  <option value="X-Ray">Digital Radiograph (X-Ray)</option>
                  <option value="Ultrasound">Diagnostic Ultrasound</option>
                  <option value="Echocardiogram">Echocardiogram</option>
                  <option value="PET Scan">PET Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Body Region <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Head / Brain, Thorax, Lumbar Spine"
                  value={formData.bodyRegion}
                  onChange={(e) => setFormData({ ...formData, bodyRegion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Radiologic Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Normal">Normal (No acute pathology)</option>
                  <option value="Abnormal">Abnormal (Pathology identified)</option>
                  <option value="Critical Review">Critical Review (Urgent surgical alert)</option>
                  <option value="Inconclusive">Inconclusive / Repeat advised</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Radiologist Name</label>
                <input
                  type="text"
                  value={formData.radiologistName}
                  onChange={(e) => setFormData({ ...formData, radiologistName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indication</label>
                <input
                  type="text"
                  placeholder="e.g. Acute trauma post motor vehicle accident with loss of consciousness"
                  value={formData.clinicalIndication}
                  onChange={(e) => setFormData({ ...formData, clinicalIndication: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Findings <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed radiological observations..."
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Impression / Conclusion
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of acute findings and recommended clinical actions..."
                  value={formData.impression}
                  onChange={(e) => setFormData({ ...formData, impression: e.target.value })}
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
                {isSubmitting ? 'Saving Scan...' : 'Save Scan Report'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
