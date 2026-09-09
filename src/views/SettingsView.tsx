import React, { useState } from 'react';
import {
  Server,
  Sparkles,
  Database,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Info,
  Activity,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { BiometricSimulator } from '../components/BiometricSimulator';
import { generateAvatar } from '../data/sampleData';

interface SettingsViewProps {
  geminiConfigured: boolean;
  totalPatients: number;
  totalEmergencyCases: number;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  geminiConfigured,
  totalPatients,
  totalEmergencyCases,
  onDataReset,
}) => {
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  // Standalone simulator test states
  const [testPhoto, setTestPhoto] = useState(generateAvatar('SIM', '#0d9488'));
  const [testFp, setTestFp] = useState('FP-9921-DEMO');

  const handleResetDatabase = async () => {
    if (
      !confirm(
        'Warning: This will restore the demo patients and emergency cases back to their original factory records. Continue?'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await api.resetData();
      showToast('success', 'Database Reset', 'Sample patients and emergency cases have been reloaded.');
      onDataReset();
    } catch (err: any) {
      showToast('error', 'Reset Failed', err?.message || 'Could not reset data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Service Status</span>
            <Sparkles
              className={`w-5 h-5 ${geminiConfigured ? 'text-emerald-600' : 'text-amber-500'}`}
            />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">
            {geminiConfigured ? 'Gemini 3.8 Flash' : 'Local Fallback'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {geminiConfigured
              ? 'Connected with server-side API Key'
              : 'Using structured local fallback synthesizer'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Engine</span>
            <Database className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">JSON Persistent DB</p>
          <p className="text-xs text-slate-500 mt-1">
            {totalPatients} patients • {totalEmergencyCases} emergency cases
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trauma Unit</span>
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">Level 1 Emergency</p>
          <p className="text-xs text-slate-500 mt-1">Metropolitan Hospital Trauma Center</p>
        </div>
      </div>

      {/* Biometric Reference Hardware Diagnostic / Sandbox */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-sky-600" />
            <span>Biometric Hardware Scanner Testbench</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test and calibrate photographic and fingerprint reference ID inputs without modifying active patient records.
          </p>
        </div>

        <BiometricSimulator
          photoValue={testPhoto}
          onPhotoChange={setTestPhoto}
          fingerprintRefId={testFp}
          onFingerprintChange={setTestFp}
          patientNamePlaceholder="SIM"
        />
      </div>

      {/* Medical AI Compliance & Ethics Statement */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <span>Medical AI Compliance & Safety Policies</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          MediLocker is strictly architected for rapid identification cross-referencing and clinical data
          organization during emergency incidents. Per hackathon and healthcare safety guidelines:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
          <li>The AI model never diagnoses medical conditions or replaces physician judgment.</li>
          <li>The AI model never prescribes pharmaceuticals or dictates clinical intervention pathways.</li>
          <li>All patient data is stored locally in the application container with no third-party data tracking.</li>
          <li>Biometric identifiers are labeled and handled strictly as demonstration identification references.</li>
        </ul>
      </div>

      {/* Reset Database Section */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Factory Demo Data Reset</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Restore the original hackathon demonstration records. This is useful for resetting the application
              after testing deletion, creation, and emergency triage workflows.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            id="settings-reset-db-btn"
            onClick={handleResetDatabase}
            disabled={isResetting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isResetting ? 'Reloading Factory Data...' : 'Reset Database to Demo State'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
