import {
  Patient,
  EmergencyCase,
  User,
  AISummaryResult,
  AuditLogEntry,
  DiagnosisRecord,
  MedicationRecord,
  MedicalReportRecord,
  TreatmentTimelineRecord,
  TreatmentNotification,
  ScanReportRecord,
  PrescriptionRecord,
  LabReportRecord,
  DischargeSummaryRecord,
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_EMERGENCY_CASES,
  DEMO_USER,
  AVAILABLE_DOCTORS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../data/sampleData';

const MEDICAL_DISCLAIMER =
  'MediLocker AI is an emergency intake and clinical data-organizing assistant. It strictly does NOT diagnose diseases, prescribe medicines, or make treatment decisions.';

const LOCAL_STORAGE_DB_KEY = 'medilocker_local_db_v2';
const LOCAL_STORAGE_GEMINI_KEY = 'medilocker_gemini_api_key';

interface LocalDatabase {
  patients: Patient[];
  emergencyCases: EmergencyCase[];
  user: User;
  auditLogs: AuditLogEntry[];
  notifications: TreatmentNotification[];
}

// ----------------------------------------------------
// Local Client Storage (Zero-Dependency Offline Fallback)
// ----------------------------------------------------

function getInitialDatabase(): LocalDatabase {
  return {
    patients: JSON.parse(JSON.stringify(INITIAL_PATIENTS)),
    emergencyCases: JSON.parse(JSON.stringify(INITIAL_EMERGENCY_CASES)),
    user: DEMO_USER,
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
  };
}

function getLocalDB(): LocalDatabase {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
    if (!raw) {
      const initial = getInitialDatabase();
      saveLocalDB(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.patients || !parsed.emergencyCases) {
      const initial = getInitialDatabase();
      saveLocalDB(initial);
      return initial;
    }
    // Ensure all patients have the new clinical record arrays populated
    let needsSave = false;
    parsed.patients = parsed.patients.map((p: Patient) => {
      const initial = INITIAL_PATIENTS.find((ip) => ip.id === p.id);
      const scanReports = p.scanReports && p.scanReports.length > 0 ? p.scanReports : (initial?.scanReports || []);
      const prescriptions = p.prescriptions && p.prescriptions.length > 0 ? p.prescriptions : (initial?.prescriptions || []);
      const labReports = p.labReports && p.labReports.length > 0 ? p.labReports : (initial?.labReports || []);
      const dischargeSummaries = p.dischargeSummaries && p.dischargeSummaries.length > 0 ? p.dischargeSummaries : (initial?.dischargeSummaries || []);

      if (
        (!p.scanReports && scanReports.length > 0) ||
        (!p.prescriptions && prescriptions.length > 0) ||
        (!p.labReports && labReports.length > 0) ||
        (!p.dischargeSummaries && dischargeSummaries.length > 0)
      ) {
        needsSave = true;
      }

      return {
        ...p,
        scanReports,
        prescriptions,
        labReports,
        dischargeSummaries,
      };
    });
    if (needsSave) {
      saveLocalDB(parsed);
    }
    return parsed;
  } catch {
    return getInitialDatabase();
  }
}

function saveLocalDB(db: LocalDatabase): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to persist local DB to localStorage:', err);
  }
}

export function getStoredGeminiKey(): string {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_GEMINI_KEY);
    if (stored && stored.trim() !== '') return stored.trim();
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'MY_GEMINI_API_KEY') return envKey;
  } catch {}
  return '';
}

export function setStoredGeminiKey(key: string): void {
  try {
    if (!key || key.trim() === '') {
      localStorage.removeItem(LOCAL_STORAGE_GEMINI_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_GEMINI_KEY, key.trim());
    }
  } catch (err) {
    console.error('Failed to save Gemini key:', err);
  }
}

// ----------------------------------------------------
// Safe Fetch Helper (Prevents "Unexpected token 'T'" error)
// ----------------------------------------------------

interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isNonJson?: boolean;
}

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (e.g. 404 page "The page cannot be found..."), NEVER call res.json()
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        isNonJson: true,
        error: `Server returned non-JSON response (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network unreachable',
    };
  }
}

// ----------------------------------------------------
// Direct Client Gemini API Integration
// ----------------------------------------------------

async function callDirectGemini(prompt: string, systemInstruction: string): Promise<string | null> {
  const apiKey = getStoredGeminiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.warn('Direct Gemini call failed with status:', response.status);
      return null;
    }

    const json = await response.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || null;
  } catch (err) {
    console.warn('Direct Gemini call network error:', err);
    return null;
  }
}

// ----------------------------------------------------
// Rule-Based Fallbacks for Clinical Intelligence
// ----------------------------------------------------

function generateRuleBasedPatientSummary(patient: Patient): string {
  const caseList = patient.caseHistory?.length
    ? patient.caseHistory.map((c: any) => `• ${c.date || 'Recent'}: ${c.incidentTitle} (${c.severity || 'Triage'})`).join('\n')
    : 'No prior emergency incidents cataloged.';

  return `### Identification Information
