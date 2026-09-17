import { Patient, EmergencyCase } from '../types';

export interface VoiceQueryResponse {
  patient?: Patient;
  emergencyCase?: EmergencyCase;
  spokenSummary: string;
  spokenSummaryTamil: string;
  displayText: string;
  category: 'patient' | 'emergency' | 'general' | 'not_found';
  criticalAlerts?: string[];
  keyVitals?: { label: string; value: string }[];
  activeMeds?: string[];
}

// Check Web Speech Recognition availability
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Check Speech Synthesis availability
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

// Helper to clean markdown for spoken voice (remove asterisks, brackets, raw IDs, etc.)
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[•\-\+]\s+/g, ', ')
    .replace(/\n\s*\n/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Match patient from verbal spoken query
export function matchPatientFromSpokenQuery(
  query: string,
  patients: Patient[],
  emergencyCases: EmergencyCase[]
): {
  patient?: Patient;
  emergencyCase?: EmergencyCase;
} {
  const q = query.toLowerCase().trim();

  // 1. Direct PID search (e.g. "PID-1042", "1042", "pid 1042")
  const pidMatch = q.match(/pid[-\s]?(\d+)/i) || q.match(/\b(1042|2041|3019|4088|5091|6012|7023|8034)\b/);
  if (pidMatch) {
    const rawNum = pidMatch[1] || pidMatch[0];
    const found = patients.find((p) => p.id.toLowerCase().includes(rawNum.toLowerCase()));
    if (found) return { patient: found };
  }

  // 2. Emergency Case ID search (e.g. "TEMP-9901", "9901", "EMG-7701", "7701")
  const emgMatch = q.match(/(temp|emg)[-\s]?(\d+)/i) || q.match(/\b(9901|9902|9903|9904|7701|8802)\b/);
  if (emgMatch) {
    const rawNum = emgMatch[2] || emgMatch[0];
    const foundCase = emergencyCases.find(
      (c) => c.temporaryId.toLowerCase().includes(rawNum.toLowerCase()) || (c.id && c.id.toLowerCase().includes(rawNum.toLowerCase()))
    );
    if (foundCase) return { emergencyCase: foundCase };
  }

  // 3. Match by Patient Name (English & Tamil transliterations)
  const nameMappings: Record<string, string[]> = {
    'rajesh': ['rajesh', 'sharma', 'ராஜேஷ்', 'சர்மா'],
    'meera': ['meera', 'patel', 'மீரா', 'படேல்'],
    'priya': ['priya', 'nair', 'பிரியா', 'நாயர்'],
    'david': ['david', 'miller', 'டேவிட்', 'மில்லர்'],
    'vikram': ['vikram', 'singh', 'விக்ரம்', 'சிங்'],
    'sunita': ['sunita', 'verma', 'சுனிதா', 'வர்மா'],
    'liam': ['liam', 'walker', 'லியாம்', 'வால்கர்'],
    'elena': ['elena', 'rodriguez', 'எலினா', 'ரோட்ரிக்ஸ்'],
    'kavitha': ['kavitha', 'ரவி', 'கவிதா'],
    'arun': ['arun', 'அருண்'],
  };

  for (const patient of patients) {
    const pName = patient.fullName.toLowerCase();
    const parts = pName.split(/\s+/);
    for (const part of parts) {
      if (part.length > 2 && q.includes(part)) {
        return { patient };
      }
    }
  }

  for (const [key, variants] of Object.entries(nameMappings)) {
    for (const variant of variants) {
      if (q.includes(variant)) {
        const found = patients.find((p) => p.fullName.toLowerCase().includes(key));
        if (found) return { patient: found };
      }
    }
  }

  // 4. Match by Diagnosis or Condition in query (e.g. "asthma", "diabetes", "cardiac", "fracture", "penicillin")
  if (q.includes('penicillin') || q.includes('பென்சிலின்')) {
    const found = patients.find((p) => p.allergies?.toLowerCase().includes('penicillin'));
    if (found) return { patient: found };
  }

  if (q.includes('diabetes') || q.includes('நீரிழிவு') || q.includes('சர்க்கரை')) {
    const found = patients.find((p) =>
      p.diagnoses?.some((d) => d.condition.toLowerCase().includes('diabetes'))
    );
    if (found) return { patient: found };
  }

  if (q.includes('asthma') || q.includes('ஆஸ்துமா')) {
    const found = patients.find((p) =>
      p.diagnoses?.some((d) => d.condition.toLowerCase().includes('asthma'))
    );
    if (found) return { patient: found };
  }

  return {};
}

// Generate spoken clinical audio summary for a patient
export function generateSpokenPatientSummary(patient: Patient, query?: string): VoiceQueryResponse {
  const activeDiagnoses = patient.diagnoses?.filter((d) => d.status === 'Active') || [];
  const activeMeds = patient.medications?.filter((m) => m.status === 'Active') || [];
  const allergies = patient.allergies || 'No documented drug allergies';
  const blood = patient.bloodType || 'Unknown blood group';

  const diagNames = activeDiagnoses.map((d) => d.condition).join(', ') || 'No active chronic diagnoses';
  const medSummaries = activeMeds.map((m) => `${m.name} ${m.dosage || ''}`.trim()).join(', ') || 'None currently active';

  // Critical alerts
  const criticalAlerts: string[] = [];
  if (patient.allergies && !patient.allergies.toLowerCase().includes('none') && !patient.allergies.toLowerCase().includes('nkda')) {
    criticalAlerts.push(`Allergy Alert: ${patient.allergies}`);
  }
  if (patient.emergencyNotes) {
    criticalAlerts.push(`Emergency Note: ${patient.emergencyNotes}`);
  }

  // Recent timeline or vitals
  const latestTimeline = patient.treatmentTimeline && patient.treatmentTimeline.length > 0 ? patient.treatmentTimeline[0] : null;

  // Spoken English Script (natural speech cadence)
  let spokenSummary = `Doctor, here is the clinical briefing for ${patient.fullName}. `;
  spokenSummary += `${patient.age} year old ${patient.gender}. Blood group is ${blood}. `;

  if (criticalAlerts.length > 0) {
    spokenSummary += `Warning. Critical alerts: ${criticalAlerts.join('. ')}. `;
  } else {
    spokenSummary += `No known drug allergies. `;
  }

  spokenSummary += `Active diagnoses include: ${diagNames}. `;
  spokenSummary += `Current active medications: ${medSummaries}. `;

  if (latestTimeline) {
    spokenSummary += `Most recent hospital note from ${latestTimeline.hospitalName}: ${latestTimeline.description}. `;
  }

  if (patient.emergencyNotes) {
    spokenSummary += `Emergency intake remarks: ${patient.emergencyNotes}. `;
  }

  spokenSummary += `Patient medical locker ID is ${patient.id}.`;

  // Spoken Tamil Script (clean Tamil voice audio)
  let spokenSummaryTamil = `வணக்கம் டாக்டர். நோயாளி ${patient.fullName} அவர்களின் மருத்துவ சுருக்கம். `;
  spokenSummaryTamil += `வயது ${patient.age}, ${patient.gender === 'Female' ? 'பெண்' : 'ஆண்'}, ரத்த வகை ${blood}. `;

  if (criticalAlerts.length > 0) {
    spokenSummaryTamil += `முக்கிய எச்சரிக்கை: ${patient.allergies ? 'அலர்ஜி: ' + patient.allergies : ''}. `;
  } else {
    spokenSummaryTamil += `மருந்து ஒவ்வாமை எதுவும் பதிவு செய்யப்படவில்லை. `;
  }

  spokenSummaryTamil += `தற்போதைய நோய் நிலை: ${diagNames}. `;
  spokenSummaryTamil += `எடுத்துக்கொள்ளும் மருந்துகள்: ${medSummaries}. `;

  if (patient.emergencyNotes) {
    spokenSummaryTamil += `அவசர குறிப்பு: ${patient.emergencyNotes}. `;
  }

  spokenSummaryTamil += `நோயாளி அடையாள எண் ${patient.id}.`;

  // Formatted display text
  const displayText = `**Clinical Summary for ${patient.fullName} (${patient.id})**
• **Demographics:** ${patient.age} yrs • ${patient.gender} • Blood Group: **${blood}**
• **Critical Alerts:** ${criticalAlerts.length > 0 ? criticalAlerts.join(' | ') : 'No Known Drug Allergies (NKDA)'}
• **Active Diagnoses:** ${diagNames}
• **Active Medications:** ${medSummaries}
• **Identification Status:** ${patient.status} (Biometric Ref: \`${patient.fingerprintRefId}\`)
${patient.emergencyNotes ? `• **Triage Notes:** ${patient.emergencyNotes}` : ''}`;

  return {
    patient,
    spokenSummary,
    spokenSummaryTamil,
    displayText,
    category: 'patient',
    criticalAlerts,
    activeMeds: activeMeds.map((m) => `${m.name} (${m.dosage})`),
  };
}

// Generate spoken summary for an emergency case
export function generateSpokenEmergencySummary(emergencyCase: EmergencyCase): VoiceQueryResponse {
  const status = emergencyCase.identificationStatus;
  const time = emergencyCase.dateTime || 'Recently admitted';
  const location = emergencyCase.locationFound || 'Hospital Trauma Bay';
  const notes = emergencyCase.emergencyNotes || 'Patient in triage';

  const spokenSummary = `Doctor, here is the briefing for Emergency Trauma Case ${emergencyCase.temporaryId}. Status is ${status}. Admitted ${time} at ${location}. Biometric identification reference is ${emergencyCase.fingerprintRefId}. Clinical intake notes: ${notes}. Awaiting family verification and positive biometric match.`;

  const spokenSummaryTamil = `வணக்கம் டாக்டர். அவசர விபத்து வழக்கு ${emergencyCase.temporaryId} சுருக்கம். நிலை: ${status}. சேர்க்கப்பட்ட நேரம் ${time}, இடம்: ${location}. பயோமெட்ரிக் குறிப்பு எண்: ${emergencyCase.fingerprintRefId}. மருத்துவக் குறிப்பு: ${notes}.`;

  const displayText = `**Emergency Trauma Case ${emergencyCase.temporaryId}**
• **Status:** ${status}
• **Intake Time & Location:** ${time} at ${location}
• **Biometric Ref:** \`${emergencyCase.fingerprintRefId}\`
• **Remarks:** ${emergencyCase.identificationRemarks}
• **Triage Notes:** ${notes}`;

  return {
    emergencyCase,
    spokenSummary,
    spokenSummaryTamil,
    displayText,
    category: 'emergency',
    criticalAlerts: [`Emergency Case: ${status}`, `Triage: ${notes}`],
  };
}

// Process voice query with intelligent routing
export function processDoctorVoiceQuery(
  rawQuery: string,
  patients: Patient[],
  emergencyCases: EmergencyCase[]
): VoiceQueryResponse {
  const match = matchPatientFromSpokenQuery(rawQuery, patients, emergencyCases);

  if (match.patient) {
    return generateSpokenPatientSummary(match.patient, rawQuery);
  }

  if (match.emergencyCase) {
    return generateSpokenEmergencySummary(match.emergencyCase);
  }

  const q = rawQuery.toLowerCase();

  // Summary of all unidentified cases
  if (q.includes('unidentified') || q.includes('unknown') || q.includes('அடையாளம் தெரியாத') || q.includes('யார்')) {
    const unIds = patients.filter((p) => p.status === 'Unidentified');
    const unCases = emergencyCases.filter((c) => c.identificationStatus === 'Unidentified');

    const spokenSummary = `Doctor, there are currently ${unIds.length} unidentified patients and ${unCases.length} unidentified emergency cases in the hospital. Unidentified patient IDs are ${unIds.map((p) => p.id).join(', ')}. Emergency case IDs are ${unCases.map((c) => c.temporaryId).join(', ')}.`;

    const spokenSummaryTamil = `டாக்டர், மருத்துவமனையில் தற்போது ${unIds.length} அடையாளம் தெரியாத நோயாளிகளும், ${unCases.length} அடையாளம் தெரியாத அவசர வழக்குகளும் உள்ளன. அவர்களின் விவரங்களை திரையில் காணலாம்.`;

    const displayText = `**Currently Unidentified Hospital Records:**
• **Unidentified Patients (${unIds.length}):** ${unIds.map((p) => `${p.id} (${p.fullName}, Age: ${p.age})`).join(', ')}
• **Unidentified Emergency Cases (${unCases.length}):** ${unCases.map((c) => `${c.temporaryId} (${c.locationFound || 'Field'})`).join(', ')}`;

    return {
      spokenSummary,
      spokenSummaryTamil,
      displayText,
      category: 'general',
    };
  }

  // Fallback when not found
  const spokenSummary = `Doctor, I could not find a specific patient record matching your voice query: "${rawQuery}". Please specify the patient's name, such as Rajesh Sharma or Meera Patel, or state their ID like PID-1042.`;
  const spokenSummaryTamil = `மன்னிக்கவும் டாக்டர், நீங்கள் கூறிய "${rawQuery}" என்ற பெயரிலோ அல்லது எண்ணிலோ நோயாளி விவரம் கிடைக்கவில்லை. தயவுசெய்து ராஜேஷ் ஷர்மா, மீரா அல்லது PID-1042 போன்ற அடையாளத்தை கூறி கேட்கவும்.`;
  const displayText = `Could not find a record matching: "${rawQuery}".

**Try saying:**
• "Tell me about patient Rajesh Sharma"
• "What are the active medications and allergies for PID-1042?"
• "Show me recent emergency cases"
• "பேஷன்ட் ராஜேஷ் ஷர்மா பற்றி சொல்லு"`;

  return {
    spokenSummary,
    spokenSummaryTamil,
    displayText,
    category: 'not_found',
  };
}

// Universal Text-to-Speech Player Manager
class SpeechController {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private onStateChangeCallbacks: Set<(isSpeaking: boolean, isPaused: boolean) => void> = new Set();

  public subscribe(cb: (isSpeaking: boolean, isPaused: boolean) => void) {
    this.onStateChangeCallbacks.add(cb);
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  private notify() {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.isSpeaking, this.isPaused));
  }

  public speak(
    text: string,
    options: {
      lang?: 'en-US' | 'en-IN' | 'ta-IN' | 'hi-IN';
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!isSpeechSynthesisSupported()) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    this.stop();

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options.lang || 'en-IN';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Pick best available voice matching requested language
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (options.lang === 'ta-IN') {
        const tamilVoice = voices.find((v) => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
        if (tamilVoice) utterance.voice = tamilVoice;
      } else {
        const preferredVoice =
          voices.find((v) => v.lang === 'en-IN' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))) ||
          voices.find((v) => v.lang === 'en-IN') ||
          voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.notify();
    };

    utterance.onpause = () => {
      this.isPaused = true;
      this.notify();
    };

    utterance.onresume = () => {
      this.isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify();
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify();
      options.onError?.(e);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause(): void {
    if (!isSpeechSynthesisSupported()) return;
    if (this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume(): void {
    if (!isSpeechSynthesisSupported()) return;
    if (this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  public stop(): void {
    if (!isSpeechSynthesisSupported()) return;
    window.speechSynthesis.cancel();
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.notify();
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const speechController = new SpeechController();
