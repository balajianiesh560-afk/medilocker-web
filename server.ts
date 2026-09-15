import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  INITIAL_PATIENTS,
  INITIAL_EMERGENCY_CASES,
  DEMO_USER,
  AVAILABLE_DOCTORS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './src/data/sampleData';
import {
  Patient,
  EmergencyCase,
  User,
  AuditLogEntry,
  DiagnosisRecord,
  MedicationRecord,
  MedicalReportRecord,
  TreatmentTimelineRecord,
  CaseHistoryEntry,
  TreatmentNotification,
} from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Persistence file location
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  patients: Patient[];
  emergencyCases: EmergencyCase[];
  user: User;
  auditLogs: AuditLogEntry[];
  notifications: TreatmentNotification[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.patients && parsed.emergencyCases) {
        // Ensure all sample patients are enriched with diagnoses/medications/reports
        const mergedPatients = [...parsed.patients];

        for (const initial of INITIAL_PATIENTS) {
          const idx = mergedPatients.findIndex((p: Patient) => p.id === initial.id);
          if (idx !== -1) {
            mergedPatients[idx] = {
              ...initial,
              ...mergedPatients[idx],
              originHospital: mergedPatients[idx].originHospital || initial.originHospital,
              registeredByDoctor: mergedPatients[idx].registeredByDoctor || initial.registeredByDoctor,
              registeredByDoctorId: mergedPatients[idx].registeredByDoctorId || initial.registeredByDoctorId,
              diagnoses:
                mergedPatients[idx].diagnoses && mergedPatients[idx].diagnoses.length > 0
                  ? mergedPatients[idx].diagnoses
                  : initial.diagnoses,
              medications:
                mergedPatients[idx].medications && mergedPatients[idx].medications.length > 0
                  ? mergedPatients[idx].medications
                  : initial.medications,
              medicalReports:
                mergedPatients[idx].medicalReports && mergedPatients[idx].medicalReports.length > 0
                  ? mergedPatients[idx].medicalReports
                  : initial.medicalReports,
              treatmentTimeline:
                mergedPatients[idx].treatmentTimeline && mergedPatients[idx].treatmentTimeline.length > 0
                  ? mergedPatients[idx].treatmentTimeline
                  : initial.treatmentTimeline,
            };
          } else {
            mergedPatients.push(initial);
          }
        }

        const data: DatabaseSchema = {
          patients: mergedPatients,
          emergencyCases: parsed.emergencyCases,
          user: parsed.user || DEMO_USER,
          auditLogs:
            parsed.auditLogs && parsed.auditLogs.length > 0
              ? parsed.auditLogs
              : INITIAL_AUDIT_LOGS,
          notifications:
            parsed.notifications && parsed.notifications.length > 0
              ? parsed.notifications
              : INITIAL_NOTIFICATIONS,
        };
        saveDatabase(data);
        return data;
      }
    }
  } catch (err) {
    console.error('Failed to read db.json, falling back to defaults:', err);
  }
  // Initialize with sample data
  const initialData: DatabaseSchema = {
    patients: INITIAL_PATIENTS,
    emergencyCases: INITIAL_EMERGENCY_CASES,
    user: DEMO_USER,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist db.json:', err);
  }
}

let db = loadDatabase();

// Lazy Gemini AI initialization
function getAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health / Status endpoint
app.get('/api/health', (_req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    geminiConfigured: hasGeminiKey,
    patientsCount: db.patients.length,
    emergencyCasesCount: db.emergencyCases.length,
  });
});

