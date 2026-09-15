export type PatientStatus = 'Identified' | 'Unidentified';

export type EmergencyStatus = 'Unidentified' | 'Identified' | 'In Progress';

export type TriageSeverity = 'Critical' | 'Severe' | 'Moderate' | 'Mild';

export interface DiagnosisRecord {
  id: string;
  condition: string;
  icdCode?: string;
  icd10Code?: string;
  severity?: string;
  treatmentPlan?: string;
  status: 'Active' | 'Resolved' | 'Chronic';
  diagnosedDate: string;
  doctorName: string;
  doctorId: string;
  hospitalName: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MedicationRecord {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: string;
  endDate?: string;
  prescribingDoctor?: string;
  prescribedByDoctor?: string;
  prescribedByDoctorId?: string;
  doctorId?: string;
  hospitalName: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  instructions?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MedicalReportRecord {
  id: string;
  title: string;
  type?: 'Lab Test' | 'Radiology / CT / X-Ray' | 'ECG Cardiac' | 'Discharge Summary' | 'Pathology' | 'Operative Report';
  category?: string;
  date?: string;
  reportDate?: string;
  hospitalName: string;
  doctorName: string;
  doctorId: string;
  summary: string;
  findings?: string;
  keyFindings?: string[];
  fileSize?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TreatmentTimelineRecord {
  id: string;
  date: string;
  milestone?: string;
  stageTitle?: string;
  hospitalName: string;
  doctorName: string;
  doctorId: string;
  details?: string;
  description?: string;
  outcome?: string;
  category: 'Admission' | 'Surgery' | 'Triage' | 'Discharge' | 'Medication Change' | 'Transfer' | 'Consultation' | string;
  createdAt: string;
}

export interface CaseHistoryEntry {
  id: string;
  date: string;
  incidentTitle: string;
  details: string;
  location?: string;
  severity: TriageSeverity | string;
  treatingPhysician?: string;
  treatingPhysicianId?: string;
  doctorId?: string;
  hospitalName?: string;
  diagnosis?: string;
  caseStudyNotes?: string;
  outcome?: string;
  createdAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'GLOBAL_VIEW_ACCESS'
    | 'CROSS_HOSPITAL_RECORD_ACCESSED'
    | 'SEARCH_UNIDENTIFIED_GLOBAL'
    | 'ADD_CROSS_HOSPITAL_RECORD'
    | 'CROSS_HOSPITAL_RECORD_APPENDED'
    | 'BLOCKED_UNAUTHORIZED_EDIT'
    | 'BLOCKED_UNAUTHORIZED_DELETE'
    | 'RECORD_UPDATED_BY_CREATOR'
    | 'RECORD_DELETED_BY_CREATOR'
    | 'PATIENT_RECORD_CREATED'
    | 'NOTIFICATION_SENT'
    | 'NOTIFICATION_VIEWED'
    | 'TREATMENT_UPDATE_ACCEPTED'
    | 'PATIENT_RECORD_UPDATED'
    | 'NOTIFICATION_REJECTED';
  actorId: string;
  actorName: string;
  actorBadge: string;
  actorRole: string;
  actorHospital: string;
  targetPatientId?: string;
  targetPatientName?: string;
  targetRecordId?: string;
  details: string;
  status: 'SUCCESS' | 'FLAGGED' | 'DENIED';
}

export interface Patient {
  id: string; // e.g. PID-2041
  fullName: string;
  age: number | string;
  gender: string;
  phone: string;
  photo: string;
  identificationRemarks: string;
  fingerprintRefId: string; // labeled Identification Reference
  emergencyNotes: string;
  status: PatientStatus;
  bloodType?: string;
  allergies?: string;
  originHospital?: string;
  registeredByDoctor?: string;
  registeredByDoctorId?: string;
  diagnoses?: DiagnosisRecord[];
  medications?: MedicationRecord[];
  medicalReports?: MedicalReportRecord[];
  treatmentTimeline?: TreatmentTimelineRecord[];
  caseHistory: CaseHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyCase {
  id: string; // e.g. EMG-8104
  temporaryId: string; // Temporary Emergency ID
  photo: string;
  estimatedAge: string;
  gender: string;
  identificationRemarks: string;
  fingerprintRefId: string; // Identification Reference
  emergencyNotes: string;
  dateTime: string;
  identificationStatus: EmergencyStatus;
  triageLevel?: 'Immediate' | 'Delayed' | 'Minimal' | 'Expectant';
  locationFound?: string;
  linkedPatientId?: string;
  hospitalName?: string;
  recordedByDoctor?: string;
  recordedByDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  badgeNumber: string;
  hospitalUnit: string;
  hospitalName: string;
}

export interface AISummaryResult {
  summary: string;
  sections?: {
    identificationInfo: string;
    emergencyInfo: string;
    identificationStatus: string;
    recordedCaseHistory: string;
    importantRecordedNotes: string;
  };
  generatedAt: string;
  isAiAvailable: boolean;
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourceReferences?: string[];
}

export type NotificationStatus = 'Pending Review' | 'Reviewed' | 'Record Updated' | 'Rejected';

export interface TreatmentNotificationAttachment {
  id: string;
  fileName: string;
  fileType: 'Prescription' | 'Discharge Summary' | 'Medical Report' | 'Lab Report' | 'Other';
  fileSize?: string;
  fileUrl?: string;
  summary?: string;
}

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface TreatmentNotification {
  id: string; // e.g. NOTIF-1092
  patientId: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  patientFingerprintRef?: string;
  patientBloodType?: string;

  // Emergency Doctor (Sender)
  senderDoctorId: string;
  senderDoctorName: string;
  senderHospital: string;
  senderRole?: string;

  // Regular Doctor (Recipient)
  recipientDoctorId: string;
  recipientDoctorName: string;
  recipientHospital: string;

  // Treatment Details
  treatmentDate: string;
  emergencyReason: string;
  diagnosis: string;
  clinicalFindings?: string;
  treatmentProvided: string;
  procedures?: string;
  medications?: PrescribedMedicine[];
  followUpInstructions?: string;
  notes?: string;
  attachments?: TreatmentNotificationAttachment[];

  // Status & Timestamps
  status: NotificationStatus;
  createdAt: string;
  viewedAt?: string;
  reviewedAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  recordUpdatedDetails?: {
    caseHistoryId?: string;
    diagnosisId?: string;
    medicationIds?: string[];
    reportId?: string;
    timelineId?: string;
    updatedByDoctorName?: string;
    updatedAt?: string;
  };
}

export type ActiveView =
  | 'dashboard'
  | 'patients'
  | 'register-patient'
  | 'search-patient'
  | 'patient-profile'
  | 'emergency-case'
  | 'emergency-cases'
  | 'ai-assistant'
  | 'global'
  | 'notify'
  | 'settings';
