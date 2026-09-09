import React, { useState } from 'react';
import { Fingerprint, Camera, ShieldCheck, RefreshCw, CheckCircle2, Upload, Sparkles } from 'lucide-react';
import { generateAvatar } from '../data/sampleData';

interface BiometricSimulatorProps {
  photoValue: string;
  onPhotoChange: (photoDataUrl: string) => void;
  fingerprintRefId: string;
  onFingerprintChange: (refId: string) => void;
  patientNamePlaceholder?: string;
}

export const BiometricSimulator: React.FC<BiometricSimulatorProps> = ({
  photoValue,
  onPhotoChange,
  fingerprintRefId,
  onFingerprintChange,
  patientNamePlaceholder = 'PT',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const handleSimulateFingerprintScan = () => {
    setIsScanning(true);
    setScanStatus('Interfacing with reference optical reader...');
    setTimeout(() => {
      const generatedRef = `FP-${Math.floor(1000 + Math.random() * 9000)}-${['A1', 'B2', 'C3', 'R4', 'T5'][Math.floor(Math.random() * 5)]}`;
      onFingerprintChange(generatedRef);
      setIsScanning(false);
      setScanStatus('Reference hash generated (NIST ITL 1-2011 compliant)');
      setTimeout(() => setScanStatus(null), 3500);
    }, 900);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUsePresetPhoto = (variant: 'male' | 'female' | 'unidentified') => {
    const color = variant === 'male' ? '#0284c7' : variant === 'female' ? '#0d9488' : '#e11d48';
    const initials = variant === 'male' ? 'JD' : variant === 'female' ? 'JS' : '?';
    const avatar = generateAvatar(initials, color);
    onPhotoChange(avatar);
  };

  return (
    <div className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/50 to-white p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Identification Reference
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                Hardware Ready
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Reference standard demo fields for facial and fingerprint identification records.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Photo Reference */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Patient Photo <span className="font-normal text-slate-500">(Identification Reference)</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center relative shadow-xs">
              {photoValue ? (
                <img src={photoValue} alt="Patient Reference" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-7 h-7 text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label
                htmlFor="photo-file-upload"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-colors shadow-xs w-full sm:w-auto"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Upload Image
              </label>
              <input
                id="photo-file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Sample Avatars:</span>
                <button
                  type="button"
                  onClick={() => handleUsePresetPhoto('male')}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => handleUsePresetPhoto('female')}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors"
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => handleUsePresetPhoto('unidentified')}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                >
                  Unknown / Trauma
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fingerprint Reference */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Fingerprint Reference ID <span className="font-normal text-slate-500">(Identification Reference)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Format: FP-XXXX-XX</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Fingerprint className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="fingerprint-ref-input"
                type="text"
                value={fingerprintRefId}
                onChange={(e) => onFingerprintChange(e.target.value)}
                placeholder="e.g. FP-8842-A1"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              />
            </div>
            <button
              id="simulate-scan-btn"
              type="button"
              onClick={handleSimulateFingerprintScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              title="Simulate hardware capture from scanner"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Simulate Scan'}
            </button>
          </div>

          {scanStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-md px-2.5 py-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{scanStatus}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-tight">
            Stores standardized biometric template hashes for matching against emergency intake records without storing raw biological telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
