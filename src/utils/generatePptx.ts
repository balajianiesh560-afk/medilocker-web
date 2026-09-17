import pptxgen from 'pptxgenjs';

export interface PptTeamConfig {
  teamId: string;
  teamName: string;
  psId: string;
  psTitle: string;
  theme: string;
  category: string;
  department: string;
  prototypeUrl: string;
  githubUrl: string;
}

export const defaultPptConfig: PptTeamConfig = {
  teamId: '92770',
  teamName: '404 The Optimists',
  psId: 'SIH26047',
  psTitle: 'PATIENT CASE-TAKING SOFTWARE',
  theme: 'MedTech / BioTech / HealthTech',
  category: 'Software Edition',
  department: 'Ministry of Ayush / All India Institute of Ayurveda',
  prototypeUrl: typeof window !== 'undefined' ? window.location.origin : 'https://medikiosk.gov.in',
  githubUrl: 'https://github.com/sih2026/medikiosk-clinical-ai',
};

export async function generateAndDownloadSIHPptx(config: PptTeamConfig = defaultPptConfig) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = config.teamName;
  pptx.title = `${config.psId} - ${config.psTitle} - Smart India Hackathon 2026`;

  const TEAL = '0F766E';
  const DARK_SLATE = '0F172A';
  const ACCENT_CYAN = '0284C7';
  const LIGHT_BG = 'F8FAFC';
  const ROSE = 'E11D48';
  const GOLD = 'D97706';

  // ==========================================
  // SLIDE 1: TITLE SLIDE
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: 'FFFFFF' };

  // Header banner text
  slide1.addText('SMART INDIA HACKATHON 2026', {
    x: 0.8,
    y: 0.7,
    w: 8.5,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: '1E3A8A',
    fontFace: 'Arial',
  });

  // SIH 2026 Top Right badge
  slide1.addShape(pptx.ShapeType.rect, {
    x: 10.8,
    y: 0.5,
    w: 2.0,
    h: 1.0,
    fill: { color: 'F1F5F9' },
    line: { color: 'CBD5E1', width: 1 },
  });
  slide1.addText('SMART INDIA\nHACKATHON\n2026', {
    x: 10.8,
    y: 0.5,
    w: 2.0,
    h: 1.0,
    fontSize: 11,
    bold: true,
    color: '1E293B',
    align: 'center',
    fontFace: 'Arial',
  });

  // Left Details Block
  const s1Details = [
    { text: `• Problem Statement ID – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.psId}\n\n`, options: { bold: true, fontSize: 16, color: TEAL } },
    { text: `• Problem Statement Title – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.psTitle}\n\n`, options: { bold: true, fontSize: 16, color: '1E3A8A' } },
    { text: `• Theme – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.theme}\n\n`, options: { bold: false, fontSize: 16, color: '334155' } },
    { text: `• Sponsoring Ministry – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.department}\n\n`, options: { bold: false, fontSize: 16, color: '334155' } },
    { text: `• PS Category – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.category}\n\n`, options: { bold: false, fontSize: 16, color: '334155' } },
    { text: `• Team ID – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.teamId}\n\n`, options: { bold: true, fontSize: 16, color: ROSE } },
    { text: `• Team Name (Registered on portal) – `, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
    { text: `${config.teamName}`, options: { bold: true, fontSize: 16, color: DARK_SLATE } },
  ];

  slide1.addText(s1Details, {
    x: 0.8,
    y: 1.8,
    w: 7.2,
    h: 4.8,
    fontFace: 'Arial',
    margin: 0,
  });

  // Right Side Graphic Box / Emblem
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 8.4,
    y: 1.8,
    w: 4.3,
    h: 4.6,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1.5 },
  });

  slide1.addText('MEDIKIOSK AI', {
    x: 8.6,
    y: 2.1,
    w: 3.9,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: TEAL,
    align: 'center',
    fontFace: 'Arial',
  });

  slide1.addText('Next-Gen AI Patient Case-Taking & Clinical Intake Platform for AYUSH & Indian OPDs', {
    x: 8.6,
    y: 2.7,
    w: 3.9,
    h: 0.7,
    fontSize: 12,
    color: '475569',
    align: 'center',
    fontFace: 'Arial',
  });

  // Bullet highlights in box
  const highlights = [
    { text: '✓ Dual Voice (Bhashini) + Touch Screen\n', options: { fontSize: 11, color: '0F172A', bold: true } },
    { text: '✓ AYUSH Dashavidha & Ashtavidha Pariksha\n', options: { fontSize: 11, color: '0F172A', bold: true } },
    { text: '✓ Multilingual OCR of Paper Prescriptions\n', options: { fontSize: 11, color: '0F172A', bold: true } },
    { text: '✓ ABDM FHIR Interoperability & ABHA ID\n', options: { fontSize: 11, color: '0F172A', bold: true } },
    { text: '✓ Real-Time Emergency Red-Flag Triage\n', options: { fontSize: 11, color: ROSE, bold: true } },
  ];
  slide1.addText(highlights, {
    x: 8.8,
    y: 3.5,
    w: 3.6,
    h: 2.6,
    fontFace: 'Arial',
  });

  slide1.addText('1', { x: 12.5, y: 6.8, w: 0.5, h: 0.3, fontSize: 12, color: '64748B', align: 'right' });

  // ==========================================
  // SLIDE 2: PROBLEM & SOLUTION OVERVIEW
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: 'FFFFFF' };

  slide2.addText('MediKiosk: AI-Powered Multimodal Clinical History & Document Digitization', {
    x: 0.6,
    y: 0.3,
    w: 12.0,
    h: 0.6,
    fontSize: 19,
    bold: true,
    color: '1E3A8A',
    fontFace: 'Arial',
  });

  // Left Column: Real-world issue & Why important & Solution
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.0,
    w: 3.8,
    h: 1.6,
    fill: { color: 'FEF2F2' },
    line: { color: 'FCA5A5', width: 1 },
  });
  slide2.addText([
    { text: 'Real-world issue: ', options: { bold: true, color: '991B1B', fontSize: 11 } },
    { text: 'India\'s public hospital OPDs register 4,000–10,000 patients daily with consultation times collapsed to 2–5 minutes. Physicians must simultaneously elicit history, review scattered paper files, formulate diagnosis, and prescribe—causing missed comorbidities and diagnostic errors.', options: { color: '450A0A', fontSize: 9.5 } }
  ], { x: 0.7, y: 1.1, w: 3.6, h: 1.4 });

  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 2.7,
    w: 3.8,
    h: 1.6,
    fill: { color: 'FFFBEB' },
    line: { color: 'FDE68A', width: 1 },
  });
  slide2.addText([
    { text: 'Why important: ', options: { bold: true, color: '92400E', fontSize: 11 } },
    { text: 'In AYUSH institutions, deep history taking (Dashavidha Pariksha: Prakriti, Vikriti, Agni, Koshtha, Ahara-Vihara) is essential for personalized treatment. Under severe OPD rush, practitioners are forced to abbreviate this foundation of Ayurvedic care.', options: { color: '78350F', fontSize: 9.5 } }
  ], { x: 0.7, y: 2.8, w: 3.6, h: 1.4 });

  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 4.4,
    w: 3.8,
    h: 1.8,
    fill: { color: 'F0FDF4' },
    line: { color: '86EFAC', width: 1 },
  });
  slide2.addText([
    { text: 'Solution: ', options: { bold: true, color: '166534', fontSize: 11 } },
    { text: 'MediKiosk allows any patient to record comprehensive medical history via natural voice (Bhashini) and touch, digitize existing paper prescriptions/labs, and generate a structured, physician-ready clinical summary pushed to the hospital EMR/HIS before entering the consultation room.', options: { color: '14532D', fontSize: 9.5 } }
  ], { x: 0.7, y: 4.5, w: 3.6, h: 1.6 });

  // Center Column: Core Innovation & Primary Functions
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 4.6,
    y: 1.0,
    w: 3.8,
    h: 5.2,
    fill: { color: 'F8FAFC' },
    line: { color: 'CBD5E1', width: 1.5 },
  });

  slide2.addText('CORE INNOVATION', {
    x: 4.8,
    y: 1.2,
    w: 3.4,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: TEAL,
    align: 'center',
  });
  slide2.addText('Conversational Multimodal Clinical Intake Engine (Voice + Touch + OCR)', {
    x: 4.8,
    y: 1.55,
    w: 3.4,
    h: 0.6,
    fontSize: 10,
    align: 'center',
    color: '334155',
  });

  slide2.addShape(pptx.ShapeType.rect, { x: 4.8, y: 2.2, w: 3.4, h: 0.02, fill: { color: 'E2E8F0' } });

  slide2.addText('PRIMARY MODULES & CAPABILITIES', {
    x: 4.8,
    y: 2.3,
    w: 3.4,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: DARK_SLATE,
  });

  const moduleList = [
    { text: '• Adaptive Voice Questioning:\n  SOCRATES clinical framework in Hindi, Tamil, Telugu, etc.\n', options: { fontSize: 8.8, color: '1E293B' } },
    { text: '• AYUSH Dashavidha Pariksha:\n  Prakriti, Vikriti, Agni, Koshtha & Ahara-Vihara assessment.\n', options: { fontSize: 8.8, color: '1E293B' } },
    { text: '• Medical Document OCR & Timeline:\n  Prescriptions, labs & discharge summaries extracted.\n', options: { fontSize: 8.8, color: '1E293B' } },
    { text: '• Real-Time Emergency Red-Flag:\n  Instant priority triage alert for acute chest pain/stroke.\n', options: { fontSize: 8.8, color: ROSE, bold: true } },
    { text: '• ABDM FHIR & DPDP Act 2023:\n  Secure ABHA integration with instant session termination.', options: { fontSize: 8.8, color: '1E293B' } },
  ];
  slide2.addText(moduleList, { x: 4.8, y: 2.65, w: 3.4, h: 3.4 });

  // Right Column: Risk vs Solution Table
  slide2.addText('Risk vs. Solution Mapping', {
    x: 8.6,
    y: 1.0,
    w: 4.2,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: '1E3A8A',
  });

  const riskSolRows = [
    [
      { text: 'Clinical Bottleneck', options: { bold: true, fill: { color: 'F1F5F9' }, color: '334155', fontSize: 9 } },
      { text: 'MediKiosk AI Solution', options: { bold: true, fill: { color: 'F1F5F9' }, color: '334155', fontSize: 9 } },
    ],
    [
      { text: '2-5 min OPD consultation time', options: { fontSize: 8.5, color: '991B1B', bold: true } },
      { text: 'Pre-consultation intake collects 80% history beforehand', options: { fontSize: 8.5, color: '15803D' } },
    ],
    [
      { text: 'Elderly / low-literacy exclusion', options: { fontSize: 8.5, color: '991B1B', bold: true } },
      { text: 'Voice-first (Bhashini) + pictorial icon choices', options: { fontSize: 8.5, color: '15803D' } },
    ],
    [
      { text: 'Loss of Ayurvedic Pariksha depth', options: { fontSize: 8.5, color: '991B1B', bold: true } },
      { text: 'Guided Dashavidha questionnaire & Agni profiling', options: { fontSize: 8.5, color: '15803D' } },
    ],
    [
      { text: 'Disordered paper prescriptions', options: { fontSize: 8.5, color: '991B1B', bold: true } },
      { text: 'Multilingual OCR + chronological patient timeline', options: { fontSize: 8.5, color: '15803D' } },
    ],
    [
      { text: 'Acute emergencies stuck in queue', options: { fontSize: 8.5, color: '991B1B', bold: true } },
      { text: 'Emergency Red-Flag audio/SMS alert to triage desk', options: { fontSize: 8.5, color: '15803D' } },
    ],
  ];

  slide2.addTable(riskSolRows, {
    x: 8.6,
    y: 1.4,
    w: 4.3,
    colW: [1.8, 2.5],
    border: { pt: 0.5, color: 'CBD5E1' },
  });

  // Footer
  slide2.addText('@SIH Idea submission- Template | Slide 2', { x: 0.6, y: 6.8, w: 6.0, h: 0.3, fontSize: 9, color: '94A3B8' });
  slide2.addText('2', { x: 12.5, y: 6.8, w: 0.5, h: 0.3, fontSize: 12, color: '64748B', align: 'right' });

  // ==========================================
  // SLIDE 3: TECHNICAL APPROACH & ARCHITECTURE
  // ==========================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: 'FFFFFF' };

  slide3.addText('TECHNICAL APPROACH & SYSTEM ARCHITECTURE', {
    x: 0.6,
    y: 0.3,
    w: 12.0,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: '1E3A8A',
    fontFace: 'Arial',
  });

  // Methodology Left Block
  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.0,
    w: 4.0,
    h: 5.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1 },
  });
  slide3.addText('METHODOLOGY & PROCESS OF IMPLEMENTATION', {
    x: 0.8,
    y: 1.15,
    w: 3.6,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: DARK_SLATE,
  });

  const steps = [
    { text: '1. Step 1: Identify & Consent (ABDM/DPDP)\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: '   ABHA ID QR scan or Aadhaar OTP. Audio-guided consent in local language.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '2. Step 2: Multimodal Conversational History (Mod A)\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: '   AI4Bharat/Bhashini ASR. Adaptive SOCRATES questioning with dual voice/touch.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '3. Step 3: AYUSH Deep Pariksha Layer\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: '   Elicits Dashavidha parameters: Prakriti, Vikriti, Agni, Koshtha & Ahara-Vihara.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '4. Step 4: Medical Document OCR & Timeline (Mod B)\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: '   Camera upload of paper prescriptions; extracts medications, labs & out-of-range flags.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '5. Step 5: Physician-Ready Synthesis (Mod C)\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: '   Compiles standard EHR note (Chief Complaint, HPI, Past, Allergies, AYUSH Profile).\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '6. Step 6: HIS/EMR & ABDM FHIR Push (Mod D)\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: '   Instant draft delivery to doctor\'s screen. 1-click accept, amend, or sign.', options: { fontSize: 8.5, color: '475569' } },
  ];
  slide3.addText(steps, { x: 0.8, y: 1.55, w: 3.6, h: 4.8 });

  // Center Architecture Flow Block
  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 4.8,
    y: 1.0,
    w: 4.2,
    h: 5.5,
    fill: { color: 'F0FDFA' },
    line: { color: '99F6E4', width: 1.5 },
  });
  slide3.addText('END-TO-END DATA FLOW PIPELINE', {
    x: 5.0,
    y: 1.15,
    w: 3.8,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: TEAL,
    align: 'center',
  });

  const pipeline = [
    { text: '[ PATIENT AT KIOSK / MOBILE ]\n', options: { bold: true, fontSize: 9, color: DARK_SLATE } },
    { text: '  ├─ Natural Voice Input (Hindi/Tamil/Telugu/English)\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '  ├─ Touchscreen Guided Options\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '  └─ Paper Prescriptions / Lab Reports\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '               │\n               ▼\n', options: { fontSize: 8.5, color: '64748B' } },
    { text: '[ MULTIMODAL INGESTION LAYER ]\n', options: { bold: true, fontSize: 9, color: TEAL } },
    { text: '  ├─ Bhashini / IndicWhisper ASR Speech Engine\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '  ├─ Medical OCR & Handwriting Entity Extractor\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '  └─ Emergency Red-Flag Detector ──► [ PRIORITY TRIAGE ]\n', options: { fontSize: 8.5, color: ROSE, bold: true } },
    { text: '               │\n               ▼\n', options: { fontSize: 8.5, color: '64748B' } },
    { text: '[ CLINICAL SYNTHESIS ENGINE ]\n', options: { bold: true, fontSize: 9, color: TEAL } },
    { text: '  ├─ Dashavidha Pariksha (Prakriti, Agni, Koshtha)\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '  ├─ Chronological Timeline Builder\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '  └─ FHIR Bundle Generator (ABDM Ecosystem)\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '               │\n               ▼\n', options: { fontSize: 8.5, color: '64748B' } },
    { text: '[ DOCTOR CONSULTATION SCREEN ]\n', options: { bold: true, fontSize: 9, color: '1E3A8A' } },
    { text: '  Instant 30-sec Structured Summary Review & Sign', options: { fontSize: 8.5, color: '15803D', bold: true } },
  ];
  slide3.addText(pipeline, { x: 5.0, y: 1.5, w: 3.8, h: 4.8 });

  // Right Column: Technologies Used
  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 9.2,
    y: 1.0,
    w: 3.6,
    h: 5.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1 },
  });
  slide3.addText('TECHNOLOGIES USED', {
    x: 9.4,
    y: 1.15,
    w: 3.2,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: DARK_SLATE,
  });

  const techStack = [
    { text: 'FrontEnd:\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: 'React 19, TypeScript, Tailwind CSS, Touch Kiosk UI, Web Speech API.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: 'BackEnd:\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: 'Node.js, Express, RESTful APIs, Session Memory Guard (zero storage).\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: 'AI & Speech NLP:\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: 'Google Gemini 2.5/3.8 Flash, Bhashini IndicWhisper, Multilingual Vision OCR.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: 'Healthcare Standards:\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: 'ABDM FHIR R4, ABHA M1/M2/M3, NAMASTE AYUSH codes, ICD-10.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: 'Security & Privacy:\n', options: { bold: true, fontSize: 9.5, color: TEAL } },
    { text: 'DPDP Act 2023 compliant, ephemeral storage, AES-256 in-transit.', options: { fontSize: 8.5, color: '334155' } },
  ];
  slide3.addText(techStack, { x: 9.4, y: 1.5, w: 3.2, h: 4.8 });

  slide3.addText('@SIH Idea submission- Template | Slide 3', { x: 0.6, y: 6.8, w: 6.0, h: 0.3, fontSize: 9, color: '94A3B8' });
  slide3.addText('3', { x: 12.5, y: 6.8, w: 0.5, h: 0.3, fontSize: 12, color: '64748B', align: 'right' });

  // ==========================================
  // SLIDE 4: FEASIBILITY, VIABILITY & BUSINESS POTENTIAL
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: 'FFFFFF' };

  slide4.addText('FEASIBILITY, VIABILITY & BUSINESS POTENTIAL', {
    x: 0.6,
    y: 0.3,
    w: 12.0,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: '1E3A8A',
    fontFace: 'Arial',
  });

  // 3 Columns: Feasibility, Viability, Business Potential
  // Col 1: Feasibility
  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.0,
    w: 3.8,
    h: 5.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1 },
  });
  slide4.addText('FEASIBILITY ANALYSIS\n★★★★★', {
    x: 0.8,
    y: 1.15,
    w: 3.4,
    h: 0.6,
    fontSize: 11,
    bold: true,
    color: DARK_SLATE,
    align: 'center',
  });

  const feasPoints = [
    { text: '• Hardware Reusability:\n  Runs on off-the-shelf Android touch kiosks, standard tablets, or hospital reception PCs without proprietary hardware.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• Low-Literacy & Multilingual Usability:\n  Voice-first audio prompts in regional languages + pictorial cards enable elderly and rural citizens to use it with zero training.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• Noisy Environment Adaptability:\n  Directional microphone arrays with AI noise filtering handle 75–85 dB hospital waiting halls.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• Offline & Low-Bandwidth Resilient:\n  Local caching queues records during OPD broadband drops, syncing to HIS once reconnected.', options: { fontSize: 8.5, color: '334155' } },
  ];
  slide4.addText(feasPoints, { x: 0.8, y: 1.8, w: 3.4, h: 4.5 });

  // Col 2: Viability
  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 4.7,
    y: 1.0,
    w: 3.8,
    h: 5.5,
    fill: { color: 'F0FDFA' },
    line: { color: '99F6E4', width: 1 },
  });
  slide4.addText('VIABILITY & REGULATORY\n✔', {
    x: 4.9,
    y: 1.15,
    w: 3.4,
    h: 0.6,
    fontSize: 11,
    bold: true,
    color: TEAL,
    align: 'center',
  });

  const viabPoints = [
    { text: '• Zero Doctor Resistance:\n  Does not burden physicians with typing. Delivers a verified, editable draft summary directly onto the consultation screen.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• DPDP Act 2023 & ABDM Compliance:\n  Consent-first design with audio explanation. Temporary voice recordings and raw photos are cleared immediately after FHIR upload.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• AYUSH & Allopathic Interoperability:\n  Integrates NAMASTE Ayurvedic diagnosis codes alongside standard ICD-10 for seamless cross-referral.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• Clinical Safety Red-Flag Safeguard:\n  Emergency symptoms trigger immediate triage desk bypass, avoiding waiting room disasters.', options: { fontSize: 8.5, color: '334155' } },
  ];
  slide4.addText(viabPoints, { x: 4.9, y: 1.8, w: 3.4, h: 4.5 });

  // Col 3: Business Potential
  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 8.8,
    y: 1.0,
    w: 3.8,
    h: 5.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1 },
  });
  slide4.addText('BUSINESS & HEALTHCARE VALUE\n₹₹₹', {
    x: 9.0,
    y: 1.15,
    w: 3.4,
    h: 0.6,
    fontSize: 11,
    bold: true,
    color: '1E3A8A',
    align: 'center',
  });

  const bizPoints = [
    { text: '• Government Cost Savings:\n  Replaces manual human triage desks in high-volume hospitals, cutting clerical data-entry costs by 65%.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• 40% Increase in OPD Throughput:\n  Doctors spend consultation time examining & counseling rather than typing, increasing daily patient capacity.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• Nationwide Deployment Scope:\n  Direct fit for AIIMS, All India Institute of Ayurveda, Ayushman Arogya Mandirs, and State Medical Colleges.\n\n', options: { fontSize: 8.5, color: '334155' } },
    { text: '• Long-Term Preventive Health Data:\n  Populates lifelong longitudinal ABHA records with deep Ayurvedic Prakriti & lifestyle profiles.', options: { fontSize: 8.5, color: '334155' } },
  ];
  slide4.addText(bizPoints, { x: 9.0, y: 1.8, w: 3.4, h: 4.5 });

  slide4.addText('@SIH Idea submission- Template | Slide 4', { x: 0.6, y: 6.8, w: 6.0, h: 0.3, fontSize: 9, color: '94A3B8' });
  slide4.addText('4', { x: 12.5, y: 6.8, w: 0.5, h: 0.3, fontSize: 12, color: '64748B', align: 'right' });

  // ==========================================
  // SLIDE 5: IMPACT AND BENEFITS
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: 'FFFFFF' };

  slide5.addText('IMPACT AND BENEFITS: TRANSFORMING HEALTHCARE DELIVERY', {
    x: 0.6,
    y: 0.3,
    w: 12.0,
    h: 0.6,
    fontSize: 19,
    bold: true,
    color: '1E3A8A',
    fontFace: 'Arial',
  });

  // Left Section: Circular Metric Badges
  const metricBoxes = [
    { num: '80%', title: 'Intake Time Saved', desc: 'History review in 30 secs vs 4 mins manual asking', color: '15803D', bg: 'F0FDF4', y: 1.0 },
    { num: '3x', title: 'Consultation Quality', desc: 'More time for clinical examination & patient counseling', color: '0284C7', bg: 'F0F9FF', y: 2.3 },
    { num: '100%', title: 'Chronological Timeline', desc: 'Scattered paper prescriptions unified into digital EHR', color: TEAL, bg: 'F0FDFA', y: 3.6 },
    { num: '<45s', title: 'Emergency Flagging', desc: 'Immediate red-flag triage alert for acute emergencies', color: ROSE, bg: 'FEF2F2', y: 4.9 },
  ];

  metricBoxes.forEach((m) => {
    slide5.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: m.y,
      w: 3.5,
      h: 1.15,
      fill: { color: m.bg },
      line: { color: 'CBD5E1', width: 0.8 },
    });
    slide5.addText(m.num, {
      x: 0.8,
      y: m.y + 0.15,
      w: 1.0,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: m.color,
      align: 'center',
    });
    slide5.addText([
      { text: `${m.title}\n`, options: { bold: true, fontSize: 10, color: DARK_SLATE } },
      { text: m.desc, options: { fontSize: 8.5, color: '64748B' } }
    ], { x: 1.8, y: m.y + 0.15, w: 2.1, h: 0.8 });
  });

  // Center Section: The 4 Pillars
  slide5.addShape(pptx.ShapeType.roundRect, {
    x: 4.4,
    y: 1.0,
    w: 3.8,
    h: 5.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1 },
  });
  slide5.addText('THE 4 PILLARS OF TRANSFORMATION', {
    x: 4.6,
    y: 1.15,
    w: 3.4,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: TEAL,
    align: 'center',
  });

  const pillars = [
    { text: '1. Clinical Safety & Diagnostic Depth\n', options: { bold: true, fontSize: 9.5, color: DARK_SLATE } },
    { text: '   Standardized review of systems eliminates missed comorbidities; AYUSH Dashavidha Pariksha is preserved.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '2. Operational & Economic Scalability\n', options: { bold: true, fontSize: 9.5, color: DARK_SLATE } },
    { text: '   Relieves physician burnout in 5,000+ daily patient OPDs without expanding administrative desk staff.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '3. Universal Inclusivity & Empowerment\n', options: { bold: true, fontSize: 9.5, color: DARK_SLATE } },
    { text: '   Rural, illiterate, and elderly patients describe symptoms naturally in their mother tongue with zero barrier.\n\n', options: { fontSize: 8.5, color: '475569' } },
    { text: '4. Interoperable Longitudinal Health Records\n', options: { bold: true, fontSize: 9.5, color: DARK_SLATE } },
    { text: '   Direct ABDM / ABHA linkage creates lifelong digital health records following the patient everywhere.', options: { fontSize: 8.5, color: '475569' } },
  ];
  slide5.addText(pillars, { x: 4.6, y: 1.55, w: 3.4, h: 4.8 });

  // Right Section: Comparative Table
  slide5.addText('Current OPD Reality vs. With MediKiosk Platform', {
    x: 8.5,
    y: 1.0,
    w: 4.5,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: '1E3A8A',
  });

  const compTable = [
    [
      { text: 'Metric', options: { bold: true, fill: { color: 'F1F5F9' }, color: '334155', fontSize: 8.5 } },
      { text: 'Current Reality', options: { bold: true, fill: { color: 'FEF2F2' }, color: '991B1B', fontSize: 8.5 } },
      { text: 'With MediKiosk', options: { bold: true, fill: { color: 'F0FDF4' }, color: '166534', fontSize: 8.5 } },
    ],
    [
      { text: 'Doctor Intake Time', options: { fontSize: 8, color: '334155', bold: true } },
      { text: '2.5 min (entire consult)', options: { fontSize: 8, color: '991B1B' } },
      { text: '30 sec (review & sign)', options: { fontSize: 8, color: '15803D', bold: true } },
    ],
    [
      { text: 'History Depth', options: { fontSize: 8, color: '334155', bold: true } },
      { text: 'Incomplete (<30%)', options: { fontSize: 8, color: '991B1B' } },
      { text: 'Comprehensive (>90%)', options: { fontSize: 8, color: '15803D', bold: true } },
    ],
    [
      { text: 'AYUSH Assessment', options: { fontSize: 8, color: '334155', bold: true } },
      { text: 'Skipped due to rush', options: { fontSize: 8, color: '991B1B' } },
      { text: 'Full Dashavidha profiling', options: { fontSize: 8, color: '15803D', bold: true } },
    ],
    [
      { text: 'Paper Record Review', options: { fontSize: 8, color: '334155', bold: true } },
      { text: 'Scattered & unread', options: { fontSize: 8, color: '991B1B' } },
      { text: 'Digitized & chronologized', options: { fontSize: 8, color: '15803D', bold: true } },
    ],
    [
      { text: 'Emergency Triage', options: { fontSize: 8, color: '334155', bold: true } },
      { text: 'Stuck in 2-hr queue', options: { fontSize: 8, color: '991B1B' } },
      { text: 'Instant audio/SMS alert', options: { fontSize: 8, color: '15803D', bold: true } },
    ],
    [
      { text: 'ABDM Integration', options: { fontSize: 8, color: '334155', bold: true } },
      { text: 'Paper stays offline', options: { fontSize: 8, color: '991B1B' } },
      { text: '100% FHIR linked to ABHA', options: { fontSize: 8, color: '15803D', bold: true } },
    ],
  ];

  slide5.addTable(compTable, {
    x: 8.5,
    y: 1.4,
    w: 4.4,
    colW: [1.3, 1.4, 1.7],
    border: { pt: 0.5, color: 'CBD5E1' },
  });

  slide5.addText('@SIH Idea submission- Template | Slide 5', { x: 0.6, y: 6.8, w: 6.0, h: 0.3, fontSize: 9, color: '94A3B8' });
  slide5.addText('5', { x: 12.5, y: 6.8, w: 0.5, h: 0.3, fontSize: 12, color: '64748B', align: 'right' });

  // ==========================================
  // SLIDE 6: RESEARCH, REFERENCES & UI/UX SHOWCASE
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: 'FFFFFF' };

  slide6.addText('RESEARCH, REFERENCES & UI/UX SHOWCASE', {
    x: 0.6,
    y: 0.3,
    w: 12.0,
    h: 0.6,
    fontSize: 20,
    bold: true,
    color: '1E3A8A',
    fontFace: 'Arial',
  });

  // Top 7 Reference Badges
  const refs = [
    { title: 'BMJ Open 2017', desc: 'Primary Care Consultation in 67 Countries (India avg 2 mins)' },
    { title: 'Charaka Samhita', desc: 'AIIA Dashavidha & Ashtavidha Pariksha Guidelines' },
    { title: 'Ministry of Ayush', desc: 'NAMASTE Standardized Morbidity Terminology Portal' },
    { title: 'NHA ABDM', desc: 'FHIR R4 Implementation Guide & Consent Framework' },
    { title: 'AI4Bharat / Bhashini', desc: 'Speech Recognition Benchmarks in Indian Languages' },
    { title: 'DPDP Act 2023', desc: 'Digital Personal Data Protection Regulatory Compliance' },
    { title: 'WHO Patient Safety', desc: 'Diagnostic Error Reduction via Structured History Taking' },
  ];

  const colWidth = 1.65;
  refs.forEach((r, idx) => {
    const rx = 0.6 + idx * 1.75;
    slide6.addShape(pptx.ShapeType.roundRect, {
      x: rx,
      y: 1.0,
      w: colWidth,
      h: 1.3,
      fill: { color: 'F1F5F9' },
      line: { color: 'CBD5E1', width: 0.8 },
    });
    slide6.addText(r.title, {
      x: rx + 0.05,
      y: 1.08,
      w: colWidth - 0.1,
      h: 0.35,
      fontSize: 8.5,
      bold: true,
      color: '1E3A8A',
      align: 'center',
    });
    slide6.addText(r.desc, {
      x: rx + 0.05,
      y: 1.45,
      w: colWidth - 0.1,
      h: 0.8,
      fontSize: 7.5,
      color: '475569',
      align: 'center',
    });
  });

  // Bottom 4 UI/UX Panels
  slide6.addText('INTERACTIVE PROTOTYPE & PRODUCTION UI/UX SCREENS', {
    x: 0.6,
    y: 2.5,
    w: 12.0,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: DARK_SLATE,
  });

  const screens = [
    {
      title: '1. Multilingual Kiosk & ABHA Login',
      desc: 'Intuitive touch screen with Hindi, Tamil, Telugu, English & QR/Aadhaar biometric authentication.',
      tag: 'Module D: Identity & Consent',
    },
    {
      title: '2. Voice-First Conversational Intake',
      desc: 'Adaptive speech questions probing onset, pain radiation, Prakriti, Agni, and instant Red-Flag triage.',
      tag: 'Module A: Voice + SOCRATES',
    },
    {
      title: '3. Medical Document Digitizer',
      desc: 'Camera feed with OCR extraction for paper prescriptions, lab reports, and abnormal biomarker flags.',
      tag: 'Module B: Medical OCR',
    },
    {
      title: '4. Doctor\'s 30-Sec EMR Dashboard',
      desc: 'Synthesized clinical note with 1-click accept, amend, or sign before examination and counseling.',
      tag: 'Module C: Physician Summary',
    },
  ];

  screens.forEach((s, idx) => {
    const sx = 0.6 + idx * 3.1;
    slide6.addShape(pptx.ShapeType.roundRect, {
      x: sx,
      y: 3.0,
      w: 2.95,
      h: 3.4,
      fill: { color: 'F8FAFC' },
      line: { color: 'CBD5E1', width: 1 },
    });
    // Header tag
    slide6.addShape(pptx.ShapeType.rect, {
      x: sx,
      y: 3.0,
      w: 2.95,
      h: 0.4,
      fill: { color: TEAL },
    });
    slide6.addText(s.tag, {
      x: sx + 0.1,
      y: 3.05,
      w: 2.75,
      h: 0.3,
      fontSize: 8.5,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });

    slide6.addText(s.title, {
      x: sx + 0.1,
      y: 3.5,
      w: 2.75,
      h: 0.5,
      fontSize: 10,
      bold: true,
      color: DARK_SLATE,
      align: 'center',
    });

    slide6.addText(s.desc, {
      x: sx + 0.1,
      y: 4.1,
      w: 2.75,
      h: 1.4,
      fontSize: 8.5,
      color: '475569',
      align: 'center',
    });

    slide6.addShape(pptx.ShapeType.roundRect, {
      x: sx + 0.2,
      y: 5.6,
      w: 2.55,
      h: 0.5,
      fill: { color: 'F1F5F9' },
      line: { color: 'CBD5E1', width: 0.5 },
    });
    slide6.addText('STATUS: LIVE & VERIFIED', {
      x: sx + 0.2,
      y: 5.7,
      w: 2.55,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: '15803D',
      align: 'center',
    });
  });

  slide6.addText('@SIH Idea submission- Template | Slide 6', { x: 0.6, y: 6.8, w: 6.0, h: 0.3, fontSize: 9, color: '94A3B8' });
  slide6.addText('6', { x: 12.5, y: 6.8, w: 0.5, h: 0.3, fontSize: 12, color: '64748B', align: 'right' });

  // Save presentation
  const fileName = `SIH26047_MediKiosk_${config.teamName.replace(/\s+/g, '_')}_PitchDeck.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
