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
  Loader2,
  FlipHorizontal,
  CameraOff,
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
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTime = useRef<number>(0);

  // Match state
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);
  const [matchedPatient, setMatchedPatient] = useState<Patient | null>(null);
  const [matchedEmergencyCase, setMatchedEmergencyCase] = useState<EmergencyCase | null>(null);
  const [unmatchedId, setUnmatchedId] = useState<string | null>(null);
  const [autoNavigate, setAutoNavigate] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const navTimerRef = useRef<any>(null);

  // Manual input state
  const [manualInput, setManualInput] = useState('');

  const cancelAutoNav = () => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    setIsNavigating(false);
  };

  const handleResetScan = () => {
    cancelAutoNav();
    setScannedRaw(null);
    setMatchedPatient(null);
    setMatchedEmergencyCase(null);
    setUnmatchedId(null);
    setManualInput('');
    if (activeTab === 'camera') {
      startCamera(facingMode);
    }
  };

  // Start / Stop camera when tab changes or modal opens/closes
  useEffect(() => {
    let timer: any;
    if (isOpen && activeTab === 'camera' && !scannedRaw) {
      // Small timeout ensures video element is mounted in the DOM
      timer = setTimeout(() => {
        startCamera(facingMode);
      }, 50);
    } else {
      stopCamera();
    }

    return () => {
      clearTimeout(timer);
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsCameraStarting(false);
  };

  const startCamera = async (targetFacing?: 'environment' | 'user') => {
    stopCamera();
    const desiredFacing = targetFacing || facingMode;
    setCameraError(null);
    setIsCameraStarting(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera API is not supported in this browser environment. Please use Upload QR or Simulator.'
      );
      setIsCameraStarting(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Try requesting ideal facingMode first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: desiredFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errFirst) {
        console.warn('Ideal facing camera constraints failed, attempting fallback to any video source:', errFirst);
        // Fallback: try basic video
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');

        // Wait for video metadata/stream to be ready to play
        await new Promise<void>((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
          } else {
            video.onloadedmetadata = () => resolve();
            setTimeout(resolve, 800);
          }
        });

        try {
          await video.play();
        } catch (playErr) {
          console.warn('Video auto-play warning:', playErr);
        }

        setCameraActive(true);
        setIsCameraStarting(false);
        scanLoop();
      } else {
        setIsCameraStarting(false);
        setCameraError('Video display element not initialized. Please click Retry.');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsCameraStarting(false);
      setCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was denied. Please allow camera permissions in browser settings or use Upload / Simulator.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can test with file upload or the simulator.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is in use by another app. Please close other camera apps and retry.');
      } else {
        setCameraError(err.message || 'Unable to access camera device. Please try Upload or Simulator.');
      }
    }
  };

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const scanLoop = () => {
    if (!streamRef.current) return;

    const now = performance.now();
    // Scan every 100ms for optimal balance of scanning speed and CPU efficiency
    if (now - lastScanTime.current > 100) {
      lastScanTime.current = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0
      ) {
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
        showToast('success', 'Patient Identified', `Matched record for ${found.fullName} (${found.id}). Navigating into app...`);

        if (autoNavigate) {
          setIsNavigating(true);
          navTimerRef.current = setTimeout(() => {
            onSelectPatient(found);
            onClose();
          }, 850);
        }
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
        showToast('info', 'Emergency Case Identified', `Matched emergency tag ${foundCase.temporaryId}. Navigating into app...`);

        if (autoNavigate && onSelectEmergencyCase) {
          setIsNavigating(true);
          navTimerRef.current = setTimeout(() => {
            onSelectEmergencyCase(foundCase);
            onClose();
          }, 850);
        }
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
      showToast('success', 'Patient Identified', `Matched biometric reference for ${foundByRef.fullName}. Navigating into app...`);

      if (autoNavigate) {
        setIsNavigating(true);
        navTimerRef.current = setTimeout(() => {
          onSelectPatient(foundByRef);
          onClose();
        }, 850);
      }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code to Identify Patient" size="lg">
      <div className="space-y-4">
        {/* Subheader tabs & Auto-open option */}
        {!scannedRaw && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  id="qr-auto-navigate-toggle"
                  type="checkbox"
                  checked={autoNavigate}
                  onChange={(e) => setAutoNavigate(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer accent-teal-600"
                />
                <span className="font-semibold text-slate-700">Auto-open clinical profile upon scan</span>
              </label>
              <span className="text-[11px] text-teal-700 font-medium">Navigates directly into app</span>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                id="qr-tab-camera"
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span>Live Camera</span>
              </button>

              <button
                id="qr-tab-upload"
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'simulate'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Barcode / Sim</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= RESULT VIEW ================= */}
        {scannedRaw ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Direct Auto-Navigate Progress Banner */}
            {isNavigating && (
              <div
                id="qr-autonav-banner"
                className="bg-teal-600 text-white p-3.5 rounded-2xl shadow-lg shadow-teal-600/20 flex items-center justify-between gap-3 animate-in fade-in"
              >
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                  <span>Verified! Navigating directly into patient profile...</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      cancelAutoNav();
                      if (matchedPatient) onSelectPatient(matchedPatient);
                      else if (matchedEmergencyCase && onSelectEmergencyCase)
                        onSelectEmergencyCase(matchedEmergencyCase);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-white text-teal-800 font-extrabold text-xs hover:bg-teal-50 cursor-pointer shadow-xs"
                  >
                    Open Now
                  </button>
                  <button
                    type="button"
                    onClick={cancelAutoNav}
                    className="px-2.5 py-1 rounded-lg text-teal-100 hover:text-white hover:bg-teal-700 text-xs cursor-pointer"
                  >
                    Stay
                  </button>
                </div>
              </div>
            )}
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
                {/* Video element is permanently mounted to allow stream attachment */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                  }`}
                  muted
                  autoPlay
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* HUD Overlay when Camera is Active */}
                {cameraActive && (
                  <>
                    {/* Reticle / Aiming Crosshairs */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-teal-400/80 rounded-2xl shadow-lg">
                        {/* Corner markers */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

                        {/* Scanning beam animation */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse shadow-md shadow-teal-400" />
                      </div>
                    </div>

                    {/* Top action controls: Flip Camera & Status */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                      <button
                        id="qr-flip-camera-btn"
                        type="button"
                        onClick={handleFlipCamera}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-300 border border-teal-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
                        title="Switch Camera (Front / Rear)"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Flip Camera</span>
                      </button>
                    </div>

                    <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-20">
                      <span className="px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-[11px] font-semibold text-teal-200 border border-teal-500/40 shadow-md">
                        Align patient wristband or tag inside frame
                      </span>
                    </div>
                  </>
                )}

                {/* Loading / Starting State */}
                {isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-300 p-6 space-y-3 z-10">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">Opening Camera Feed...</p>
                      <p className="text-[11px] text-slate-400 mt-1">Connecting to camera sensor</p>
                    </div>
                  </div>
                )}

                {/* Inactive or Error State */}
                {!cameraActive && !isCameraStarting && (
                  <div className="p-6 text-center text-slate-400 space-y-3.5 max-w-sm z-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                      {cameraError ? (
                        <CameraOff className="w-6 h-6 text-rose-400" />
                      ) : (
                        <Camera className="w-6 h-6 text-teal-400" />
                      )}
                    </div>

                    {cameraError ? (
                      <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/40 p-3 rounded-xl leading-relaxed">
                        {cameraError}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300">Camera preview is ready to start.</p>
                    )}

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        id="qr-start-camera-btn"
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-colors cursor-pointer"
                      >
                        {cameraError ? 'Retry Camera' : 'Start Camera'}
                      </button>
                      <button
                        id="qr-switch-to-upload-btn"
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      >
                        Upload Photo
                      </button>
                    </div>
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
