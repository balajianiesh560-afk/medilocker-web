import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Patient, EmergencyCase } from '../types';

export interface PatientQRPayload {
  system: 'MediLocker' | 'EmergencyCare-AI';
  version: '1.0';
  id: string;
  name: string;
  status: string;
  ref: string;
  blood?: string;
  allergies?: string;
  issuedAt: string;
}

/**
 * Generates structured JSON payload for hospital wristband / badge QR code
 */
export function createPatientQRPayload(patient: Patient): string {
  const payload: PatientQRPayload = {
    system: 'MediLocker',
    version: '1.0',
    id: patient.id,
    name: patient.fullName,
    status: patient.status,
    ref: patient.fingerprintRefId,
    blood: patient.bloodType || 'Unknown',
    allergies: patient.allergies || 'NKDA',
    issuedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}

/**
 * Generates emergency triage payload for temporary accident cases
 */
export function createEmergencyCaseQRPayload(ec: EmergencyCase): string {
  return JSON.stringify({
    system: 'MediLocker',
    type: 'EMERGENCY_TRIAGE_TAG',
    id: ec.id,
    tempId: ec.temporaryId,
    status: ec.identificationStatus,
    triageLevel: ec.triageLevel || 'Immediate',
    ref: ec.fingerprintRefId,
    dateTime: ec.dateTime,
  });
}

/**
 * Generates a data URL PNG for the given QR content
 */
export async function generateQRCodeDataURL(content: string, size = 260): Promise<string> {
  try {
    return await QRCode.toDataURL(content, {
      width: size,
      margin: 1.5,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    throw err;
  }
}

export interface QRScanResult {
  raw: string;
  patientId?: string;
  emergencyCaseId?: string;
  isEmergencyCareFormat: boolean;
  parsedData?: any;
}

/**
 * Intelligently extracts patient ID or emergency ID from any scanned QR format:
 * - Structured EmergencyCare JSON
 * - Uniform Resource Identifiers (e.g. emergencycare://patient/PID-1042)
 * - Plain ID text (e.g. PID-1042 or EMG-8104)
 * - Text containing a PID pattern
 */
export function parseScannedQRContent(scannedText: string): QRScanResult {
  const clean = scannedText.trim();

  // 1. Check if valid JSON
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      const isEc = parsed.system === 'MediLocker' || parsed.system === 'EmergencyCare-AI';
      const patientId = parsed.id || parsed.patientId;
      const emergencyCaseId = parsed.tempId || parsed.emergencyCaseId;

      return {
        raw: clean,
        patientId: typeof patientId === 'string' ? patientId : undefined,
        emergencyCaseId: typeof emergencyCaseId === 'string' ? emergencyCaseId : undefined,
        isEmergencyCareFormat: isEc,
        parsedData: parsed,
      };
    } catch {
      // Fall through to regex extraction
    }
  }

  // 2. Check for standard Patient ID pattern (PID-XXXX)
  const pidMatch = clean.match(/PID-\d{4,6}/i);
  if (pidMatch) {
    return {
      raw: clean,
      patientId: pidMatch[0].toUpperCase(),
      isEmergencyCareFormat: clean.toLowerCase().includes('medilocker') || clean.toLowerCase().includes('emergencycare'),
    };
  }

  // 3. Check for Emergency Case ID pattern (EMG-XXXX)
  const emgMatch = clean.match(/EMG-\d{4,6}/i);
  if (emgMatch) {
    return {
      raw: clean,
      emergencyCaseId: emgMatch[0].toUpperCase(),
      isEmergencyCareFormat: clean.toLowerCase().includes('medilocker') || clean.toLowerCase().includes('emergencycare'),
    };
  }

  // 4. Return raw string
  return {
    raw: clean,
    isEmergencyCareFormat: false,
  };
}

/**
 * Decodes QR code from an image or video canvas frame using jsQR
 */
export function decodeQRFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    return code ? code.data : null;
  } catch (err) {
    console.error('Error scanning canvas for QR:', err);
    return null;
  }
}
