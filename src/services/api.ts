import { Patient, EmergencyCase, User, AISummaryResult, AuditLogEntry } from '../types';

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async getDoctors(): Promise<{ currentDoctor: User; availableDoctors: User[] }> {
    const res = await fetch('/api/auth/doctors');
    if (!res.ok) throw new Error('Failed to fetch doctor directory');
    return res.json();
  },

  async switchDoctor(userId: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to switch doctor');
    return res.json();
  },

  async checkHealth(): Promise<{ status: string; geminiConfigured: boolean; patientsCount: number; emergencyCasesCount: number }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async addAuditLog(entry: Partial<AuditLogEntry>): Promise<AuditLogEntry> {
    const res = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed to record audit log');
    return res.json();
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    const res = await fetch('/api/patients');
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getPatient(id: string): Promise<Patient> {
    const res = await fetch(`/api/patients/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch patient record');
    return res.json();
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error('Failed to create patient');
    return res.json();
  },

  async updatePatient(id: string, patient: Partial<Patient>, meta?: { isGlobalMode?: boolean; user?: User }): Promise<Patient> {
    const res = await fetch(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patient, isGlobalMode: meta?.isGlobalMode, user: meta?.user }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update patient' }));
      throw new Error(err.error || 'Failed to update patient');
    }
    return res.json();
  },

  async deletePatient(id: string, meta?: { isGlobalMode?: boolean; user?: User }): Promise<void> {
    const res = await fetch(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGlobalMode: meta?.isGlobalMode, user: meta?.user }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete patient' }));
      throw new Error(err.error || 'Failed to delete patient');
    }
  },

  // Record-level Multi-Hospital append
  async appendPatientRecord(
    patientId: string,
    payload: {
      type: 'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline';
      record: any;
      user: User;
    }
  ): Promise<{ success: boolean; item: any; patient: Patient }> {
    const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/append-record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to append clinical record' }));
      throw new Error(err.error || 'Failed to append clinical record');
    }
    return res.json();
  },

  // Record-level update (Only Original Creator)
  async updatePatientRecord(
    patientId: string,
    payload: {
      recordType: 'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline';
      recordId: string;
      updatedData: any;
      user: User;
      isGlobalMode?: boolean;
    }
  ): Promise<{ success: boolean; updatedRecord: any; patient: Patient }> {
    const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/record`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update clinical record' }));
      throw new Error(err.error || 'Failed to update clinical record');
    }
    return res.json();
  },

  // Record-level delete (Only Original Creator)
  async deletePatientRecord(
    patientId: string,
    payload: {
      recordType: 'diagnosis' | 'medication' | 'report' | 'caseHistory' | 'timeline';
      recordId: string;
      user: User;
      isGlobalMode?: boolean;
    }
  ): Promise<{ success: boolean; patient: Patient }> {
    const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/record`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete clinical record' }));
      throw new Error(err.error || 'Failed to delete clinical record');
    }
    return res.json();
  },

  async addCaseHistory(patientId: string, entry: { incidentTitle: string; details: string; severity: string; location?: string; treatingPhysician?: string }): Promise<any> {
    const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed to add case history entry');
    return res.json();
  },

  // Emergency Cases
  async getEmergencyCases(): Promise<EmergencyCase[]> {
    const res = await fetch('/api/emergency-cases');
    if (!res.ok) throw new Error('Failed to fetch emergency cases');
    return res.json();
  },

  async getEmergencyCase(id: string): Promise<EmergencyCase> {
    const res = await fetch(`/api/emergency-cases/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch emergency case');
    return res.json();
  },

  async createEmergencyCase(caseData: Partial<EmergencyCase>): Promise<EmergencyCase> {
    const res = await fetch('/api/emergency-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });
    if (!res.ok) throw new Error('Failed to create emergency case');
    return res.json();
  },

  async updateEmergencyCase(id: string, caseData: Partial<EmergencyCase>): Promise<EmergencyCase> {
    const res = await fetch(`/api/emergency-cases/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });
    if (!res.ok) throw new Error('Failed to update emergency case');
    return res.json();
  },

  async deleteEmergencyCase(id: string): Promise<void> {
    const res = await fetch(`/api/emergency-cases/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete emergency case');
  },

  // AI Operations
  async generatePatientSummary(patient: Patient): Promise<AISummaryResult> {
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient }),
    });
    if (!res.ok) throw new Error('Failed to generate AI patient summary');
    return res.json();
  },

  async sendChatMessage(message: string, history: any[] = []): Promise<{ reply: string; isAiAvailable: boolean }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Failed to send AI message');
    return res.json();
  },

  async resetDemoData(): Promise<void> {
    const res = await fetch('/api/reset-demo-data', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
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
