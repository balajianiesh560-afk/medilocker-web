import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX,
  Fingerprint,
  FileSearch,
} from 'lucide-react';
import { Modal } from './Modal';
import { Patient, EmergencyCase } from '../types';
import { parseScannedQRContent, decodeQRFromCanvas } from '../utils/qrCode';
import { useToast } from './Toast';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  emergencyCases?: EmergencyCase[];
  onSelectPatient: (patient: Patient) => void;
  onSelectEmergencyCase?: (ec: EmergencyCase) => void;
  onRegisterWithId?: (scannedId: string) => void;
}

type ScanTab = 'camera' | 'upload' | 'simulate';

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  patients,
  emergencyCases = [],
  onSelectPatient,
  onSelectEmergencyCase,
  onRegisterWithId,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ScanTab>('camera');

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Match state
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);
  const [matchedPatient, setMatchedPatient] = useState<Patient | null>(null);
  const [matchedEmergencyCase, setMatchedEmergencyCase] = useState<EmergencyCase | null>(null);
  const [unmatchedId, setUnmatchedId] = useState<string | null>(null);

  // Manual input state
  const [manualInput, setManualInput] = useState('');

  // Start / Stop camera when tab changes or modal opens/closes
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !scannedRaw) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, scannedRaw]);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        scanLoop();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access or use File Upload / Simulator.'
          : 'Unable to access camera device. You can test with the quick simulator or image upload.'
      );
      setCameraActive(false);
    }
  };

  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const codeText = decodeQRFromCanvas(canvas);

        if (codeText) {
          handleDetectedCode(codeText);
          return;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanLoop);
  };

  const handleDetectedCode = (rawText: string) => {
    stopCamera();
    setScannedRaw(rawText);

    const parsed = parseScannedQRContent(rawText);

    // Look for matching patient
    if (parsed.patientId) {
      const found = patients.find(
        (p) => p.id.toLowerCase() === parsed.patientId!.toLowerCase()
      );
      if (found) {
        setMatchedPatient(found);
        setMatchedEmergencyCase(null);
        setUnmatchedId(null);
        showToast('success', 'Patient Identified', `Matched record for ${found.fullName} (${found.id}).`);
        return;
      }
    }

    // Look for matching emergency case
    if (parsed.emergencyCaseId) {
      const foundCase = emergencyCases.find(
        (c) =>
          c.temporaryId.toLowerCase() === parsed.emergencyCaseId!.toLowerCase() ||
          c.id.toLowerCase() === parsed.emergencyCaseId!.toLowerCase()
      );
      if (foundCase) {
        setMatchedEmergencyCase(foundCase);
        setMatchedPatient(null);
        setUnmatchedId(null);
        showToast('info', 'Emergency Case Identified', `Matched emergency tag ${foundCase.temporaryId}.`);
        return;
      }
    }

    // Also check fingerprint reference match
    const foundByRef = patients.find(
      (p) => p.fingerprintRefId.toLowerCase() === rawText.toLowerCase().trim()
    );
    if (foundByRef) {
      setMatchedPatient(foundByRef);
      setMatchedEmergencyCase(null);
      setUnmatchedId(null);
      showToast('success', 'Patient Identified', `Matched biometric reference for ${foundByRef.fullName}.`);
      return;
    }

    // Not matched
    setMatchedPatient(null);
    setMatchedEmergencyCase(null);
    setUnmatchedId(parsed.patientId || parsed.emergencyCaseId || rawText);
    showToast('error', 'No Match Found', `No registered record found for code "${rawText.slice(0, 25)}"`);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const codeText = decodeQRFromCanvas(canvas);

        if (codeText) {
          handleDetectedCode(codeText);
        } else {
          showToast('error', 'Unreadable QR', 'Could not detect a clear QR code in this image. Try another file.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetScan = () => {
    setScannedRaw(null);
    setMatchedPatient(null);
    setMatchedEmergencyCase(null);
    setUnmatchedId(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code to Identify Patient" size="lg">
      <div className="space-y-4">
        {/* Subheader tabs */}
        {!scannedRaw && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              id="qr-tab-camera"
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'camera'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-sky-600" />
              <span>Live Camera</span>
            </button>

            <button
              id="qr-tab-upload"
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              <span>Upload QR File</span>
            </button>

            <button
              id="qr-tab-simulate"
              type="button"
              onClick={() => setActiveTab('simulate')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'simulate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Barcode / Sim</span>
            </button>
          </div>
        )}

        {/* ================= RESULT VIEW ================= */}
        {scannedRaw ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* MATCHED PATIENT */}
            {matchedPatient && (
              <div
                id="qr-matched-patient-card"
                className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={matchedPatient.photo}
                      alt={matchedPatient.fullName}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-300 shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                          {matchedPatient.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            matchedPatient.status === 'Identified'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {matchedPatient.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {matchedPatient.fullName}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {matchedPatient.gender}, {matchedPatient.age} yrs • Blood: {matchedPatient.bloodType || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-700 bg-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xs border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-emerald-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-semibold text-slate-500">Biometric Reference:</span>
                    <span className="font-mono font-bold text-slate-800">{matchedPatient.fingerprintRefId}</span>
                  </div>
                  {matchedPatient.identificationRemarks && (
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-500">Physical Markers: </span>
                      <span>{matchedPatient.identificationRemarks}</span>
                    </div>
                  )}
                  {matchedPatient.emergencyNotes && (
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-500">Emergency Notes: </span>
                      <span className="italic">{matchedPatient.emergencyNotes}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    id="qr-open-profile-btn"
                    type="button"
                    onClick={() => {
                      onSelectPatient(matchedPatient);
                      onClose();
                    }}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 cursor-pointer"
                  >
                    <span>Open Clinical Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="qr-scan-another-btn"
                    type="button"
                    onClick={handleResetScan}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>
            )}

            {/* MATCHED EMERGENCY CASE */}
            {matchedEmergencyCase && (
              <div
                id="qr-matched-emergency-card"
                className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      {matchedEmergencyCase.temporaryId}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Emergency Triage Case
                    </h3>
                    <p className="text-xs text-slate-600">
                      {matchedEmergencyCase.gender}, ~{matchedEmergencyCase.estimatedAge} yrs • Status: {matchedEmergencyCase.identificationStatus}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">
                    {matchedEmergencyCase.triageLevel || 'Immediate'}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3 border border-amber-200 text-xs space-y-1">
                  <p><strong>Remarks:</strong> {matchedEmergencyCase.identificationRemarks}</p>
                  <p><strong>Fingerprint Reference:</strong> <span className="font-mono">{matchedEmergencyCase.fingerprintRefId}</span></p>
                  <p><strong>Emergency Notes:</strong> {matchedEmergencyCase.emergencyNotes}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  {onSelectEmergencyCase && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectEmergencyCase(matchedEmergencyCase);
                        onClose();
                      }}
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs"
                    >
                      <span>View Emergency Case</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>
            )}

            {/* UNMATCHED QR CODE */}
            {unmatchedId && (
              <div
                id="qr-unmatched-card"
                className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">No Patient Record Found</h4>
                    <p className="text-xs text-slate-600">
                      Scanned Code: <span className="font-mono font-bold text-slate-800">{unmatchedId}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-rose-100">
                  This QR code is valid but has not yet been registered in the Metropolitan Trauma database. Would you like to register an intake admission for this patient?
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {onRegisterWithId && (
                    <button
                      type="button"
                      onClick={() => {
                        onRegisterWithId(unmatchedId);
                        onClose();
                      }}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                    >
                      Register New Patient with ID
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= SCANNER TABS ================= */
          <div className="space-y-4">
            {/* CAMERA TAB */}
            {activeTab === 'camera' && (
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Reticle / Aiming Crosshairs */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-48 h-48 border-2 border-sky-400/80 rounded-2xl shadow-lg">
                        {/* Corner markers */}
                        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-teal-400 rounded-tl-md" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-teal-400 rounded-tr-md" />
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-teal-400 rounded-bl-md" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-teal-400 rounded-br-md" />

                        {/* Scanning beam animation */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse shadow-sm shadow-sky-400" />
                      </div>
                    </div>

                    <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-medium text-slate-200 border border-slate-700">
                        Align patient wristband QR inside frame
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 space-y-3 max-w-sm">
                    <Camera className="w-10 h-10 mx-auto text-slate-600" />
                    {cameraError ? (
                      <p className="text-xs text-rose-400">{cameraError}</p>
                    ) : (
                      <p className="text-xs">Initializing camera feed...</p>
                    )}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* UPLOAD FILE TAB */}
            {activeTab === 'upload' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer space-y-3"
                onClick={() => document.getElementById('qr-file-input')?.click()}
              >
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-600 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drop patient QR image here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports PNG, JPG, WebP photo of wristband or triage badge
                  </p>
                </div>
              </div>
            )}

            {/* BARCODE / SIMULATOR TAB */}
            {activeTab === 'simulate' && (
              <div className="space-y-4">
                {/* 2D Barcode scanner text input */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-sky-600" />
                    <span>Hospital Handheld 2D Barcode Scanner Input</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Handheld barcode readers act as keyboard inputs. You can scan with a USB optical gun or paste encoded payload:
                  </p>
                  <div className="flex gap-2">
                    <input
                      id="manual-qr-input"
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualInput.trim()) {
                          handleDetectedCode(manualInput.trim());
                        }
                      }}
                      placeholder="e.g. PID-1042 or full JSON payload..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualInput.trim()) {
                          handleDetectedCode(manualInput.trim());
                        }
                      }}
                      disabled={!manualInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold"
                    >
                      Process
                    </button>
                  </div>
                </div>

                {/* Instant Test Chips from Database */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Quick Instant Match Simulation
                    </span>
                    <span className="text-[10px] text-slate-500">1-click test lookup</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {patients.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleDetectedCode(p.id)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 bg-white transition-all text-left group"
                      >
                        <img
                          src={p.photo}
                          alt={p.fullName}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-sky-700">
                              {p.id}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                p.status === 'Identified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {p.fullName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