// In-memory / persisted custom password overrides for staff accounts
const customCredentials: Record<string, string> = {};

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password, hospitalName } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const cleanHospital = (hospitalName || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({
      success: false,
      message: 'Both email and password are required.',
    });
  }

  // Check custom reset passwords first
  const customPass = customCredentials[cleanEmail];
  const isCustomPassMatch = customPass && customPass === cleanPassword;

  // Check if matches any available doctor
  const matchedDoctor = AVAILABLE_DOCTORS.find(
    (d) => d.email.toLowerCase() === cleanEmail || d.id.toLowerCase() === cleanEmail
  );

  if (
    matchedDoctor &&
    (cleanPassword === 'admin123' ||
      cleanPassword === matchedDoctor.id.toLowerCase() ||
      isCustomPassMatch ||
      cleanPassword.length >= 4)
  ) {
    const activeUser: User = {
      ...matchedDoctor,
      hospitalName: cleanHospital || matchedDoctor.hospitalName,
    };
    db.user = activeUser;
    saveDatabase(db);
    return res.json({
      success: true,
      user: db.user,
      token: `session-${matchedDoctor.id}-${Date.now()}`,
    });
  }

  // Default demo login credentials
  if (
    (cleanEmail === 'admin@hospital.com' || cleanEmail === 'admin') &&
    (cleanPassword === 'admin123' || isCustomPassMatch)
  ) {
    const activeUser: User = {
      ...DEMO_USER,
      hospitalName: cleanHospital || DEMO_USER.hospitalName,
    };
    db.user = activeUser;
    saveDatabase(db);
    return res.json({
      success: true,
      user: db.user,
      token: 'session-demo-token-9981',
    });
  }

  // Also allow fallback if valid email / staff identifier
  if (
    (cleanEmail.includes('@') || cleanEmail.length >= 3) &&
    (cleanPassword.length >= 4 || isCustomPassMatch)
  ) {
    const userRole = 'Emergency Care Clinician';
    const staffName = cleanEmail.includes('@')
      ? `${cleanEmail.split('@')[0].toUpperCase()} (Staff)`
      : `${cleanEmail.toUpperCase()} (Staff)`;

    db.user = {
      id: `usr-custom-${Date.now()}`,
      email: cleanEmail,
      name: staffName,
      role: userRole,
      badgeNumber: `STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
      hospitalUnit: 'Emergency Medicine Intake',
      hospitalName: cleanHospital || 'Metropolitan General Hospital',
    };
    saveDatabase(db);
    return res.json({
      success: true,
      user: db.user,
      token: 'session-token-' + Date.now(),
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. You can use admin@hospital.com / admin123 or reset your password below.',
  });
});

// Forgot / Reset Password Endpoint
app.post('/api/auth/forgot-password', (req, res) => {
  const { email, newPassword, hospitalName } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (newPassword || '').trim();

  if (!cleanEmail) {
    return res.status(400).json({
      success: false,
      message: 'Staff email address is required for password recovery.',
    });
  }

  const resetPassword = cleanPass || 'admin123';
  customCredentials[cleanEmail] = resetPassword;

  // Also update db.user if matching
  if (db.user && db.user.email.toLowerCase() === cleanEmail && hospitalName) {
    db.user.hospitalName = hospitalName.trim();
    saveDatabase(db);
  }

  return res.json({
    success: true,
    message: `Password has been reset successfully for ${cleanEmail}. You can now sign in with your updated credentials.`,
    temporaryPassword: resetPassword,
  });
});

app.get('/api/auth/me', (_req, res) => {
  res.json({ user: db.user });
});

app.get('/api/auth/doctors', (_req, res) => {
  res.json({
    currentDoctor: db.user,
    availableDoctors: AVAILABLE_DOCTORS,
  });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  const target = AVAILABLE_DOCTORS.find((d) => d.id === userId);
  if (!target) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  db.user = target;
  saveDatabase(db);

  // Log user switch for clinical session tracking
  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: new Date().toISOString(),
    action: 'CROSS_HOSPITAL_RECORD_ACCESSED',
    actorId: target.id,
    actorName: target.name,
    actorBadge: target.badgeNumber,
    actorRole: target.role,
    actorHospital: target.hospitalName,
    details: `Active clinician switched to ${target.name} (${target.hospitalName}). Session context updated.`,
    status: 'SUCCESS',
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(auditEntry);
  saveDatabase(db);

  res.json({ success: true, user: db.user });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ---------------- Audit Logs API ----------------

app.get('/api/audit-logs', (_req, res) => {
  res.json(db.auditLogs || []);
});

app.post('/api/audit-logs', (req, res) => {
  const entry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: new Date().toISOString(),
    ...req.body,
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDatabase(db);
  res.status(201).json(entry);
});

// ---------------- Notifications API (Doctor-to-Doctor Emergency Treatment) ----------------

app.get('/api/notifications', (req, res) => {
  const { doctorId, role } = req.query;
  let list = db.notifications || [];

  if (doctorId && typeof doctorId === 'string') {
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
    } else {
      list = list.filter(
        (n) =>
          n.recipientDoctorId.toLowerCase() === docLower ||
          n.recipientDoctorName.toLowerCase().includes(docLower) ||
          n.senderDoctorId.toLowerCase() === docLower ||
          n.senderDoctorName.toLowerCase().includes(docLower)
      );
    }
  }

  res.json(list);
});

app.get('/api/notifications/received/:doctorId', (req, res) => {
  const docLower = req.params.doctorId.toLowerCase();
  const list = (db.notifications || []).filter(
    (n) =>
      n.recipientDoctorId.toLowerCase() === docLower ||
      n.recipientDoctorName.toLowerCase().includes(docLower)
  );
  res.json(list);
});

app.get('/api/notifications/sent/:doctorId', (req, res) => {
  const docLower = req.params.doctorId.toLowerCase();
  const list = (db.notifications || []).filter(
    (n) =>
      n.senderDoctorId.toLowerCase() === docLower ||
      n.senderDoctorName.toLowerCase().includes(docLower)
  );
  res.json(list);
});

app.get('/api/notifications/:id', (req, res) => {
  const notif = (db.notifications || []).find(
    (n) => n.id.toLowerCase() === req.params.id.toLowerCase()
  );
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json(notif);
});

app.post('/api/notifications', (req, res) => {
  const body = req.body;
  const now = new Date().toISOString();
  const notifId = body.id || `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`;

  const newNotif: TreatmentNotification = {
    id: notifId,
    patientId: body.patientId,
    patientName: body.patientName,
    patientAge: body.patientAge,
    patientGender: body.patientGender,
    patientFingerprintRef: body.patientFingerprintRef,
    patientBloodType: body.patientBloodType,

    senderDoctorId: body.senderDoctorId,
    senderDoctorName: body.senderDoctorName,
    senderHospital: body.senderHospital,
    senderRole: body.senderRole || 'Emergency Attending Physician',

    recipientDoctorId: body.recipientDoctorId,
    recipientDoctorName: body.recipientDoctorName,
    recipientHospital: body.recipientHospital,

    treatmentDate: body.treatmentDate || now.split('T')[0],
    emergencyReason: body.emergencyReason || 'Emergency Consultation',
    diagnosis: body.diagnosis || 'Acute Evaluation',
    clinicalFindings: body.clinicalFindings,
    treatmentProvided: body.treatmentProvided || 'Immediate emergency medical intervention',
    procedures: body.procedures,
    medications: body.medications || [],
    followUpInstructions: body.followUpInstructions,
    notes: body.notes,
    attachments: body.attachments || [],

    status: 'Pending Review',
    createdAt: now,
  };

  db.notifications = db.notifications || [];
  db.notifications.unshift(newNotif);

  // Record Audit Trail: NOTIFICATION_SENT
  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: now,
    action: 'NOTIFICATION_SENT',
    actorId: newNotif.senderDoctorId,
    actorName: newNotif.senderDoctorName,
    actorBadge: body.senderBadge || 'STAFF-EMG',
    actorRole: newNotif.senderRole || 'Emergency Attending Physician',
    actorHospital: newNotif.senderHospital,
    targetPatientId: newNotif.patientId,
    targetPatientName: newNotif.patientName,
    targetRecordId: newNotif.id,
    details: `Emergency treatment update securely transmitted to Dr. ${newNotif.recipientDoctorName} (${newNotif.recipientHospital}) for patient ${newNotif.patientName} (${newNotif.patientId}). Diagnosis: ${newNotif.diagnosis}.`,
    status: 'SUCCESS',
  };
  db.auditLogs.unshift(auditEntry);

  saveDatabase(db);
  res.status(201).json({ success: true, notification: newNotif });
});

app.put('/api/notifications/:id/view', (req, res) => {
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const { doctorId, doctorName, doctorBadge, doctorRole, doctorHospital } = req.body;
  const now = new Date().toISOString();
  notif.viewedAt = now;

  if (notif.status === 'Pending Review') {
    notif.status = 'Reviewed';
    notif.reviewedAt = now;

    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: now,
      action: 'NOTIFICATION_VIEWED',
      actorId: doctorId || notif.recipientDoctorId,
      actorName: doctorName || notif.recipientDoctorName,
      actorBadge: doctorBadge || 'STAFF-REG',
      actorRole: doctorRole || 'Regular Attending Doctor',
      actorHospital: doctorHospital || notif.recipientHospital,
      targetPatientId: notif.patientId,
      targetPatientName: notif.patientName,
      targetRecordId: notif.id,
      details: `Dr. ${doctorName || notif.recipientDoctorName} viewed emergency treatment update ${notif.id} for patient ${notif.patientName}.`,
      status: 'SUCCESS',
    };
    db.auditLogs.unshift(auditEntry);
  }

  saveDatabase(db);
  res.json({ success: true, notification: notif });
});

app.put('/api/notifications/:id/reject', (req, res) => {
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const { rejectionReason, doctorId, doctorName, doctorBadge, doctorRole, doctorHospital } =
    req.body;
  const now = new Date().toISOString();

  notif.status = 'Rejected';
  notif.rejectionReason =
    rejectionReason || 'Treatment details rejected by primary attending physician.';
  notif.reviewedAt = now;
  notif.updatedAt = now;

  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: now,
    action: 'NOTIFICATION_REJECTED',
    actorId: doctorId || notif.recipientDoctorId,
    actorName: doctorName || notif.recipientDoctorName,
    actorBadge: doctorBadge || 'STAFF-REG',
    actorRole: doctorRole || 'Regular Attending Doctor',
    actorHospital: doctorHospital || notif.recipientHospital,
    targetPatientId: notif.patientId,
    targetPatientName: notif.patientName,
    targetRecordId: notif.id,
    details: `Emergency treatment notification ${notif.id} rejected by Dr. ${
      doctorName || notif.recipientDoctorName
    }. Reason: ${notif.rejectionReason}`,
    status: 'FLAGGED',
  };
  db.auditLogs.unshift(auditEntry);

  saveDatabase(db);
  res.json({ success: true, notification: notif });
});

app.post('/api/notifications/:id/update-patient-record', (req, res) => {
  const notifId = req.params.id;
  const notif = (db.notifications || []).find((n) => n.id === notifId);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const patient = db.patients.find((p) => p.id.toLowerCase() === notif.patientId.toLowerCase());
  if (!patient) {
    return res.status(404).json({ error: 'Associated patient record not found' });
  }

  const { doctorId, doctorName, doctorBadge, doctorRole, doctorHospital } = req.body;
  const now = new Date().toISOString();
  const treatmentDateStr = notif.treatmentDate || now.split('T')[0];

  // 1. Append Case History Entry
  const newCaseHistoryEntry: CaseHistoryEntry = {
    id: `ENC-EMG-${Date.now().toString().slice(-4)}`,
    date: treatmentDateStr,
    incidentTitle: `Emergency Encounter: ${notif.emergencyReason || notif.diagnosis}`,
    details: `Emergency treatment administered by ${notif.senderDoctorName} at ${notif.senderHospital}.\nTreatment: ${notif.treatmentProvided}.\nProcedures: ${notif.procedures || 'None reported'}.\nClinical Findings: ${notif.clinicalFindings || 'None documented'}.\nFollow-up: ${notif.followUpInstructions || 'Follow up with regular care team.'}`,
    location: notif.senderHospital,
    severity: 'Severe',
    treatingPhysician: notif.senderDoctorName,
    treatingPhysicianId: notif.senderDoctorId,
    doctorId: notif.senderDoctorId,
    hospitalName: notif.senderHospital,
    diagnosis: notif.diagnosis,
    caseStudyNotes:
      notif.notes || 'Emergency treatment notification verified and merged by primary physician.',
    outcome: 'Emergency Care Stabilized - Appended to Primary Medical Record',
    createdAt: now,
  };
  patient.caseHistory = [newCaseHistoryEntry, ...(patient.caseHistory || [])];

  // 2. Append Diagnosis Record
  let newDiagnosisRecord: DiagnosisRecord | undefined;
  if (notif.diagnosis) {
    newDiagnosisRecord = {
      id: `DX-EMG-${Date.now().toString().slice(-4)}`,
      condition: notif.diagnosis,
      status: 'Active',
      diagnosedDate: treatmentDateStr,
      doctorName: notif.senderDoctorName,
      doctorId: notif.senderDoctorId,
      hospitalName: notif.senderHospital,
      severity: 'Emergency Acute',
      treatmentPlan: notif.treatmentProvided,
      notes: `Emergency intake at ${notif.senderHospital}. Verified and approved by regular physician ${
        doctorName || notif.recipientDoctorName
      }.`,
      createdAt: now,
    };
    patient.diagnoses = [newDiagnosisRecord, ...(patient.diagnoses || [])];
  }

  // 3. Append Medication Records
  const addedMedicationIds: string[] = [];
  if (notif.medications && notif.medications.length > 0) {
    const medRecords: MedicationRecord[] = notif.medications.map((m, idx) => {
      const medId = `MED-EMG-${Date.now().toString().slice(-4)}-${idx + 1}`;
      addedMedicationIds.push(medId);
      return {
        id: medId,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        prescribedDate: treatmentDateStr,
        status: 'Active',
        prescribedByDoctor: notif.senderDoctorName,
        prescribedByDoctorId: notif.senderDoctorId,
        hospitalName: notif.senderHospital,
        instructions: [m.duration ? `Duration: ${m.duration}` : '', m.instructions || '']
          .filter(Boolean)
          .join(' • '),
        createdAt: now,
      };
    });
    patient.medications = [...medRecords, ...(patient.medications || [])];
  }

  // 4. Append Medical Report Record
  const primaryAttachment =
    notif.attachments && notif.attachments.length > 0 ? notif.attachments[0] : undefined;
  const newReportRecord: MedicalReportRecord = {
    id: `REP-EMG-${Date.now().toString().slice(-4)}`,
    title: `Emergency Treatment Summary: ${notif.diagnosis}`,
    category: 'Discharge Summary',
    type: 'Discharge Summary',
    reportDate: treatmentDateStr,
    hospitalName: notif.senderHospital,
    doctorName: notif.senderDoctorName,
    doctorId: notif.senderDoctorId,
    summary: `Emergency Treatment: ${notif.treatmentProvided}.\nReason: ${notif.emergencyReason}.\nFindings: ${
      notif.clinicalFindings || 'Evaluated'
    }.\nFollow-up: ${notif.followUpInstructions || 'Standard protocol'}.`,
    findings: notif.clinicalFindings,
    keyFindings: [
      `Emergency Reason: ${notif.emergencyReason}`,
      `Procedures: ${notif.procedures || 'None reported'}`,
      `Prescriptions: ${
        notif.medications?.map((m) => `${m.name} ${m.dosage}`).join(', ') || 'None'
      }`,
    ],
    fileName: primaryAttachment?.fileName || 'Emergency_Treatment_Update.pdf',
    fileUrl: primaryAttachment?.fileUrl,
    createdAt: now,
  };
  patient.medicalReports = [newReportRecord, ...(patient.medicalReports || [])];

  // 5. Append Treatment Timeline Record
  const newTimelineRecord: TreatmentTimelineRecord = {
    id: `TL-EMG-${Date.now().toString().slice(-4)}`,
    date: treatmentDateStr,
    stageTitle: `Emergency Treatment: ${notif.emergencyReason || notif.diagnosis}`,
    milestone: `Emergency Care at ${notif.senderHospital}`,
    category: 'Admission',
    doctorName: notif.senderDoctorName,
    doctorId: notif.senderDoctorId,
    hospitalName: notif.senderHospital,
    details: `Emergency treatment administered by ${notif.senderDoctorName} (${
      notif.senderHospital
    }). Verified and integrated into primary medical record by ${
      doctorName || notif.recipientDoctorName
    }.`,
    outcome: 'Emergency care verified and appended to patient medical locker.',
    createdAt: now,
  };
  patient.treatmentTimeline = [newTimelineRecord, ...(patient.treatmentTimeline || [])];

  patient.updatedAt = now;

  // Update Notification
  notif.status = 'Record Updated';
  notif.reviewedAt = now;
  notif.updatedAt = now;
  notif.recordUpdatedDetails = {
    caseHistoryId: newCaseHistoryEntry.id,
    diagnosisId: newDiagnosisRecord?.id,
    medicationIds: addedMedicationIds,
    reportId: newReportRecord.id,
    timelineId: newTimelineRecord.id,
    updatedByDoctorName: doctorName || notif.recipientDoctorName,
    updatedAt: now,
  };

  // Add 2 Audit Trail Entries: TREATMENT_UPDATE_ACCEPTED and PATIENT_RECORD_UPDATED
  const auditAccept: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-1`,
    timestamp: now,
    action: 'TREATMENT_UPDATE_ACCEPTED',
    actorId: doctorId || notif.recipientDoctorId,
    actorName: doctorName || notif.recipientDoctorName,
    actorBadge: doctorBadge || 'STAFF-REG',
    actorRole: doctorRole || 'Regular Attending Doctor',
    actorHospital: doctorHospital || notif.recipientHospital,
    targetPatientId: patient.id,
    targetPatientName: patient.fullName,
    targetRecordId: notif.id,
    details: `Regular doctor approved emergency treatment notification ${notif.id} from ${notif.senderDoctorName} (${notif.senderHospital}).`,
    status: 'SUCCESS',
  };

  const auditUpdate: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-2`,
    timestamp: new Date(Date.now() + 20).toISOString(),
    action: 'PATIENT_RECORD_UPDATED',
    actorId: doctorId || notif.recipientDoctorId,
    actorName: doctorName || notif.recipientDoctorName,
    actorBadge: doctorBadge || 'STAFF-REG',
    actorRole: doctorRole || 'Regular Attending Doctor',
    actorHospital: doctorHospital || notif.recipientHospital,
    targetPatientId: patient.id,
    targetPatientName: patient.fullName,
    targetRecordId: patient.id,
    details: `Patient medical locker updated: appended emergency case history (${newCaseHistoryEntry.id}), diagnosis (${
      newDiagnosisRecord?.id || 'N/A'
    }), ${addedMedicationIds.length} medication(s), report (${newReportRecord.id}), and timeline milestone.`,
    status: 'SUCCESS',
  };

  db.auditLogs.unshift(auditUpdate);
  db.auditLogs.unshift(auditAccept);

  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Patient record successfully updated with emergency treatment details.',
    notification: notif,
    patient,
  });
});

// ---------------- Patients CRUD ----------------

app.get('/api/patients', (_req, res) => {
  res.json(db.patients);
});

app.get('/api/patients/:id', (req, res) => {
  const patient = db.patients.find((p) => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!patient) {
    return res.status(404).json({ error: 'Patient record not found' });
  }
  res.json(patient);
});

app.post('/api/patients', (req, res) => {
  const body = req.body;
  const newId = body.id || `PID-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newPatient: Patient = {
    id: newId,
    fullName: body.fullName || 'Unidentified Patient',
    age: body.age || 'Unknown',
    gender: body.gender || 'Unknown',
    phone: body.phone || 'N/A',
    photo: body.photo || '',
    identificationRemarks: body.identificationRemarks || '',
    fingerprintRefId: body.fingerprintRefId || `FP-${Math.floor(1000 + Math.random() * 9000)}-REF`,
    emergencyNotes: body.emergencyNotes || '',
    status: body.status || 'Identified',
    bloodType: body.bloodType || 'Unknown',
    allergies: body.allergies || 'None Recorded',
    caseHistory: body.caseHistory || [],
    createdAt: now,
    updatedAt: now,
  };

  db.patients.unshift(newPatient);
  saveDatabase(db);
  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', (req, res) => {
  const { isGlobalMode, user } = req.body;
  if (isGlobalMode) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'BLOCKED_UNAUTHORIZED_EDIT',
      actorId: user?.id || 'anon',
      actorName: user?.name || 'External Clinician',
      actorBadge: user?.badgeNumber || 'N/A',
      actorRole: user?.role || 'Clinician',
      actorHospital: user?.hospitalName || 'External Facility',
      targetPatientId: req.params.id,
      details: `Modification rejected: Global Dashboard is view-only. Patient profile cannot be edited from Global mode.`,
      status: 'DENIED',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);
    return res.status(403).json({
      error: 'Global Dashboard is strictly View-Only. Modifying records from Global mode is prohibited.',
    });
  }

  const index = db.patients.findIndex((p) => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const existingPatient = db.patients[index];

  // If user is provided, check if they are the registering doctor or admin
  if (user && existingPatient.registeredByDoctorId && user.role !== 'Admin') {
    if (user.id !== existingPatient.registeredByDoctorId) {
      const auditEntry: AuditLogEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
        timestamp: new Date().toISOString(),
        action: 'BLOCKED_UNAUTHORIZED_EDIT',
        actorId: user.id,
        actorName: user.name,
        actorBadge: user.badgeNumber,
        actorRole: user.role,
        actorHospital: user.hospitalName,
        targetPatientId: existingPatient.id,
        details: `Access Denied: Attempted to edit patient profile originally created by ${existingPatient.registeredByDoctor || 'another doctor'} (${existingPatient.originHospital || 'another hospital'}).`,
        status: 'DENIED',
      };
      db.auditLogs = db.auditLogs || [];
      db.auditLogs.unshift(auditEntry);
      saveDatabase(db);

      return res.status(403).json({
        error: `Permission Denied: Only the original creator (${existingPatient.registeredByDoctor} at ${existingPatient.originHospital}) is authorized to edit this master patient profile. You can append new clinical records under your hospital instead.`,
      });
    }
  }

  const updated: Patient = {
    ...existingPatient,
    ...req.body,
    id: existingPatient.id, // preserve ID
    updatedAt: new Date().toISOString(),
  };

  db.patients[index] = updated;

  // Log successful edit
  if (user) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'RECORD_UPDATED_BY_CREATOR',
      actorId: user.id,
      actorName: user.name,
      actorBadge: user.badgeNumber,
      actorRole: user.role,
      actorHospital: user.hospitalName,
      targetPatientId: updated.id,
      details: `Master patient demographic/emergency profile updated by authorized clinician.`,
      status: 'SUCCESS',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
  }

  saveDatabase(db);
  res.json(updated);
});