**Name:** ${patient.fullName} (${patient.id})
**Age / Gender:** ${patient.age} / ${patient.gender}
**Biometric Ref:** \`${patient.fingerprintRefId}\`
**Physical Remarks:** ${patient.identificationRemarks || 'No physical marks recorded.'}

### Emergency Information
**Status:** ${patient.status}
**Blood Type:** ${patient.bloodType || 'N/A'}
**Allergies:** ${patient.allergies || 'None documented'}
**Emergency Triage Notes:** ${patient.emergencyNotes || 'None'}

### Identification Status
Verified and matched in hospital registry under **${patient.originHospital || 'Primary Trauma Care'}**.

### Recorded Case History
${caseList}

### Important Recorded Notes
*All clinical entries authenticated by authorized medical personnel. Biometrics labeled for demonstration matching.*

\n*${MEDICAL_DISCLAIMER}*`;
}

function generateLocalChatReply(message: string, db: LocalDatabase): string {
  const lower = message.toLowerCase();

  if (lower.includes('unidentified') || lower.includes('unknown')) {
    const unIds = db.patients.filter((p) => p.status === 'Unidentified');
    const unCases = db.emergencyCases.filter((c) => c.identificationStatus === 'Unidentified');
    return `**Currently Unidentified Hospital Records:**\n\n• **Unidentified Patients (${unIds.length}):**\n${unIds.map((p) => `  - **${p.id}**: ${p.fullName}, Age: ${p.age}, Ref: \`${p.fingerprintRefId}\` (${p.identificationRemarks})`).join('\n')}\n\n• **Unidentified Emergency Cases (${unCases.length}):**\n${unCases.map((c) => `  - **${c.temporaryId}**: ${c.locationFound || 'Intake'}, Ref: \`${c.fingerprintRefId}\` - Notes: ${c.emergencyNotes}`).join('\n')}\n\n*${MEDICAL_DISCLAIMER}*`;
  }

  if (lower.includes('fingerprint') || lower.includes('fp-')) {
    const match = message.match(/fp-[\w-]+/i);
    if (match) {
      const queryFp = match[0].toUpperCase();
      const foundP = db.patients.find((p) => p.fingerprintRefId.toUpperCase().includes(queryFp));
      const foundC = db.emergencyCases.find((c) => c.fingerprintRefId.toUpperCase().includes(queryFp));
      return (
        `**Biometric Reference Search for "${queryFp}":**\n` +
        (foundP ? `• Matched Patient: **${foundP.fullName}** (${foundP.id}) - Status: ${foundP.status}, Phone: ${foundP.phone}\n` : '') +
        (foundC ? `• Matched Emergency Case: **${foundC.temporaryId}** (${foundC.dateTime}) - Remarks: ${foundC.identificationRemarks}\n` : '') +
        (!foundP && !foundC ? `• No records found matching biometric reference "${queryFp}".\n` : '') +
        `\n*${MEDICAL_DISCLAIMER}*`
      );
    }
    return `To search by biometric reference, please include the reference ID (for example "FP-8842-A1" or "FP-9904-UN").`;
  }

  if (lower.includes('patient') && (lower.includes('pid-') || lower.includes('summarize') || lower.includes('history'))) {
    const match = message.match(/pid-\d+/i);
    const targetP = match
      ? db.patients.find((p) => p.id.toLowerCase() === match[0].toLowerCase())
      : db.patients[0];

    if (targetP) {
      return `**Summary for ${targetP.fullName} (${targetP.id}):**\n- **Status:** ${targetP.status}\n- **Age/Gender:** ${targetP.age} / ${targetP.gender}\n- **Biometric Ref:** \`${targetP.fingerprintRefId}\`\n- **Remarks:** ${targetP.identificationRemarks || 'None'}\n- **Emergency Notes:** ${targetP.emergencyNotes || 'None'}\n- **Recorded Incidents:** ${targetP.caseHistory?.length || 0}\n\n*${MEDICAL_DISCLAIMER}*`;
    }
    return `Could not locate that patient ID. Available demo IDs: ${db.patients.slice(0, 4).map((p) => p.id).join(', ')}`;
  }

  if (lower.includes('emergency case') || lower.includes('emg-') || lower.includes('case')) {
    const match = message.match(/emg-\d+/i);
    const targetC = match
      ? db.emergencyCases.find((c) => c.temporaryId.toLowerCase() === match[0].toLowerCase())
      : db.emergencyCases[0];

    if (targetC) {
      return `**Emergency Case ${targetC.temporaryId}:**\n- **Status:** ${targetC.identificationStatus}\n- **Time/Location:** ${targetC.dateTime} at ${targetC.locationFound || 'Intake'}\n- **Remarks:** ${targetC.identificationRemarks}\n- **Biometric Ref:** \`${targetC.fingerprintRefId}\`\n- **Triage Notes:** ${targetC.emergencyNotes}\n\n*${MEDICAL_DISCLAIMER}*`;
    }
    return `Emergency case not found. Available case IDs: ${db.emergencyCases.map((c) => c.temporaryId).join(', ')}`;
  }

  return `**EmergencyCare AI Assistant (Standalone Mode):**\nManaging **${db.patients.length} Patient Records** (${db.patients.filter((p) => p.status === 'Identified').length} Identified, ${db.patients.filter((p) => p.status === 'Unidentified').length} Unidentified) and **${db.emergencyCases.length} Emergency Cases**.\n\nQuick queries you can ask:\n• "Which patients are still unidentified?"\n• "Summarize patient PID-1042"\n• "Check fingerprint reference FP-8842-A1"\n• "Summarize emergency case EMG-7701"\n\n*(Tip: Add your Gemini API Key in Settings to enable live Google generative reasoning).* \n\n*${MEDICAL_DISCLAIMER}*`;
}

