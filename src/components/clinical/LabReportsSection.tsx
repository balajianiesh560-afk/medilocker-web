import React, { useState } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  Calendar,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileCheck,
  Filter,
} from 'lucide-react';
import { LabReportRecord, LabParameterResult, User } from '../../types';
import { Modal } from '../Modal';

interface LabReportsSectionProps {
  labReports: LabReportRecord[];
  currentUser?: User | null;
  patientId: string;
  patientName: string;
  onAddLabReport: (newLab: Partial<LabReportRecord>) => Promise<void>;
  onDeleteLabReport?: (labId: string) => Promise<void>;
}

export const LabReportsSection: React.FC<LabReportsSectionProps> = ({
  labReports,
  currentUser,
  patientId,
  patientName,
  onAddLabReport,
  onDeleteLabReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null);

  // Add Lab Report State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    category: 'Hematology' as LabReportRecord['category'],
    sampleType: 'Whole Blood (EDTA)',
    laboratoryName: `${currentUser?.hospitalName || 'Central Trauma'} Clinical Laboratories`,
    pathologistName: currentUser?.name || 'Dr. Arthur Sterling, MD (Chief Pathologist)',
    status: 'Completed' as LabReportRecord['status'],
    overallSummary: '',
  });

  const [parameters, setParameters] = useState<LabParameterResult[]>([
    { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', referenceRange: '13.0 - 17.5', flag: 'Normal' },
    { name: 'Platelet Count', value: '240', unit: 'x10³/µL', referenceRange: '150 - 450', flag: 'Normal' },
  ]);

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'Hematology', label: 'Hematology' },
    { id: 'Biochemistry', label: 'Biochemistry' },
    { id: 'Microbiology', label: 'Microbiology' },
    { id: 'Urinalysis', label: 'Urinalysis' },
    { id: 'Immunology', label: 'Immunology' },
  ];

  const filteredLabs = labReports.filter((lab) => {
    const matchesCat = selectedCategory === 'ALL' || lab.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lab.testName.toLowerCase().includes(q) ||
      lab.laboratoryName.toLowerCase().includes(q) ||
      lab.overallSummary.toLowerCase().includes(q) ||
      lab.parameters.some((p) => p.name.toLowerCase().includes(q) || p.value.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleAddParameterRow = () => {
    setParameters([
      ...parameters,
      { name: '', value: '', unit: '', referenceRange: '', flag: 'Normal' },
    ]);
  };

  const handleRemoveParameterRow = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleUpdateParameter = (index: number, field: keyof LabParameterResult, val: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: val };
    setParameters(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testName) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      await onAddLabReport({
        ...formData,
        patientId,
        collectionDate: now,
        reportDate: now,
        parameters: parameters.filter((p) => p.name.trim() !== ''),
      });

      setShowAddModal(false);
      setFormData({
        testName: '',
        category: 'Hematology',
        sampleType: 'Whole Blood (EDTA)',
        laboratoryName: `${currentUser?.hospitalName || 'Central Trauma'} Clinical Laboratories`,
        pathologistName: currentUser?.name || 'Dr. Arthur Sterling, MD (Chief Pathologist)',
        status: 'Completed',
        overallSummary: '',
      });
      setParameters([
        { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', referenceRange: '13.0 - 17.5', flag: 'Normal' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFlagBadge = (flag: LabParameterResult['flag']) => {
    switch (flag) {
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Normal
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            <ArrowUp className="w-3 h-3 text-amber-600" />
            High
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <ArrowDown className="w-3 h-3 text-blue-600" />
            Low
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Critical
          </span>
        );
      default:
        return null;
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
              placeholder="Search lab tests, parameters, biomarkers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-add-lab-report"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Lab Report</span>
        </button>
      </div>

      {/* Lab Reports List */}
      {filteredLabs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Lab Reports Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No laboratory panels match "${searchQuery}".`
              : 'No clinical pathology or laboratory investigations on record for this patient.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold hover:bg-teal-100"
          >
            Record First Lab Panel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLabs.map((lab) => {
            const hasAbnormal = lab.parameters.some((p) => p.flag !== 'Normal');

            return (
              <div
                key={lab.id}
                className="bg-white rounded-xl border border-slate-200/80 hover:border-teal-500/40 shadow-xs transition-all overflow-hidden"
              >
                {/* Lab Panel Header */}
                <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                        {lab.category}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                          hasAbnormal
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {hasAbnormal ? 'Flagged Values Present' : 'All Values in Range'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{lab.id}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{lab.testName}</h4>
                    <p className="text-xs text-slate-500">
                      Sample: <span className="font-semibold text-slate-700">{lab.sampleType}</span> • Lab:{' '}
                      <span className="font-medium text-slate-700">{lab.laboratoryName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Reported: {lab.reportDate}
                      </div>
                      <div className="truncate max-w-[160px]" title={lab.pathologistName}>
                        {lab.pathologistName}
                      </div>
                    </div>

                    {onDeleteLabReport && (
                      <button
                        onClick={() => onDeleteLabReport(lab.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                        title="Delete lab report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Overall Diagnostic Summary if present */}
                {lab.overallSummary && (
                  <div className="px-4 py-2.5 bg-sky-50/50 border-b border-sky-100 text-xs text-sky-950 flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Pathologist Interpretation: </span>
                      {lab.overallSummary}
                    </div>
                  </div>
                )}

                {/* Structured Parameter Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Biomarker / Parameter</th>
                        <th className="py-2.5 px-3">Result</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Reference Range</th>
                        <th className="py-2.5 px-4 text-right">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {lab.parameters.map((param, pIdx) => {
                        const isAbnormal = param.flag !== 'Normal';

                        return (
                          <tr
                            key={pIdx}
                            className={`transition-colors ${
                              isAbnormal ? 'bg-amber-50/30 font-medium' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            <td className="py-2.5 px-4 font-semibold text-slate-900">
                              {param.name}
                            </td>
                            <td
                              className={`py-2.5 px-3 font-mono font-bold ${
                                isAbnormal ? 'text-amber-900 text-sm' : 'text-slate-800'
                              }`}
                            >
                              {param.value}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {param.unit}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">
                              {param.referenceRange}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {getFlagBadge(param.flag)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lab Report Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Diagnostic Laboratory Panel"
          subtitle={`Log clinical lab report for ${patientName} (${patientId})`}
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test / Panel Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) or Comprehensive Metabolic Panel"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Urinalysis">Urinalysis</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Pathology">Pathology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Specimen</label>
                <input
                  type="text"
                  placeholder="e.g. Whole Blood, Serum, Midstream Urine"
                  value={formData.sampleType}
                  onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Laboratory</label>
                <input
                  type="text"
                  value={formData.laboratoryName}
                  onChange={(e) => setFormData({ ...formData, laboratoryName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathologist / Reviewer</label>
                <input
                  type="text"
                  value={formData.pathologistName}
                  onChange={(e) => setFormData({ ...formData, pathologistName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathologist Interpretation Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Mild leukocytosis secondary to trauma; renal indices unremarkable."
                  value={formData.overallSummary}
                  onChange={(e) => setFormData({ ...formData, overallSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Dynamic Parameter Entries */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Biomarkers & Results
                </span>
                <button
                  type="button"
                  onClick={handleAddParameterRow}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {parameters.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Parameter (e.g. WBC Count)"
                        value={param.name}
                        onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => handleUpdateParameter(index, 'value', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={param.unit}
                        onChange={(e) => handleUpdateParameter(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Ref (e.g. 4.0-11.0)"
                        value={param.referenceRange}
                        onChange={(e) => handleUpdateParameter(index, 'referenceRange', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      <select
                        value={param.flag}
                        onChange={(e) => handleUpdateParameter(index, 'flag', e.target.value)}
                        className="w-full px-1 py-1.5 rounded border border-slate-200 bg-white text-[11px]"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveParameterRow(index)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
                {isSubmitting ? 'Saving Report...' : 'Save Lab Report'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