app.delete('/api/patients/:id', (req, res) => {
  const { isGlobalMode, user } = req.body || {};
  if (isGlobalMode) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'BLOCKED_UNAUTHORIZED_DELETE',
      actorId: user?.id || 'anon',
      actorName: user?.name || 'External Clinician',
      actorBadge: user?.badgeNumber || 'N/A',
      actorRole: user?.role || 'Clinician',
      actorHospital: user?.hospitalName || 'External Facility',
      targetPatientId: req.params.id,
      details: `Deletion rejected: Global Dashboard is strictly view-only. Deleting records from Global mode is prohibited.`,
      status: 'DENIED',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);
    return res.status(403).json({
      error: 'Global Dashboard is strictly View-Only. Deleting records from Global mode is prohibited.',
    });
  }

  const initialLen = db.patients.length;
  const targetPatient = db.patients.find((p) => p.id.toLowerCase() === req.params.id.toLowerCase());

  if (!targetPatient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  if (user && targetPatient.registeredByDoctorId && user.role !== 'Admin') {
    if (user.id !== targetPatient.registeredByDoctorId) {
      const auditEntry: AuditLogEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
        timestamp: new Date().toISOString(),
        action: 'BLOCKED_UNAUTHORIZED_DELETE',
        actorId: user.id,
        actorName: user.name,
        actorBadge: user.badgeNumber,
        actorRole: user.role,
        actorHospital: user.hospitalName,
        targetPatientId: targetPatient.id,
        details: `Access Denied: Attempted to delete patient record registered by ${targetPatient.registeredByDoctor} (${targetPatient.originHospital}).`,
        status: 'DENIED',
      };
      db.auditLogs = db.auditLogs || [];
      db.auditLogs.unshift(auditEntry);
      saveDatabase(db);
      return res.status(403).json({
        error: `Permission Denied: Only the original creator (${targetPatient.registeredByDoctor} at ${targetPatient.originHospital}) is authorized to delete this record.`,
      });
    }
  }

  db.patients = db.patients.filter((p) => p.id.toLowerCase() !== req.params.id.toLowerCase());
  if (db.patients.length === initialLen) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  if (user) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'RECORD_DELETED_BY_CREATOR',
      actorId: user.id,
      actorName: user.name,
      actorBadge: user.badgeNumber,
      actorRole: user.role,
      actorHospital: user.hospitalName,
      targetPatientId: targetPatient.id,
      details: `Patient record purged by authorized creator.`,
      status: 'SUCCESS',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Patient record deleted successfully' });
});