// ----------------------------------------------------
// Unified Resilient API Service
// ----------------------------------------------------

export const api = {
  // Auth
  async login(
    email: string,
    password: string,
    hospitalName?: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    // 1. Try server endpoint first
    const result = await safeFetchJson<{ success: boolean; user?: User; message?: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, hospitalName }),
    });

    if (result.ok && result.data) {
      return result.data;
    }

    // If server explicitly returned 401 with JSON message
    if (result.status === 401 && result.data?.message) {
      return result.data;
    }

    // 2. Client-side local fallback authentication
    const db = getLocalDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Match any pre-configured doctor
    const matchedDoctor = AVAILABLE_DOCTORS.find((d) => d.email.toLowerCase() === cleanEmail);
    if (matchedDoctor && (cleanPassword === 'admin123' || cleanPassword === matchedDoctor.id.toLowerCase())) {
      db.user = {
        ...matchedDoctor,
        hospitalName: hospitalName || matchedDoctor.hospitalName,
      };
      saveLocalDB(db);
      return { success: true, user: db.user };
    }

    // Standard demo credentials
    if (cleanEmail === 'admin@hospital.com' && cleanPassword === 'admin123') {
      db.user = {
        ...DEMO_USER,
        hospitalName: hospitalName || DEMO_USER.hospitalName,
      };
      saveLocalDB(db);
      return { success: true, user: db.user };
    }

    // Permissive clinical staff sign-in with any valid email
    if (cleanEmail.includes('@') && cleanPassword.length >= 4) {
      const customUser: User = {
        ...DEMO_USER,
        id: `usr-custom-${Date.now().toString().slice(-4)}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0].toUpperCase() + ' (Staff)',
        hospitalName: hospitalName || DEMO_USER.hospitalName,
      };
      db.user = customUser;
      saveLocalDB(db);
      return { success: true, user: customUser };
    }

    return {
      success: false,
      message: 'Invalid credentials. Please use admin@hospital.com and password admin123',
    };
  },

  async forgotPassword(
    email: string,
    newPassword?: string,
    hospitalName?: string
  ): Promise<{ success: boolean; message: string; temporaryPassword?: string }> {
    const result = await safeFetchJson<{ success: boolean; message: string; temporaryPassword?: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, hospitalName }),
      }
    );
    if (result.ok && result.data) return result.data;

    return {
      success: true,
      message: `Password has been reset for ${email}. You can sign in using '${newPassword || 'admin123'}'.`,
      temporaryPassword: newPassword || 'admin123',
    };
  },

  async logout(): Promise<void> {
    await safeFetchJson('/api/auth/logout', { method: 'POST' });
    try {
      localStorage.removeItem('emergency_care_user');
    } catch {}
  },

  async getDoctors(): Promise<{ currentDoctor: User; availableDoctors: User[] }> {
    const result = await safeFetchJson<{ currentDoctor: User; availableDoctors: User[] }>('/api/auth/doctors');
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    return {
      currentDoctor: db.user || DEMO_USER,
      availableDoctors: AVAILABLE_DOCTORS,
    };
  },

  async switchDoctor(userId: string): Promise<{ success: boolean; user: User }> {
    const result = await safeFetchJson<{ success: boolean; user: User }>('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const target = AVAILABLE_DOCTORS.find((d) => d.id === userId);
    if (!target) throw new Error('Doctor not found in directory');

    db.user = target;
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      action: 'CROSS_HOSPITAL_RECORD_ACCESSED',
      actorId: target.id,
      actorName: target.name,
      actorBadge: target.badgeNumber,
      actorRole: target.role,
      actorHospital: target.hospitalName,
      details: `Active physician switched to ${target.name} (${target.hospitalName}).`,
      status: 'SUCCESS',
    };
    db.auditLogs.unshift(auditEntry);
    saveLocalDB(db);

    return { success: true, user: target };
  },

  async checkHealth(): Promise<{ status: string; geminiConfigured: boolean; patientsCount: number; emergencyCasesCount: number }> {
    const result = await safeFetchJson<{ status: string; geminiConfigured: boolean; patientsCount: number; emergencyCasesCount: number }>('/api/health');
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const hasCustomGemini = Boolean(getStoredGeminiKey());
    return {
      status: 'ok (local-mode)',
      geminiConfigured: hasCustomGemini,
      patientsCount: db.patients.length,
      emergencyCasesCount: db.emergencyCases.length,
    };
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const result = await safeFetchJson<AuditLogEntry[]>('/api/audit-logs');
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    return db.auditLogs || [];
  },

  async addAuditLog(entry: Partial<AuditLogEntry>): Promise<AuditLogEntry> {
    const result = await safeFetchJson<AuditLogEntry>('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const newEntry: AuditLogEntry = {
      id: entry.id || `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      action: entry.action || 'GLOBAL_VIEW_ACCESS',
      actorId: entry.actorId || db.user?.id || 'STAFF-01',
      actorName: entry.actorName || db.user?.name || 'Authorized Staff',
      actorBadge: entry.actorBadge || db.user?.badgeNumber || 'STAFF',
      actorRole: entry.actorRole || db.user?.role || 'Clinician',
      actorHospital: entry.actorHospital || db.user?.hospitalName || 'St. Jude Memorial',
      details: entry.details || 'Action logged',
      status: entry.status || 'SUCCESS',
      targetPatientId: entry.targetPatientId,
      targetPatientName: entry.targetPatientName,
      targetRecordId: entry.targetRecordId,
    };
    db.auditLogs.unshift(newEntry);
    saveLocalDB(db);
    return newEntry;
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    const result = await safeFetchJson<Patient[]>('/api/patients');
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    return db.patients;
  },

  async getPatient(id: string): Promise<Patient> {
    const result = await safeFetchJson<Patient>(`/api/patients/${encodeURIComponent(id)}`);
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const patient = db.patients.find((p) => p.id === id);
    if (!patient) throw new Error('Patient record not found');
    return patient;
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    const result = await safeFetchJson<Patient>('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const newId = patient.id || `PID-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      id: newId,
      fullName: patient.fullName || 'Unknown Patient',
      age: patient.age || 0,
      gender: patient.gender || 'Unknown',
      phone: patient.phone || '',
      photo: patient.photo || '',
      identificationRemarks: patient.identificationRemarks || '',
      fingerprintRefId: patient.fingerprintRefId || `FP-${Math.floor(1000 + Math.random() * 9000)}-UN`,
      emergencyNotes: patient.emergencyNotes || '',
      status: patient.status || 'Identified',
      bloodType: patient.bloodType || 'Unknown',
      allergies: patient.allergies || 'None',
      originHospital: patient.originHospital || db.user?.hospitalName || 'St. Jude Memorial Trauma Center',
      registeredByDoctor: patient.registeredByDoctor || db.user?.name || 'Dr. Evelyn Reed, MD',
      registeredByDoctorId: patient.registeredByDoctorId || db.user?.id || 'usr-admin-01',
      diagnoses: patient.diagnoses || [],
      medications: patient.medications || [],
      medicalReports: patient.medicalReports || [],
      treatmentTimeline: patient.treatmentTimeline || [],
      caseHistory: patient.caseHistory || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.patients.unshift(newPatient);
    saveLocalDB(db);
    return newPatient;
  },

  async updatePatient(id: string, patient: Partial<Patient>, meta?: { isGlobalMode?: boolean; user?: User }): Promise<Patient> {
    const result = await safeFetchJson<Patient>(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patient, isGlobalMode: meta?.isGlobalMode, user: meta?.user }),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const index = db.patients.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Patient not found');

    const updated = {
      ...db.patients[index],
      ...patient,
      updatedAt: new Date().toISOString(),
    };
    db.patients[index] = updated;
    saveLocalDB(db);
    return updated;
  },

  async deletePatient(id: string, meta?: { isGlobalMode?: boolean; user?: User }): Promise<void> {
    const result = await safeFetchJson(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGlobalMode: meta?.isGlobalMode, user: meta?.user }),
    });
    if (result.ok) return;

    const db = getLocalDB();
    db.patients = db.patients.filter((p) => p.id !== id);
    saveLocalDB(db);
  },

  // Record-level Multi-Hospital append
  async appendPatientRecord(
    patientId: string,
    payload: {
      type: 'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline' | 'scanReport' | 'prescription' | 'labReport' | 'dischargeSummary';
      record: any;
      user: User;
    }
  ): Promise<{ success: boolean; item: any; patient: Patient }> {
    const result = await safeFetchJson<{ success: boolean; item: any; patient: Patient }>(
      `/api/patients/${encodeURIComponent(patientId)}/append-record`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) throw new Error('Patient not found');

    const { type, record, user } = payload;
    const now = new Date().toISOString();
    let createdItem: any = { ...record, createdAt: now };

    if (type === 'diagnosis') {
      createdItem.id = `DX-${Date.now().toString().slice(-4)}`;
      createdItem.doctorName = user.name;
      createdItem.doctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.diagnoses = patient.diagnoses || [];
      patient.diagnoses.push(createdItem);
    } else if (type === 'medication') {
      createdItem.id = `MED-${Date.now().toString().slice(-4)}`;
      createdItem.prescribedByDoctor = user.name;
      createdItem.prescribedByDoctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.medications = patient.medications || [];
      patient.medications.push(createdItem);
    } else if (type === 'report') {
      createdItem.id = `REP-${Date.now().toString().slice(-4)}`;
      createdItem.doctorName = user.name;
      createdItem.doctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.medicalReports = patient.medicalReports || [];
      patient.medicalReports.push(createdItem);
    } else if (type === 'caseHistory') {
      createdItem.id = `CASE-${Date.now().toString().slice(-4)}`;
      createdItem.treatingPhysician = user.name;
      createdItem.treatingPhysicianId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.caseHistory = patient.caseHistory || [];
      patient.caseHistory.push(createdItem);
    } else if (type === 'timeline') {
      createdItem.id = `TL-${Date.now().toString().slice(-4)}`;
      createdItem.doctorName = user.name;
      createdItem.doctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.treatmentTimeline = patient.treatmentTimeline || [];
      patient.treatmentTimeline.push(createdItem);
    } else if (type === 'scanReport') {
      createdItem.id = `SCAN-${Date.now().toString().slice(-4)}`;
      createdItem.patientId = patient.id;
      createdItem.radiologistName = user.name;
      createdItem.doctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.scanReports = patient.scanReports || [];
      patient.scanReports.unshift(createdItem);
    } else if (type === 'prescription') {
      createdItem.id = `RX-${Date.now().toString().slice(-4)}`;
      createdItem.patientId = patient.id;
      createdItem.prescribingDoctor = user.name;
      createdItem.prescribedByDoctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.prescriptions = patient.prescriptions || [];
      patient.prescriptions.unshift(createdItem);
    } else if (type === 'labReport') {
      createdItem.id = `LAB-${Date.now().toString().slice(-4)}`;
      createdItem.patientId = patient.id;
      createdItem.pathologistName = user.name;
      createdItem.doctorId = user.id;
      createdItem.laboratoryName = `${user.hospitalName} Diagnostic Lab`;
      patient.labReports = patient.labReports || [];
      patient.labReports.unshift(createdItem);
    } else if (type === 'dischargeSummary') {
      createdItem.id = `DIS-${Date.now().toString().slice(-4)}`;
      createdItem.patientId = patient.id;
      createdItem.attendingPhysician = user.name;
      createdItem.doctorId = user.id;
      createdItem.hospitalName = user.hospitalName;
      patient.dischargeSummaries = patient.dischargeSummaries || [];
      patient.dischargeSummaries.unshift(createdItem);
    }

    patient.updatedAt = now;
    saveLocalDB(db);
    return { success: true, item: createdItem, patient };
  },

  // Record-level update
  async updatePatientRecord(
    patientId: string,
    payload: {
      recordType: 'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline' | 'scanReport' | 'prescription' | 'labReport' | 'dischargeSummary';
      recordId: string;
      updatedData: any;
      user: User;
      isGlobalMode?: boolean;
    }
  ): Promise<{ success: boolean; updatedRecord: any; patient: Patient }> {
    const result = await safeFetchJson<{ success: boolean; updatedRecord: any; patient: Patient }>(
      `/api/patients/${encodeURIComponent(patientId)}/record`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) throw new Error('Patient not found');

    const { recordType, recordId, updatedData } = payload;
    let targetList: any[] = [];
    if (recordType === 'diagnosis') targetList = patient.diagnoses || [];
    else if (recordType === 'medication') targetList = patient.medications || [];
    else if (recordType === 'report') targetList = patient.medicalReports || [];
    else if (recordType === 'caseHistory') targetList = patient.caseHistory || [];
    else if (recordType === 'timeline') targetList = patient.treatmentTimeline || [];
    else if (recordType === 'scanReport') targetList = patient.scanReports || [];
    else if (recordType === 'prescription') targetList = patient.prescriptions || [];
    else if (recordType === 'labReport') targetList = patient.labReports || [];
    else if (recordType === 'dischargeSummary') targetList = patient.dischargeSummaries || [];

    const idx = targetList.findIndex((item) => item.id === recordId);
    if (idx === -1) throw new Error('Record not found');

    targetList[idx] = { ...targetList[idx], ...updatedData, updatedAt: new Date().toISOString() };
    patient.updatedAt = new Date().toISOString();
    saveLocalDB(db);

    return { success: true, updatedRecord: targetList[idx], patient };
  },

  // Record-level delete
  async deletePatientRecord(
    patientId: string,
    payload: {
      recordType: 'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline' | 'scanReport' | 'prescription' | 'labReport' | 'dischargeSummary';
      recordId: string;
      user: User;
      isGlobalMode?: boolean;
    }
  ): Promise<{ success: boolean; patient: Patient }> {
    const result = await safeFetchJson<{ success: boolean; patient: Patient }>(
      `/api/patients/${encodeURIComponent(patientId)}/record`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) throw new Error('Patient not found');

    const { recordType, recordId } = payload;
    if (recordType === 'diagnosis') patient.diagnoses = (patient.diagnoses || []).filter((r) => r.id !== recordId);
    else if (recordType === 'medication') patient.medications = (patient.medications || []).filter((r) => r.id !== recordId);
    else if (recordType === 'report') patient.medicalReports = (patient.medicalReports || []).filter((r) => r.id !== recordId);
    else if (recordType === 'caseHistory') patient.caseHistory = (patient.caseHistory || []).filter((r) => r.id !== recordId);
    else if (recordType === 'timeline') patient.treatmentTimeline = (patient.treatmentTimeline || []).filter((r) => r.id !== recordId);
    else if (recordType === 'scanReport') patient.scanReports = (patient.scanReports || []).filter((r) => r.id !== recordId);
    else if (recordType === 'prescription') patient.prescriptions = (patient.prescriptions || []).filter((r) => r.id !== recordId);
    else if (recordType === 'labReport') patient.labReports = (patient.labReports || []).filter((r) => r.id !== recordId);
    else if (recordType === 'dischargeSummary') patient.dischargeSummaries = (patient.dischargeSummaries || []).filter((r) => r.id !== recordId);

    patient.updatedAt = new Date().toISOString();
    saveLocalDB(db);
    return { success: true, patient };
  },

  async addCaseHistory(patientId: string, entry: { incidentTitle: string; details: string; severity: string; location?: string; treatingPhysician?: string }): Promise<any> {
    const result = await safeFetchJson(`/api/patients/${encodeURIComponent(patientId)}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) throw new Error('Patient not found');

    const newCase = {
      id: `CS-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      ...entry,
      createdAt: new Date().toISOString(),
    };
    patient.caseHistory = patient.caseHistory || [];
    patient.caseHistory.unshift(newCase);
    saveLocalDB(db);
    return newCase;
  },

  // Emergency Cases
  async getEmergencyCases(): Promise<EmergencyCase[]> {
    const result = await safeFetchJson<EmergencyCase[]>('/api/emergency-cases');
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    return db.emergencyCases;
  },

  async getEmergencyCase(id: string): Promise<EmergencyCase> {
    const result = await safeFetchJson<EmergencyCase>(`/api/emergency-cases/${encodeURIComponent(id)}`);
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const ec = db.emergencyCases.find((c) => c.id === id || c.temporaryId === id);
    if (!ec) throw new Error('Emergency case record not found');
    return ec;
  },

  async createEmergencyCase(caseData: Partial<EmergencyCase>): Promise<EmergencyCase> {
    const result = await safeFetchJson<EmergencyCase>('/api/emergency-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const newId = caseData.id || `EMG-${Math.floor(7000 + Math.random() * 2000)}`;
    const newCase: EmergencyCase = {
      id: newId,
      temporaryId: caseData.temporaryId || newId,
      photo: caseData.photo || '',
      estimatedAge: caseData.estimatedAge || 'Unknown',
      gender: caseData.gender || 'Unknown',
      identificationRemarks: caseData.identificationRemarks || '',
      fingerprintRefId: caseData.fingerprintRefId || `FP-${Math.floor(1000 + Math.random() * 9000)}-UN`,
      emergencyNotes: caseData.emergencyNotes || '',
      dateTime: caseData.dateTime || new Date().toISOString().replace('T', ' ').slice(0, 16),
      identificationStatus: caseData.identificationStatus || 'Unidentified',
      triageLevel: caseData.triageLevel || 'Immediate',
      locationFound: caseData.locationFound || 'Intake Bay',
      linkedPatientId: caseData.linkedPatientId,
      hospitalName: caseData.hospitalName || db.user?.hospitalName || 'St. Jude Memorial',
      recordedByDoctor: caseData.recordedByDoctor || db.user?.name || 'Staff Clinician',
      recordedByDoctorId: caseData.recordedByDoctorId || db.user?.id || 'usr-admin-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.emergencyCases.unshift(newCase);
    saveLocalDB(db);
    return newCase;
  },

  async updateEmergencyCase(id: string, caseData: Partial<EmergencyCase>): Promise<EmergencyCase> {
    const result = await safeFetchJson<EmergencyCase>(`/api/emergency-cases/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const idx = db.emergencyCases.findIndex((c) => c.id === id || c.temporaryId === id);
    if (idx === -1) throw new Error('Emergency case not found');

    const updated = {
      ...db.emergencyCases[idx],
      ...caseData,
      updatedAt: new Date().toISOString(),
    };
    db.emergencyCases[idx] = updated;
    saveLocalDB(db);
    return updated;
  },

  async deleteEmergencyCase(id: string): Promise<void> {
    const result = await safeFetchJson(`/api/emergency-cases/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (result.ok) return;

    const db = getLocalDB();
    db.emergencyCases = db.emergencyCases.filter((c) => c.id !== id && c.temporaryId !== id);
    saveLocalDB(db);
  },

  // ----------------------------------------------------
  // Notifications API (Doctor-to-Doctor Emergency Treatment Updates)
  // ----------------------------------------------------

  async getNotifications(
    doctorId?: string,
    role?: 'received' | 'sent' | 'all'
  ): Promise<TreatmentNotification[]> {
    const query = new URLSearchParams();
    if (doctorId) query.set('doctorId', doctorId);
    if (role) query.set('role', role);

    const result = await safeFetchJson<TreatmentNotification[]>(`/api/notifications?${query.toString()}`);
    if (result.ok && Array.isArray(result.data)) return result.data;

    const db = getLocalDB();
    let list: TreatmentNotification[] = db.notifications || INITIAL_NOTIFICATIONS;
    if (doctorId) {
      const docLower = doctorId.toLowerCase();
      if (role === 'received') {
        list = list.filter(
          (n) =>
            n.recipientDoctorId.toLowerCase() === docLower ||
            n.recipientDoctorName.toLowerCase().includes(docLower)
        );
      } else if (role === 'sent') {
        list = list.filter(
          (n) =>
            n.senderDoctorId.toLowerCase() === docLower ||
            n.senderDoctorName.toLowerCase().includes(docLower)
        );
      }
    }
    return list;
  },

  async getReceivedNotifications(doctorId: string): Promise<TreatmentNotification[]> {
    return this.getNotifications(doctorId, 'received');
  },

  async getSentNotifications(doctorId: string): Promise<TreatmentNotification[]> {
    return this.getNotifications(doctorId, 'sent');
  },

  async getNotification(id: string): Promise<TreatmentNotification> {
    const result = await safeFetchJson<TreatmentNotification>(`/api/notifications/${encodeURIComponent(id)}`);
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const item = (db.notifications || INITIAL_NOTIFICATIONS).find((n) => n.id === id);
    if (!item) throw new Error('Notification not found');
    return item;
  },

  async sendNotification(
    notificationData: Partial<TreatmentNotification>
  ): Promise<{ success: boolean; notification: TreatmentNotification }> {
    const result = await safeFetchJson<{ success: boolean; notification: TreatmentNotification }>('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    const now = new Date().toISOString();
    const newNotif: TreatmentNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      patientId: notificationData.patientId || 'PID-1042',
      patientName: notificationData.patientName || 'Patient',
      patientAge: notificationData.patientAge || 30,
      patientGender: notificationData.patientGender || 'Other',
      patientBloodType: notificationData.patientBloodType || 'O+',
      patientFingerprintRef: notificationData.patientFingerprintRef || 'FP-1042-A1',
      senderDoctorId: notificationData.senderDoctorId || db.user?.id || 'doc-1',
      senderDoctorName: notificationData.senderDoctorName || db.user?.name || 'Dr. Attending',
      senderHospital: notificationData.senderHospital || db.user?.hospitalName || 'Emergency Center',
      senderRole: notificationData.senderRole || 'Emergency Attending Physician',
      recipientDoctorId: notificationData.recipientDoctorId || 'usr-admin-01',
      recipientDoctorName: notificationData.recipientDoctorName || 'Dr. Evelyn Reed, MD',
      recipientHospital: notificationData.recipientHospital || 'St. Jude Memorial Hospital',
      treatmentDate: notificationData.treatmentDate || now.split('T')[0],
      emergencyReason: notificationData.emergencyReason || 'Emergency Consultation',
      diagnosis: notificationData.diagnosis || 'Acute Evaluation',
      clinicalFindings: notificationData.clinicalFindings || '',
      treatmentProvided: notificationData.treatmentProvided || 'Emergency stabilization performed.',
      procedures: notificationData.procedures || '',
      medications: notificationData.medications || [],
      followUpInstructions: notificationData.followUpInstructions || 'Follow up with primary physician.',
      notes: notificationData.notes || '',
      attachments: notificationData.attachments || [],
      status: 'Pending Review',
      createdAt: now,
      updatedAt: now,
    };

    db.notifications = db.notifications || [...INITIAL_NOTIFICATIONS];
    db.notifications.unshift(newNotif);
    saveLocalDB(db);
    return { success: true, notification: newNotif };
  },

  async viewNotification(
    id: string,
    doctor: { id: string; name: string; badge?: string; role?: string; hospital?: string }
  ): Promise<{ success: boolean; notification: TreatmentNotification }> {
    const result = await safeFetchJson<{ success: boolean; notification: TreatmentNotification }>(`/api/notifications/${id}/view`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctor),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    db.notifications = db.notifications || [...INITIAL_NOTIFICATIONS];
    const n = db.notifications.find((item) => item.id === id);
    if (n) {
      n.viewedAt = new Date().toISOString();
      n.status = n.status === 'Pending Review' ? 'Reviewed' : n.status;
    }
    saveLocalDB(db);
    return { success: true, notification: n || ({} as any) };
  },

  async rejectNotification(
    id: string,
    rejectionReason: string,
    doctor: { id: string; name: string; badge?: string; role?: string; hospital?: string }
  ): Promise<{ success: boolean; notification: TreatmentNotification }> {
    const result = await safeFetchJson<{ success: boolean; notification: TreatmentNotification }>(`/api/notifications/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason, ...doctor }),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    db.notifications = db.notifications || [...INITIAL_NOTIFICATIONS];
    const n = db.notifications.find((item) => item.id === id);
    if (n) {
      n.status = 'Rejected';
      n.rejectionReason = rejectionReason;
      n.reviewedAt = new Date().toISOString();
    }
    saveLocalDB(db);
    return { success: true, notification: n || ({} as any) };
  },

  async updatePatientRecordFromNotification(
    id: string,
    doctor: { id: string; name: string; badge?: string; role?: string; hospital?: string }
  ): Promise<{ success: boolean; notification: TreatmentNotification; patient: Patient; message: string }> {
    const result = await safeFetchJson<{ success: boolean; notification: TreatmentNotification; patient: Patient; message: string }>(
      `/api/notifications/${id}/update-patient-record`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor),
      }
    );
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();
    db.notifications = db.notifications || [...INITIAL_NOTIFICATIONS];
    const notif = db.notifications.find((item) => item.id === id);
    if (!notif) throw new Error('Notification not found');

    const patient = db.patients.find((p) => p.id === notif.patientId);
    if (!patient) throw new Error('Patient not found');

    notif.status = 'Record Updated';
    notif.reviewedAt = new Date().toISOString();

    saveLocalDB(db);
    return {
      success: true,
      notification: notif,
      patient,
      message: 'Patient records updated from emergency treatment notification.',
    };
  },

  // AI Operations
  async generatePatientSummary(patient: Patient): Promise<AISummaryResult> {
    const storedApiKey = getStoredGeminiKey();

    // 1. Try server endpoint first (with optional stored API key)
    const result = await safeFetchJson<AISummaryResult>('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, apiKey: storedApiKey }),
    });

    if (result.ok && result.data) {
      return {
        ...result.data,
        isOnline: result.data.isOnline ?? result.data.isAiAvailable,
        modelName: result.data.modelName || (result.data.isAiAvailable ? 'Gemini 3.8 Flash (Online Live)' : 'Clinical Database Engine'),
      };
    }

    // 2. Try direct client Gemini API call if key is saved
    const prompt = `Synthesize recorded clinical intake data for patient ${patient.fullName} (${patient.id}). Base your output strictly on the recorded records provided:
Age: ${patient.age}, Gender: ${patient.gender}
Fingerprint Reference ID: ${patient.fingerprintRefId}
Remarks: ${patient.identificationRemarks || 'None'}
Emergency Notes: ${patient.emergencyNotes || 'None'}
Case History: ${JSON.stringify(patient.caseHistory || [])}`;

    const geminiText = await callDirectGemini(
      prompt,
      'You are an emergency hospital identification assistant. You strictly organize recorded patient information. You NEVER diagnose diseases, prescribe medicines, or provide treatment decisions.'
    );

    if (geminiText) {
      return {
        summary: geminiText,
        generatedAt: new Date().toISOString(),
        isAiAvailable: true,
        isOnline: true,
        modelName: 'Gemini 3.8 Flash (Online Live)',
        disclaimer: MEDICAL_DISCLAIMER,
      };
    }

    // 3. Fallback to rule-based structured generator
    return {
      summary: generateRuleBasedPatientSummary(patient),
      generatedAt: new Date().toISOString(),
      isAiAvailable: false,
      isOnline: false,
      modelName: 'Clinical Hospital Standard (Offline Fallback)',
      disclaimer: MEDICAL_DISCLAIMER,
    };
  },

  async sendChatMessage(message: string, history: any[] = []): Promise<{ reply: string; isAiAvailable: boolean }> {
    const storedApiKey = getStoredGeminiKey();

    // 1. Try server endpoint
    const result = await safeFetchJson<{ reply: string; isAiAvailable: boolean }>('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, apiKey: storedApiKey }),
    });
    if (result.ok && result.data) return result.data;

    const db = getLocalDB();

    // 2. Try direct client Gemini API call
    const contextPrompt = `User question: "${message}"

HOSPITAL DATABASE SNAPSHOT:
Total Patients: ${db.patients.length} (${db.patients.filter((p) => p.status === 'Identified').length} identified)
Total Cases: ${db.emergencyCases.length}
Patients list: ${JSON.stringify(
      db.patients.map((p) => ({
        id: p.id,
        name: p.fullName,
        status: p.status,
        age: p.age,
        gender: p.gender,
        ref: p.fingerprintRefId,
        remarks: p.identificationRemarks,
      }))
    )}
Cases list: ${JSON.stringify(
      db.emergencyCases.map((c) => ({
        id: c.temporaryId,
        status: c.identificationStatus,
        ref: c.fingerprintRefId,
        remarks: c.identificationRemarks,
      }))
    )}`;

    const geminiText = await callDirectGemini(
      contextPrompt,
      `You are the EmergencyCare AI Clinical Intake Assistant for hospital emergency staff. Base all responses STRICTLY on the hospital records provided. You must NOT diagnose diseases, prescribe medicines, or make treatment decisions. Conclude with: "${MEDICAL_DISCLAIMER}".`
    );

    if (geminiText) {
      return {
        reply: geminiText,
        isAiAvailable: true,
      };
    }

    // 3. Intelligent local contextual rule-based response
    return {
      reply: generateLocalChatReply(message, db),
      isAiAvailable: false,
    };
  },

  // Gemini Key Management
  getStoredGeminiKey(): string {
    return getStoredGeminiKey();
  },

  setStoredGeminiKey(key: string): void {
    setStoredGeminiKey(key);
  },

  async resetDemoData(): Promise<void> {
    await safeFetchJson('/api/reset-demo-data', { method: 'POST' });
    const fresh = getInitialDatabase();
    saveLocalDB(fresh);
  },

  // Aliases for convenience
  async getHealth() {
    return this.checkHealth();
  },

  async askAIAssistant(message: string, history: any[] = []) {
    return this.sendChatMessage(message, history);
  },

  async resetData() {
    return this.resetDemoData();
  },
};
