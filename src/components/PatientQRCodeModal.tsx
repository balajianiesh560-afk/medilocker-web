import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  Calendar,
  HeartPulse,
} from 'lucide-react';
import { Patient } from '../types';
import { Modal } from './Modal';
import { generateQRCodeDataURL, createPatientQRPayload } from '../utils/qrCode';
import { useToast } from './Toast';

interface PatientQRCodeModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientQRCodeModal: React.FC<PatientQRCodeModalProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!patient || !isOpen) return;

    let mounted = true;
    setIsLoading(true);

    const payload = createPatientQRPayload(patient);
    generateQRCodeDataURL(payload, 320)
      .then((url) => {
        if (mounted) {
          setQrDataUrl(url);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [patient, isOpen]);

  if (!patient) return null;

  const isIdentified = patient.status === 'Identified';

  const handleCopyPayload = () => {
    const payload = createPatientQRPayload(patient);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    showToast('info', 'QR Payload Copied', 'JSON patient data copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `patient-qr-${patient.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('success', 'QR Downloaded', `Saved as patient-qr-${patient.id}.png`);
  };

  const handlePrintWristband = () => {
    const printWindow = window.open('', '_blank', 'width=650,height=450');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Wristband - ${patient.id} - ${patient.fullName}</title>
        <style>
          @page { size: auto; margin: 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            background: #fff;
          }
          .wristband {
            border: 2px dashed #334155;
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 580px;
            margin: 0 auto;
            background: #f8fafc;
          }
          .info { flex: 1; margin-right: 20px; }
          .hospital { font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 0.05em; text-transform: uppercase; }
          .name { font-size: 20px; font-weight: 800; margin: 4px 0 2px 0; }
          .id-badge { display: inline-block; font-family: monospace; font-size: 12px; font-weight: bold; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; }
          .status { display: inline-block; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-left: 6px; }
          .status-id { background: #dcfce7; color: #15803d; }
          .status-unid { background: #ffe4e6; color: #be123c; }
          .meta { font-size: 11px; color: #475569; margin-top: 8px; line-height: 1.4; }
          .qr-box { text-align: center; }
          .qr-img { width: 130px; height: 130px; border-radius: 8px; border: 1px solid #cbd5e1; }
          .qr-label { font-size: 9px; font-family: monospace; color: #64748b; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="wristband">
          <div class="info">
            <div class="hospital">Emergency Trauma Center • Biometric Triage Tag</div>
            <div class="name">${patient.fullName}</div>
            <div>
              <span class="id-badge">${patient.id}</span>
              <span class="status ${isIdentified ? 'status-id' : 'status-unid'}">${patient.status.toUpperCase()}</span>
            </div>
            <div class="meta">
              <strong>Fingerprint Ref:</strong> ${patient.fingerprintRefId}<br/>
              <strong>Blood / Allergies:</strong> ${patient.bloodType || 'Unknown'} | ${patient.allergies || 'NKDA'}<br/>
              <strong>Tagged Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}<br/>
              <strong>Remarks:</strong> ${patient.identificationRemarks || 'None recorded'}
            </div>
          </div>
          <div class="qr-box">
            <img class="qr-img" src="${qrDataUrl}" alt="QR" />
            <div class="qr-label">SCAN TO VERIFY</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Identification QR & Wristband" size="md">
      <div className="space-y-5">
        {/* Wristband Preview Card */}
        <div
          id="printable-wristband-preview"
          className="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 shadow-inner overflow-hidden"
        >
          <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest pointer-events-none">
            Hospital Triage Wristband
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* QR Code Canvas / Image */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                {isLoading ? (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                    <QrCode className="w-8 h-8 animate-pulse text-sky-600" />
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for patient ${patient.id}`}
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-rose-500">
                    QR error
                  </div>
                )}
              </div>
              <span className="font-mono text-[10px] text-slate-500 mt-1 font-semibold">
                SCAN TO VERIFY
              </span>
            </div>

            {/* Patient Clinical Info on Wristband */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-bold text-sky-700 tracking-wider uppercase">
                  MediLocker • Bedside Tag
                </span>
                <h4 className="text-lg font-bold text-slate-900 truncate">{patient.fullName}</h4>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono text-xs font-bold">
                  {patient.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isIdentified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {patient.status}
                </span>
                {patient.bloodType && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    Blood: {patient.bloodType}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Fingerprint className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{patient.fingerprintRefId}</span>
                </div>
                {patient.emergencyNotes && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                    "{patient.emergencyNotes}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specification Notice */}
        <div className="bg-sky-50/60 border border-sky-200/70 rounded-xl p-3 text-xs text-sky-900 flex items-start gap-2.5">
          <QrCode className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Compatible with Hospital Optical Scanners & Mobile Cameras</p>
            <p className="text-sky-700 text-[11px] mt-0.5">
              Contains encoded patient identification payload for instant lookup at triage stations, operating rooms, and ambulance handoffs.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            id="wristband-print-btn"
            type="button"
            onClick={handlePrintWristband}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Wristband</span>
          </button>

          <button
            id="wristband-download-qr-btn"
            type="button"
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download PNG</span>
          </button>

          <button
            id="wristband-copy-payload-btn"
            type="button"
            onClick={handleCopyPayload}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