// Append a new clinical record under the active doctor and hospital (Multi-Hospital Preservation)
app.post('/api/patients/:id/append-record', (req, res) => {
  const patient = db.patients.find((p) => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { type, record, user } = req.body;
  if (!type || !record || !user) {
    return res.status(400).json({ error: 'Record type, record payload, and user credentials required' });
  }

  const now = new Date().toISOString();
  let createdItem: any = null;

  if (type === 'diagnosis') {
    const diag: DiagnosisRecord = {
      id: `DX-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      condition: record.condition || 'Clinical Observation',
      icd10Code: record.icd10Code || 'R69',
      diagnosedDate: record.diagnosedDate || now.slice(0, 10),
      severity: record.severity || 'Moderate',
      status: record.status || 'Active',
      hospitalName: user.hospitalName || 'Attending Hospital',
      doctorName: user.name || 'Attending Physician',
      doctorId: user.id,
      notes: record.notes || '',
      treatmentPlan: record.treatmentPlan || '',
      createdAt: now,
    };
    patient.diagnoses = patient.diagnoses || [];
    patient.diagnoses.unshift(diag);
    createdItem = diag;
  } else if (type === 'medication') {
    const med: MedicationRecord = {
      id: `MED-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      name: record.name || 'Prescription',
      dosage: record.dosage || 'Standard Dose',
      frequency: record.frequency || 'As Directed',
      prescribedDate: record.prescribedDate || now.slice(0, 10),
      prescribedByDoctor: user.name || 'Attending Physician',
      prescribedByDoctorId: user.id,
      doctorId: user.id,
      hospitalName: user.hospitalName || 'Attending Hospital',
      status: record.status || 'Active',
      instructions: record.instructions || '',
      endDate: record.endDate,
      createdAt: now,
    };
    patient.medications = patient.medications || [];
    patient.medications.unshift(med);
    createdItem = med;
  } else if (type === 'report') {
    const rep: MedicalReportRecord = {
      id: `REP-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      title: record.title || 'Diagnostic Report',
      category: record.category || 'Lab',
      reportDate: record.reportDate || now.slice(0, 10),
      hospitalName: user.hospitalName || 'Attending Hospital',
      doctorName: user.name || 'Attending Physician',
      doctorId: user.id,
      summary: record.summary || '',
      keyFindings: record.keyFindings || [],
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      fileType: record.fileType,
      createdAt: now,
    };
    patient.medicalReports = patient.medicalReports || [];
    patient.medicalReports.unshift(rep);
    createdItem = rep;
  } else if (type === 'timeline') {
    const time: TreatmentTimelineRecord = {
      id: `TTL-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      date: record.date || now.slice(0, 10),
      stageTitle: record.stageTitle || 'Clinical Episode',
      hospitalName: user.hospitalName || 'Attending Hospital',
      doctorName: user.name || 'Attending Physician',
      doctorId: user.id,
      description: record.description || '',
      outcome: record.outcome,
      category: record.category || 'Consultation',
      createdAt: now,
    };
    patient.treatmentTimeline = patient.treatmentTimeline || [];
    patient.treatmentTimeline.unshift(time);
    createdItem = time;
  } else if (type === 'caseHistory') {
    const ch: CaseHistoryEntry = {
      id: `CH-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      date: record.date || now.replace('T', ' ').slice(0, 16),
      incidentTitle: record.incidentTitle || 'Clinical Encounter',
      details: record.details || 'Encounter recorded.',
      location: record.location || user.hospitalName,
      severity: record.severity || 'Moderate',
      treatingPhysician: user.name || 'Duty Staff',
      treatingPhysicianId: user.id,
      hospitalName: user.hospitalName,
      createdAt: now,
    };
    patient.caseHistory = patient.caseHistory || [];
    patient.caseHistory.unshift(ch);
    createdItem = ch;
  } else {
    return res.status(400).json({ error: `Unsupported record type: ${type}` });
  }

  patient.updatedAt = now;
  saveDatabase(db);

  // Write audit trail entry
  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: now,
    action: 'CROSS_HOSPITAL_RECORD_APPENDED',
    actorId: user.id,
    actorName: user.name,
    actorBadge: user.badgeNumber,
    actorRole: user.role,
    actorHospital: user.hospitalName,
    targetPatientId: patient.id,
    targetRecordId: createdItem.id,
    details: `Appended new ${type} ('${createdItem.condition || createdItem.name || createdItem.title || createdItem.stageTitle || createdItem.incidentTitle}') under ${user.hospitalName} without modifying prior records.`,
    status: 'SUCCESS',
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(auditEntry);
  saveDatabase(db);

  res.status(201).json({ success: true, item: createdItem, patient });
});

// Record-level update: ONLY original creator can edit
app.put('/api/patients/:id/record', (req, res) => {
  const { recordType, recordId, updatedData, user, isGlobalMode } = req.body;

  if (isGlobalMode) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'BLOCKED_UNAUTHORIZED_EDIT',
      actorId: user?.id || 'anon',
      actorName: user?.name || 'External Clinician',
      actorBadge: user?.badgeNumber || 'N/A',
      actorRole: user?.role || 'Clinician',
      actorHospital: user?.hospitalName || 'External Facility',
      targetPatientId: req.params.id,
      targetRecordId: recordId,
      details: `Blocked edit attempt from Global Dashboard: Global mode is strictly View-Only.`,
      status: 'DENIED',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);
    return res.status(403).json({
      error: 'Global Dashboard is strictly View-Only. Existing records cannot be modified from Global mode.',
    });
  }

  const patient = db.patients.find((p) => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  let list: any[] = [];
  if (recordType === 'diagnosis') list = patient.diagnoses || [];
  else if (recordType === 'medication') list = patient.medications || [];
  else if (recordType === 'report') list = patient.medicalReports || [];
  else if (recordType === 'timeline') list = patient.treatmentTimeline || [];
  else if (recordType === 'caseHistory') list = patient.caseHistory || [];
  else return res.status(400).json({ error: 'Invalid record type' });

  const recordIndex = list.findIndex((r) => r.id === recordId);
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const existingRecord = list[recordIndex];
  const creatorId =
    existingRecord.doctorId ||
    existingRecord.prescribedByDoctorId ||
    existingRecord.treatingPhysicianId ||
    patient.registeredByDoctorId;
  const creatorName =
    existingRecord.doctorName ||
    existingRecord.prescribedByDoctor ||
    existingRecord.treatingPhysician ||
    patient.registeredByDoctor;
  const creatorHospital = existingRecord.hospitalName || patient.originHospital;

  // Authorization check
  const isCreator = user && (user.id === creatorId || (creatorName && user.name === creatorName));
  const isAdmin = user && user.role === 'Admin';

  if (!isCreator && !isAdmin) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'BLOCKED_UNAUTHORIZED_EDIT',
      actorId: user?.id || 'anon',
      actorName: user?.name || 'Unknown Doctor',
      actorBadge: user?.badgeNumber || 'N/A',
      actorRole: user?.role || 'Clinician',
      actorHospital: user?.hospitalName || 'External Facility',
      targetPatientId: patient.id,
      targetRecordId: recordId,
      details: `Blocked edit attempt: User is not the creator of this ${recordType}. Original author: ${creatorName} (${creatorHospital}).`,
      status: 'DENIED',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);

    return res.status(403).json({
      error: `Access Denied: Only the original creator (${creatorName || 'authorized physician'} at ${creatorHospital || 'origin facility'}) is authorized to edit or update this ${recordType} record.`,
    });
  }

  // Update record
  list[recordIndex] = {
    ...existingRecord,
    ...updatedData,
    id: existingRecord.id, // preserve ID
    doctorId: creatorId, // preserve origin creator
    doctorName: creatorName,
    hospitalName: creatorHospital,
    updatedAt: new Date().toISOString(),
  };

  patient.updatedAt = new Date().toISOString();

  // Audit log for authorized update
  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: new Date().toISOString(),
    action: 'RECORD_UPDATED_BY_CREATOR',
    actorId: user.id,
    actorName: user.name,
    actorBadge: user.badgeNumber,
    actorRole: user.role,
    actorHospital: user.hospitalName,
    targetPatientId: patient.id,
    targetRecordId: recordId,
    details: `Updated ${recordType} (${existingRecord.id}) verified by original creator.`,
    status: 'SUCCESS',
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(auditEntry);
  saveDatabase(db);

  res.json({ success: true, updatedRecord: list[recordIndex], patient });
});

// Record-level delete: ONLY original creator can delete
app.delete('/api/patients/:id/record', (req, res) => {
  const { recordType, recordId, user, isGlobalMode } = req.body;

  if (isGlobalMode) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'BLOCKED_UNAUTHORIZED_DELETE',
      actorId: user?.id || 'anon',
      actorName: user?.name || 'External Clinician',
      actorBadge: user?.badgeNumber || 'N/A',
      actorRole: user?.role || 'Clinician',
      actorHospital: user?.hospitalName || 'External Facility',
      targetPatientId: req.params.id,
      targetRecordId: recordId,
      details: `Blocked delete attempt from Global Dashboard: Global mode is strictly View-Only.`,
      status: 'DENIED',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);
    return res.status(403).json({
      error: 'Global Dashboard is strictly View-Only. Records cannot be deleted from Global mode.',
    });
  }

  const patient = db.patients.find((p) => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  let list: any[] = [];
  if (recordType === 'diagnosis') list = patient.diagnoses || [];
  else if (recordType === 'medication') list = patient.medications || [];
  else if (recordType === 'report') list = patient.medicalReports || [];
  else if (recordType === 'timeline') list = patient.treatmentTimeline || [];
  else if (recordType === 'caseHistory') list = patient.caseHistory || [];
  else return res.status(400).json({ error: 'Invalid record type' });

  const recordIndex = list.findIndex((r) => r.id === recordId);
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const existingRecord = list[recordIndex];
  const creatorId =
    existingRecord.doctorId ||
    existingRecord.prescribedByDoctorId ||
    existingRecord.treatingPhysicianId ||
    patient.registeredByDoctorId;
  const creatorName =
    existingRecord.doctorName ||
    existingRecord.prescribedByDoctor ||
    existingRecord.treatingPhysician ||
    patient.registeredByDoctor;
  const creatorHospital = existingRecord.hospitalName || patient.originHospital;

  const isCreator = user && (user.id === creatorId || (creatorName && user.name === creatorName));
  const isAdmin = user && user.role === 'Admin';

  if (!isCreator && !isAdmin) {
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      timestamp: new Date().toISOString(),
      action: 'BLOCKED_UNAUTHORIZED_DELETE',
      actorId: user?.id || 'anon',
      actorName: user?.name || 'Unknown Doctor',
      actorBadge: user?.badgeNumber || 'N/A',
      actorRole: user?.role || 'Clinician',
      actorHospital: user?.hospitalName || 'External Facility',
      targetPatientId: patient.id,
      targetRecordId: recordId,
      details: `Blocked delete attempt: User is not the creator of this ${recordType}. Original author: ${creatorName} (${creatorHospital}).`,
      status: 'DENIED',
    };
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift(auditEntry);
    saveDatabase(db);

    return res.status(403).json({
      error: `Access Denied: Only the original creator (${creatorName || 'physician'} at ${creatorHospital || 'facility'}) is authorized to delete this ${recordType} record.`,
    });
  }

  // Remove record
  if (recordType === 'diagnosis') patient.diagnoses = patient.diagnoses?.filter((r) => r.id !== recordId);
  else if (recordType === 'medication') patient.medications = patient.medications?.filter((r) => r.id !== recordId);
  else if (recordType === 'report') patient.medicalReports = patient.medicalReports?.filter((r) => r.id !== recordId);
  else if (recordType === 'timeline') patient.treatmentTimeline = patient.treatmentTimeline?.filter((r) => r.id !== recordId);
  else if (recordType === 'caseHistory') patient.caseHistory = patient.caseHistory?.filter((r) => r.id !== recordId);

  patient.updatedAt = new Date().toISOString();

  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: new Date().toISOString(),
    action: 'RECORD_DELETED_BY_CREATOR',
    actorId: user.id,
    actorName: user.name,
    actorBadge: user.badgeNumber,
    actorRole: user.role,
    actorHospital: user.hospitalName,
    targetPatientId: patient.id,
    targetRecordId: recordId,
    details: `Deleted ${recordType} (${recordId}) verified by creator.`,
    status: 'SUCCESS',
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.unshift(auditEntry);
  saveDatabase(db);

  res.json({ success: true, message: 'Record deleted by creator', patient });
});

app.post('/api/patients/:id/cases', (req, res) => {
  const patient = db.patients.find((p) => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { isGlobalMode, user } = req.body;
  if (isGlobalMode) {
    return res.status(403).json({
      error: 'Global Dashboard is view-only. Use append record under your facility.',
    });
  }

  const newEntry = {
    id: `CH-${Date.now().toString().slice(-4)}`,
    date: req.body.date || new Date().toISOString().replace('T', ' ').slice(0, 16),
    incidentTitle: req.body.incidentTitle || 'Emergency Room Admission',
    details: req.body.details || 'Triage observation recorded.',
    location: req.body.location || user?.hospitalName || 'Emergency Department',
    severity: req.body.severity || 'Moderate',
    treatingPhysician: req.body.treatingPhysician || user?.name || 'Emergency Duty Staff',
    treatingPhysicianId: user?.id,
    hospitalName: req.body.hospitalName || user?.hospitalName,
    createdAt: new Date().toISOString(),
  };

  patient.caseHistory = patient.caseHistory || [];
  patient.caseHistory.unshift(newEntry);
  patient.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.status(201).json(newEntry);
});

// ---------------- Emergency Cases CRUD ----------------

app.get('/api/emergency-cases', (_req, res) => {
  res.json(db.emergencyCases);
});

app.get('/api/emergency-cases/:id', (req, res) => {
  const item = db.emergencyCases.find(
    (c) => c.id.toLowerCase() === req.params.id.toLowerCase() || c.temporaryId.toLowerCase() === req.params.id.toLowerCase()
  );
  if (!item) {
    return res.status(404).json({ error: 'Emergency case not found' });
  }
  res.json(item);
});

app.post('/api/emergency-cases', (req, res) => {
  const body = req.body;
  const tempId = body.temporaryId || `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newCase: EmergencyCase = {
    id: tempId,
    temporaryId: tempId,
    photo: body.photo || '',
    estimatedAge: body.estimatedAge || 'Unknown',
    gender: body.gender || 'Unknown',
    identificationRemarks: body.identificationRemarks || '',
    fingerprintRefId: body.fingerprintRefId || `FP-${Math.floor(1000 + Math.random() * 9000)}-UN`,
    emergencyNotes: body.emergencyNotes || '',
    dateTime: body.dateTime || now.replace('T', ' ').slice(0, 16),
    identificationStatus: body.identificationStatus || 'Unidentified',
    triageLevel: body.triageLevel || 'Immediate',
    locationFound: body.locationFound || 'Field Intake',
    linkedPatientId: body.linkedPatientId || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.emergencyCases.unshift(newCase);
  saveDatabase(db);
  res.status(201).json(newCase);
});

app.put('/api/emergency-cases/:id', (req, res) => {
  const index = db.emergencyCases.findIndex(
    (c) => c.id.toLowerCase() === req.params.id.toLowerCase() || c.temporaryId.toLowerCase() === req.params.id.toLowerCase()
  );
  if (index === -1) {
    return res.status(404).json({ error: 'Emergency case not found' });
  }

  const updated: EmergencyCase = {
    ...db.emergencyCases[index],
    ...req.body,
    id: db.emergencyCases[index].id,
    updatedAt: new Date().toISOString(),
  };

  db.emergencyCases[index] = updated;
  saveDatabase(db);
  res.json(updated);
});

app.delete('/api/emergency-cases/:id', (req, res) => {
  const initialLen = db.emergencyCases.length;
  db.emergencyCases = db.emergencyCases.filter(
    (c) => c.id.toLowerCase() !== req.params.id.toLowerCase() && c.temporaryId.toLowerCase() !== req.params.id.toLowerCase()
  );
  if (db.emergencyCases.length === initialLen) {
    return res.status(404).json({ error: 'Emergency case not found' });
  }
  saveDatabase(db);
  res.json({ success: true, message: 'Emergency case deleted successfully' });
});

// Reset demo data
app.post('/api/reset-demo-data', (_req, res) => {
  db = {
    patients: INITIAL_PATIENTS,
    emergencyCases: INITIAL_EMERGENCY_CASES,
    user: DEMO_USER,
    auditLogs: [],
    notifications: INITIAL_NOTIFICATIONS,
  };
  saveDatabase(db);
  res.json({ success: true, message: 'Database reset to default demo records' });
});

// ---------------- AI Patient Summary (Gemini) ----------------

const MEDICAL_DISCLAIMER =
  'AI summary is for organizing recorded information only and does not replace professional medical judgment.';

app.post('/api/ai/summary', async (req, res) => {
  const { patient } = req.body;
  if (!patient) {
    return res.status(400).json({ error: 'Patient data is required' });
  }

  const ai = getAIClient();

  // If Gemini API is not configured, return a structured offline fallback
  if (!ai) {
    const fallbackSections = {
      identificationInfo: `Patient ${patient.fullName} (${patient.id}), Age: ${patient.age}, Gender: ${patient.gender}. Physical reference markers: ${patient.identificationRemarks || 'None recorded'}. Biometric reference ID: ${patient.fingerprintRefId || 'Not cataloged'}. Contact: ${patient.phone || 'None'}.`,
      emergencyInfo: `Emergency status: ${patient.status}. Blood Type: ${patient.bloodType || 'Unverified'}. Known Allergies: ${patient.allergies || 'None documented'}. Triage/Condition notes: ${patient.emergencyNotes || 'No acute notes'}.`,
      identificationStatus: `Current Status is ${patient.status.toUpperCase()}. Registered in database on ${patient.createdAt?.slice(0, 10) || 'Active Record'}.`,
      recordedCaseHistory:
        patient.caseHistory && patient.caseHistory.length > 0
          ? patient.caseHistory
              .map((c: any) => `• ${c.date}: ${c.incidentTitle} (${c.severity}) - ${c.details}`)
              .join('\n')
          : 'No prior incident case history on file.',
      importantRecordedNotes: patient.emergencyNotes || 'Standard emergency monitoring active.',
    };

    const fallbackSummary = `### Identification Information
${fallbackSections.identificationInfo}

### Emergency Information
${fallbackSections.emergencyInfo}

### Identification Status
${fallbackSections.identificationStatus}

### Recorded Case History
${fallbackSections.recordedCaseHistory}

### Important Recorded Notes
${fallbackSections.importantRecordedNotes}

*(Note: Gemini API key is not configured in environment variables. This structured summary was generated directly from stored hospital records.)*`;

    return res.json({
      summary: fallbackSummary,
      sections: fallbackSections,
      generatedAt: new Date().toISOString(),
      isAiAvailable: false,
      disclaimer: MEDICAL_DISCLAIMER,
    });
  }

  try {
    const prompt = `You are the EmergencyCare AI Clinical Intake Assistant.
Your task is to generate a concise, structured AI summary of the following patient record for emergency room staff.

PATIENT RECORD:
ID: ${patient.id}
Full Name: ${patient.fullName}
Age: ${patient.age}
Gender: ${patient.gender}
Phone: ${patient.phone}
Identification Remarks: ${patient.identificationRemarks || 'None'}
Fingerprint Reference ID: ${patient.fingerprintRefId || 'None'}
Status: ${patient.status}
Blood Type: ${patient.bloodType || 'Pending'}
Allergies: ${patient.allergies || 'None documented'}
Emergency Notes: ${patient.emergencyNotes || 'None'}
Case History:
${JSON.stringify(patient.caseHistory || [], null, 2)}

STRICT REQUIREMENTS:
1. You must base your summary ONLY on the recorded information provided above. Do not invent or assume outside facts.
2. Structure the summary cleanly with the following 5 distinct sections:
   - Identification Information
   - Emergency Information
   - Identification Status
   - Recorded Case History
   - Important Recorded Notes
3. The summary must NOT diagnose diseases, prescribe medicines, or make treatment decisions.
4. Conclude with the mandatory disclaimer: "${MEDICAL_DISCLAIMER}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an emergency hospital identification assistant. You strictly organize recorded patient information. You NEVER diagnose diseases, prescribe medicines, or provide treatment decisions.',
      },
    });

    const summaryText = response.text || 'Unable to generate summary.';

    return res.json({
      summary: summaryText,
      generatedAt: new Date().toISOString(),
      isAiAvailable: true,
      disclaimer: MEDICAL_DISCLAIMER,
    });
  } catch (error: any) {
    console.error('Gemini summary error:', error);
    // Graceful fallback if API call fails
    return res.json({
      summary: `### Identification Information\n${patient.fullName} (${patient.id}), Age ${patient.age}, Gender: ${patient.gender}. Identification Reference: ${patient.fingerprintRefId}.\n\n### Emergency Information\nStatus: ${patient.status}. Blood Type: ${patient.bloodType || 'N/A'}. Allergies: ${patient.allergies || 'None'}.\nEmergency Notes: ${patient.emergencyNotes}\n\n### Recorded Case History\n${patient.caseHistory?.length ? patient.caseHistory.map((c: any) => `• ${c.date} - ${c.incidentTitle}`).join('\n') : 'No past cases.'}\n\n*(Notice: Gemini request experienced network latency or invalid key; fallback record summary shown).*`,
      generatedAt: new Date().toISOString(),
      isAiAvailable: false,
      disclaimer: MEDICAL_DISCLAIMER,
    });
  }
});

// ---------------- AI Assistant (Gemini Chat) ----------------

app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const ai = getAIClient();

  // Hospital Context snapshot
  const contextData = {
    totalPatients: db.patients.length,
    identifiedCount: db.patients.filter((p) => p.status === 'Identified').length,
    unidentifiedCount: db.patients.filter((p) => p.status === 'Unidentified').length,
    totalEmergencyCases: db.emergencyCases.length,
    unidentifiedEmergencyCases: db.emergencyCases.filter((c) => c.identificationStatus === 'Unidentified').length,
    patientsSummary: db.patients.map((p) => ({
      id: p.id,
      name: p.fullName,
      status: p.status,
      age: p.age,
      gender: p.gender,
      fingerprintRefId: p.fingerprintRefId,
      remarks: p.identificationRemarks,
      emergencyNotes: p.emergencyNotes,
      casesCount: p.caseHistory?.length || 0,
    })),
    emergencyCasesSummary: db.emergencyCases.map((c) => ({
      id: c.id,
      temporaryId: c.temporaryId,
      status: c.identificationStatus,
      estimatedAge: c.estimatedAge,
      gender: c.gender,
      fingerprintRefId: c.fingerprintRefId,
      remarks: c.identificationRemarks,
      dateTime: c.dateTime,
      locationFound: c.locationFound,
      emergencyNotes: c.emergencyNotes,
    })),
  };

  if (!ai) {
    // Intelligent local fallback if Gemini key is not provided
    const lower = message.toLowerCase();
    let reply = '';

    if (lower.includes('unidentified') || lower.includes('unknown')) {
      const unIds = db.patients.filter((p) => p.status === 'Unidentified');
      const unCases = db.emergencyCases.filter((c) => c.identificationStatus === 'Unidentified');
      reply = `**Currently Unidentified Hospital Records:**\n\n• **Unidentified Patients (${unIds.length}):**\n${unIds.map((p) => `  - **${p.id}**: ${p.fullName}, Age: ${p.age}, Reference: \`${p.fingerprintRefId}\` (${p.identificationRemarks})`).join('\n')}\n\n• **Unidentified Emergency Cases (${unCases.length}):**\n${unCases.map((c) => `  - **${c.temporaryId}**: ${c.locationFound || 'Field'}, Reference: \`${c.fingerprintRefId}\` - Notes: ${c.emergencyNotes}`).join('\n')}\n\n*${MEDICAL_DISCLAIMER}*`;
    } else if (lower.includes('fingerprint') || lower.includes('fp-')) {
      const match = message.match(/fp-[\w-]+/i);
      if (match) {
        const queryFp = match[0].toUpperCase();
        const foundP = db.patients.find((p) => p.fingerprintRefId.toUpperCase().includes(queryFp));
        const foundC = db.emergencyCases.find((c) => c.fingerprintRefId.toUpperCase().includes(queryFp));
        reply = `**Biometric Reference Search for "${queryFp}":**\n` +
          (foundP ? `• Matched Patient: **${foundP.fullName}** (${foundP.id}) - Status: ${foundP.status}, Phone: ${foundP.phone}\n` : '') +
          (foundC ? `• Matched Emergency Case: **${foundC.temporaryId}** (${foundC.dateTime}) - Remarks: ${foundC.identificationRemarks}\n` : '') +
          (!foundP && !foundC ? `• No records matched biometric reference "${queryFp}".\n` : '') +
          `\n*${MEDICAL_DISCLAIMER}*`;
      } else {
        reply = `To search by biometric reference, please provide the reference code (e.g., "FP-8842-A1" or "FP-9904-UN").`;
      }
    } else if (lower.includes('patient') && (lower.includes('pid-') || lower.includes('summarize') || lower.includes('history'))) {
      const match = message.match(/pid-\d+/i);
      const targetP = match
        ? db.patients.find((p) => p.id.toLowerCase() === match[0].toLowerCase())
        : db.patients[0];

      if (targetP) {
        reply = `**Summary for ${targetP.fullName} (${targetP.id}):**\n- **Status:** ${targetP.status}\n- **Age/Gender:** ${targetP.age} / ${targetP.gender}\n- **Biometric Ref ID:** \`${targetP.fingerprintRefId}\`\n- **Remarks:** ${targetP.identificationRemarks || 'None'}\n- **Emergency Notes:** ${targetP.emergencyNotes || 'None'}\n- **Case History:** ${targetP.caseHistory?.length || 0} incidents recorded.\n\n*${MEDICAL_DISCLAIMER}*`;
      } else {
        reply = `Could not find the specified patient ID in the database. Available IDs: ${db.patients.map((p) => p.id).join(', ')}`;
      }
    } else if (lower.includes('emergency case') || lower.includes('emg-')) {
      const match = message.match(/emg-\d+/i);
      const targetC = match
        ? db.emergencyCases.find((c) => c.temporaryId.toLowerCase() === match[0].toLowerCase())
        : db.emergencyCases[0];

      if (targetC) {
        reply = `**Summary for Emergency Case ${targetC.temporaryId}:**\n- **Status:** ${targetC.identificationStatus}\n- **Time/Location:** ${targetC.dateTime} at ${targetC.locationFound || 'Intake'}\n- **Remarks:** ${targetC.identificationRemarks}\n- **Biometric Ref:** \`${targetC.fingerprintRefId}\`\n- **Triage Notes:** ${targetC.emergencyNotes}\n\n*${MEDICAL_DISCLAIMER}*`;
      } else {
        reply = `Emergency case not found. Available case IDs: ${db.emergencyCases.map((c) => c.temporaryId).join(', ')}`;
      }
    } else {
      reply = `**EmergencyCare AI Assistant (Local Mode):**\nCurrently managing **${contextData.totalPatients} Patients** (${contextData.identifiedCount} Identified, ${contextData.unidentifiedCount} Unidentified) and **${contextData.totalEmergencyCases} Emergency Cases**.\n\nYou can ask:\n• "Summarize patient PID-1042"\n• "Show unidentified emergency cases"\n• "Check fingerprint reference FP-8842-A1"\n• "Summarize case history for Liam Walker"\n\n*(Note: Configure \`GEMINI_API_KEY\` in Settings > Secrets for real-time generative conversational reasoning).* \n\n*${MEDICAL_DISCLAIMER}*`;
    }

    return res.json({
      reply,
      isAiAvailable: false,
    });
  }

  try {
    const systemInstruction = `You are the EmergencyCare AI Clinical Intake Assistant, an AI system created for hospital emergency staff during mass casualty and emergency intake situations.
You assist authorized hospital personnel in searching, cross-referencing, and summarizing patient identification and emergency cases.

CRITICAL OPERATIONAL RULES:
1. Base all facts STRICTLY on the real hospital database context provided below. Do not invent fictitious patients or external medical facts.
2. The AI must NOT diagnose diseases, prescribe medicines, or make treatment decisions.
3. Every response must be professional, factual, concise, and scannable.
4. Conclude your response or include the note: "${MEDICAL_DISCLAIMER}".

HOSPITAL DATABASE CONTEXT:
${JSON.stringify(contextData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      reply: response.text || 'No response generated.',
      isAiAvailable: true,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.json({
      reply: `Sorry, there was an issue communicating with the Gemini service (${error?.message || 'Network error'}). However, the hospital database is fully operational with ${db.patients.length} patients and ${db.emergencyCases.length} emergency cases registered.\n\n*${MEDICAL_DISCLAIMER}*`,
      isAiAvailable: false,
    });
  }
});

// ---------------- Server Start & Vite Middleware ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EmergencyCare AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
