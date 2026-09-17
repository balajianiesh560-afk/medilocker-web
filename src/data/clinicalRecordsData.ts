import {
  ScanReportRecord,
  PrescriptionRecord,
  LabReportRecord,
  DischargeSummaryRecord,
  Patient,
} from '../types';

// Radiographic visual SVG thumbnails for scan modalities
export const SCAN_SAMPLE_IMAGES = {
  ctBrain: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#090d16"/>
      <ellipse cx="200" cy="150" rx="120" ry="110" fill="#141e33" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 2"/>
      <path d="M 130 150 Q 200 120 270 150" stroke="#0ea5e9" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M 140 180 Q 200 200 260 180" stroke="#0ea5e9" stroke-width="2" fill="none" opacity="0.6"/>
      <ellipse cx="170" cy="140" rx="28" ry="36" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
      <ellipse cx="230" cy="140" rx="28" ry="36" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
      <line x1="200" y1="60" x2="200" y2="240" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2 4"/>
      <circle cx="245" cy="115" r="14" fill="#ef4444" opacity="0.4" stroke="#f87171" stroke-width="1.5"/>
      <text x="245" y="119" fill="#fecdd3" font-size="9" font-family="monospace" text-anchor="middle">LESION</text>
      <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="monospace">CT BRAIN (NON-CONTRAST)</text>
      <text x="20" y="48" fill="#38bdf8" font-size="10" font-family="monospace">AXIAL SLICE 18/32 • 5.0mm</text>
      <text x="380" y="30" fill="#22c55e" font-size="11" font-family="monospace" text-anchor="end">DICOM 3.0</text>
      <text x="380" y="280" fill="#64748b" font-size="10" font-family="monospace" text-anchor="end">W:80 L:40</text>
    </svg>
  `)}`,
  chestXRay: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#090d16"/>
      <!-- Spine -->
      <line x1="200" y1="40" x2="200" y2="270" stroke="#475569" stroke-width="12" opacity="0.8"/>
      <!-- Ribs Left & Right -->
      <path d="M 200 80 Q 280 90 280 130 Q 270 170 200 170" stroke="#94a3b8" stroke-width="5" fill="none" opacity="0.85"/>
      <path d="M 200 100 Q 290 120 290 160 Q 280 200 200 210" stroke="#94a3b8" stroke-width="5" fill="none" opacity="0.85"/>
      <path d="M 200 80 Q 120 90 120 130 Q 130 170 200 170" stroke="#94a3b8" stroke-width="5" fill="none" opacity="0.85"/>
      <path d="M 200 100 Q 110 120 110 160 Q 120 200 200 210" stroke="#94a3b8" stroke-width="5" fill="none" opacity="0.85"/>
      <!-- Clavicles -->
      <line x1="200" y1="65" x2="310" y2="55" stroke="#cbd5e1" stroke-width="6"/>
      <line x1="200" y1="65" x2="90" y2="55" stroke="#cbd5e1" stroke-width="6"/>
      <!-- Heart Shadow -->
      <path d="M 180 150 Q 210 160 210 220 Q 160 230 150 190 Z" fill="#334155" opacity="0.75" stroke="#64748b" stroke-width="1.5"/>
      <!-- Chest tube / Pigtail marker -->
      <path d="M 80 120 Q 130 130 140 100" stroke="#06b6d4" stroke-width="3" fill="none" stroke-dasharray="3 3"/>
      <circle cx="140" cy="100" r="4" fill="#06b6d4"/>
      <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="monospace">DIGITAL CHEST RADIOGRAPH (AP)</text>
      <text x="20" y="48" fill="#06b6d4" font-size="10" font-family="monospace">PORTABLE BEDSIDE TRAUMA</text>
      <text x="380" y="30" fill="#06b6d4" font-size="11" font-family="monospace" text-anchor="end">ER PROTOCOL</text>
      <text x="380" y="280" fill="#64748b" font-size="10" font-family="monospace" text-anchor="end">KV:115 mAs:3.2</text>
    </svg>
  `)}`,
  mriKneeOrSpine: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#090d16"/>
      <!-- Vertebral Bodies / Knee Joint Sagittal -->
      <rect x="170" y="60" width="60" height="40" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
      <rect x="170" y="110" width="60" height="40" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
      <rect x="170" y="160" width="60" height="40" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
      <rect x="170" y="210" width="60" height="40" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
      <!-- Intervertebral Discs -->
      <ellipse cx="200" cy="105" rx="30" ry="6" fill="#0ea5e9" opacity="0.6"/>
      <ellipse cx="200" cy="155" rx="30" ry="6" fill="#38bdf8" opacity="0.8"/>
      <ellipse cx="200" cy="205" rx="32" ry="7" fill="#f59e0b" opacity="0.8"/>
      <!-- Spinal cord / thecal sac -->
      <line x1="242" y1="50" x2="242" y2="260" stroke="#f43f5e" stroke-width="4" opacity="0.85"/>
      <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="monospace">MRI SPINE / SAGITTAL T2-FSE</text>
      <text x="20" y="48" fill="#38bdf8" font-size="10" font-family="monospace">3.0 TESLA HIGH-FIELD</text>
      <text x="380" y="30" fill="#a855f7" font-size="11" font-family="monospace" text-anchor="end">TR:3200 TE:102</text>
      <text x="380" y="280" fill="#64748b" font-size="10" font-family="monospace" text-anchor="end">FOV:24cm SL:3.0mm</text>
    </svg>
  `)}`,
  ultrasoundAbdomen: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#090d16"/>
      <!-- Ultrasound Sector Cone -->
      <path d="M 200 40 L 80 270 A 240 240 0 0 0 320 270 Z" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.5"/>
      <!-- Liver & Kidney Acoustic Echogenicity -->
      <ellipse cx="170" cy="160" rx="50" ry="35" fill="#1e293b" stroke="#475569" stroke-width="1.5" opacity="0.9"/>
      <ellipse cx="225" cy="190" rx="32" ry="22" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Morrison's Pouch Interface -->
      <path d="M 185 165 Q 210 175 235 170" stroke="#22c55e" stroke-width="2.5" fill="none"/>
      <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="monospace">FAST TRAUMA ULTRASOUND</text>
      <text x="20" y="48" fill="#22c55e" font-size="10" font-family="monospace">MORRISON'S POUCH: NEGATIVE</text>
      <text x="380" y="30" fill="#38bdf8" font-size="11" font-family="monospace" text-anchor="end">5.0 MHz CURVED</text>
      <text x="380" y="280" fill="#64748b" font-size="10" font-family="monospace" text-anchor="end">DEPTH: 16cm MI:0.9</text>
    </svg>
  `)}`,
};

// ----------------------------------------------------------------------------------
// SCAN REPORTS GENERATOR
// ----------------------------------------------------------------------------------
export function getSampleScanReports(patient: Partial<Patient>): ScanReportRecord[] {
  const pId = patient.id || 'PID-1042';
  const hospital = patient.originHospital || 'St. Jude Memorial Trauma Center';

  if (pId === 'PID-1042') {
    // Liam Walker - Trauma, Rib Fractures, Pneumothorax
    return [
      {
        id: `SCAN-${pId}-01`,
        patientId: pId,
        title: 'Trauma Protocol Multi-Detector CT: Chest, Abdomen & Pelvis',
        modality: 'CT Scan',
        bodyRegion: 'Thorax, Abdomen & Pelvis',
        date: '2026-09-08 19:15',
        hospitalName: hospital,
        radiologistName: 'Dr. Aaron Kessler, MD (Chief Radiologist)',
        clinicalIndication: 'High-speed motor vehicle rollover collision. Blunt chest wall trauma with respiratory splinting.',
        technique: 'Contrast-enhanced helical CT scan performed with 64-slice MDCT from thoracic inlet through ischial tuberosities after 90 mL IV Isovue-370 non-ionic iodinated contrast.',
        findings:
          '1. Chest: Left-sided apical pneumothorax measuring ~15% volume with small lateral pocket. Non-displaced acute fractures of the left 4th, 5th, and 6th ribs along posterior-lateral arc. Mild underlying pulmonary contusion in left upper lobe.\n2. Abdomen & Pelvis: Liver, spleen, kidneys, pancreas, and adrenal glands enhance homogenously without laceration or subcapsular hematoma. No free intra-abdominal fluid or free retroperitoneal gas.\n3. Musculoskeletal: Pelvic ring intact without diastasis or fracture. Lumbar spine anatomical alignment preserved.',
        impression:
          '1. Left acute traumatic pneumothorax without tension physiology.\n2. Non-displaced left 4th-6th rib fractures.\n3. Negative for active vascular extravasation or solid visceral organ laceration.',
        status: 'Abnormal',
        imageUrl: SCAN_SAMPLE_IMAGES.ctBrain,
        fileSize: '48.6 MB (DICOM Multi-Slice Series)',
        createdAt: '2026-09-08T19:25:00Z',
      },
      {
        id: `SCAN-${pId}-02`,
        patientId: pId,
        title: 'Bedside Mobile Digital Chest Radiograph (Post-Thoracostomy)',
        modality: 'X-Ray',
        bodyRegion: 'Thorax / Chest',
        date: '2026-09-08 20:05',
        hospitalName: hospital,
        radiologistName: 'Dr. Aaron Kessler, MD',
        clinicalIndication: 'Evaluation of pigtail chest catheter position and left pneumothorax resolution.',
        technique: 'Single view portable AP chest radiograph performed supine at bedside.',
        findings:
          'A 14-French pigtail chest thoracostomy tube is identified terminating at the left lung apex. Significant interval reduction of the left apical pneumothorax with improved pulmonary re-expansion. Trachea and cardiomediastinal contour remain midline.',
        impression:
          'Satisfactory placement of left pigtail chest catheter with near-complete decompression of traumatic pneumothorax.',
        status: 'Normal',
        imageUrl: SCAN_SAMPLE_IMAGES.chestXRay,
        fileSize: '12.4 MB (High-Res Digital X-Ray)',
        createdAt: '2026-09-08T20:15:00Z',
      },
      {
        id: `SCAN-${pId}-03`,
        patientId: pId,
        title: 'Bedside FAST Focused Sonogram in Trauma',
        modality: 'Ultrasound',
        bodyRegion: 'Abdominal & Pericardial Spaces',
        date: '2026-09-08 18:50',
        hospitalName: hospital,
        radiologistName: 'Dr. Evelyn Reed, MD (ER Attending)',
        clinicalIndication: 'Immediate trauma resuscitation screening for hemoperitoneum and cardiac tamponade.',
        technique: 'Point-of-care ultrasound examining Right Upper Quadrant (Morrison pouch), Left Upper Quadrant (splenorenal recess), Pelvic pouch of Douglas, and subxiphoid pericardial window.',
        findings:
          'Subxiphoid view demonstrates clear pericardial space with vigorous biventricular contractility. Hepatorenal interface sharp and anechoic. Splenorenal recess free of fluid. Retrovesical space clear.',
        impression: 'Negative FAST examination for hemoperitoneum or acute pericardial effusion.',
        status: 'Normal',
        imageUrl: SCAN_SAMPLE_IMAGES.ultrasoundAbdomen,
        fileSize: '8.2 MB',
        createdAt: '2026-09-08T18:55:00Z',
      },
    ];
  } else if (pId === 'PID-1088') {
    // Elena Rostova - Status Asthmaticus
    return [
      {
        id: `SCAN-${pId}-01`,
        patientId: pId,
        title: 'High-Resolution Chest Radiograph (PA & Lateral)',
        modality: 'X-Ray',
        bodyRegion: 'Thorax',
        date: '2026-09-08 20:25',
        hospitalName: hospital,
        radiologistName: 'Dr. Michael Cho, MD',
        clinicalIndication: 'Status asthmaticus with acute bronchospasm. Rule out pneumothorax or mucous plugging atelectasis.',
        technique: 'PA and lateral standing chest radiographs at 120 kVp.',
        findings:
          'Bilateral symmetric pulmonary hyperinflation with flattened diaphragmatic domes, consistent with acute obstructive airway disease. No focal consolidation, pneumothorax, or pleural effusion. Pulmonary vasculature is within normal limits.',
        impression: 'Pulmonary hyperinflation without acute focal consolidation or secondary pneumothorax.',
        status: 'Abnormal',
        imageUrl: SCAN_SAMPLE_IMAGES.chestXRay,
        fileSize: '16.1 MB',
        createdAt: '2026-09-08T20:35:00Z',
      },
    ];
  } else if (pId === 'PID-2015') {
    // Unknown Male #4 - Traumatic Subdural Hematoma
    return [
      {
        id: `SCAN-${pId}-01`,
        patientId: pId,
        title: 'Emergency Cranial Non-Contrast Head CT',
        modality: 'CT Scan',
        bodyRegion: 'Brain & Neurocranium',
        date: '2026-09-08 21:50',
        hospitalName: hospital,
        radiologistName: 'Dr. Aaron Kessler, MD',
        clinicalIndication: 'Unconscious male after warehouse industrial collapse. GCS 9. Sluggish right pupil.',
        technique: 'Axial helical non-contrast CT from foramen magnum to vertex with bone and soft tissue reconstructions.',
        findings:
          'A hyperdense extra-axial crescentic fluid collection is present along the right frontotemporal convexity measuring up to 6.4 mm in maximal radial width. Resultant mass effect demonstrates 3.5 mm leftward midline shift with partial effacement of the right lateral ventricle frontal horn. Basilar cisterns remain patent.',
        impression:
          'CRITICAL ALERT: Acute traumatic right frontotemporal subdural hematoma with 3.5 mm midline shift. STAT neurosurgical evaluation indicated.',
        status: 'Critical Finding',
        imageUrl: SCAN_SAMPLE_IMAGES.ctBrain,
        fileSize: '62.0 MB (High-Resolution DICOM)',
        createdAt: '2026-09-08T21:58:00Z',
      },
      {
        id: `SCAN-${pId}-02`,
        patientId: pId,
        title: 'Multi-Planar Cervical Spine CT Reconstructions',
        modality: 'CT Scan',
        bodyRegion: 'Cervical Spine (C1-C7)',
        date: '2026-09-08 22:00',
        hospitalName: hospital,
        radiologistName: 'Dr. Aaron Kessler, MD',
        clinicalIndication: 'Trauma protocol cervical spine clearance in comatose patient.',
        technique: 'Thin slice 0.625mm axial CT with 2D sagittal and coronal reformats.',
        findings:
          'Normal craniocervical junction alignment. Atlantodens interval measures 1.8 mm. No facet joint subluxation or fracture through vertebral bodies C1 through C7. Prevertebral soft tissues are non-expanded.',
        impression: 'No acute fracture or dislocation of the cervical spine.',
        status: 'Normal',
        imageUrl: SCAN_SAMPLE_IMAGES.mriKneeOrSpine,
        fileSize: '34.2 MB',
        createdAt: '2026-09-08T22:10:00Z',
      },
    ];
  } else {
    // Standard default scans for other patients
    return [
      {
        id: `SCAN-${pId}-01`,
        patientId: pId,
        title: 'Comprehensive Diagnostic Radiograph Series',
        modality: 'X-Ray',
        bodyRegion: 'Regional Anatomy',
        date: '2026-09-07 15:00',
        hospitalName: hospital,
        radiologistName: 'Dr. Aaron Kessler, MD',
        clinicalIndication: 'Trauma emergency evaluation.',
        technique: 'Digital planar radiography.',
        findings: 'No structural bone disruption or pathological displacement noted.',
        impression: 'Normal diagnostic imaging evaluation.',
        status: 'Normal',
        imageUrl: SCAN_SAMPLE_IMAGES.chestXRay,
        fileSize: '14.0 MB',
        createdAt: '2026-09-07T15:30:00Z',
      },
    ];
  }
}

// ----------------------------------------------------------------------------------
// PRESCRIPTIONS GENERATOR (Rx)
// ----------------------------------------------------------------------------------
export function getSamplePrescriptions(patient: Partial<Patient>): PrescriptionRecord[] {
  const pId = patient.id || 'PID-1042';
  const hospital = patient.originHospital || 'St. Jude Memorial Trauma Center';

  if (pId === 'PID-1042') {
    return [
      {
        id: `RX-${pId}-01`,
        patientId: pId,
        medicationName: 'Morphine Sulfate Injection',
        dosage: '4 mg / 1 mL',
        route: 'IV',
        frequency: 'Every 4 hours PRN',
        timing: 'STAT',
        duration: '3 Days',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Emergency Triage & Trauma Surgery',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Slow IV push over 3 minutes for breakthrough trauma pain. Continuously monitor SpO2 and respiratory rate.',
        createdAt: '2026-09-08T19:00:00Z',
      },
      {
        id: `RX-${pId}-02`,
        patientId: pId,
        medicationName: 'Cefazolin (Ancef) IV',
        dosage: '2 g in 100 mL Normal Saline',
        route: 'IV',
        frequency: 'Every 8 hours',
        timing: 'STAT',
        duration: '5 Days',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Trauma Surgery',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'IV piggyback infusion over 30 minutes. Prophylaxis for thoracic drain placement. Note: Penicillin allergy noted; tolerated without adverse reaction.',
        createdAt: '2026-09-08T19:10:00Z',
      },
      {
        id: `RX-${pId}-03`,
        patientId: pId,
        medicationName: 'Acetaminophen (Tylenol) IV / Oral',
        dosage: '1000 mg',
        route: 'Oral',
        frequency: 'Every 6 hours scheduled',
        timing: 'After Food',
        duration: '7 Days',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Emergency Medicine',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Multimodal analgesia protocol for rib fracture pain. Do not exceed 4000 mg in 24 hours.',
        createdAt: '2026-09-08T19:30:00Z',
      },
      {
        id: `RX-${pId}-04`,
        patientId: pId,
        medicationName: 'Enoxaparin (Lovenox)',
        dosage: '40 mg (0.4 mL)',
        route: 'Sublingual',
        frequency: 'Once daily (21:00)',
        timing: 'At Bedtime',
        duration: 'Hospital Stay (DVT Prophylaxis)',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Trauma Surgery',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Deep vein thrombosis prophylaxis. Subcutaneous injection in abdominal fat pad. Rotate injection sites.',
        createdAt: '2026-09-08T20:00:00Z',
      },
      {
        id: `RX-${pId}-05`,
        patientId: pId,
        medicationName: 'Amoxicillin-Clavulanate (Augmentin)',
        dosage: '875 mg / 125 mg',
        route: 'Oral',
        frequency: '1 - 0 - 1 (Morning & Night)',
        timing: 'After Food',
        duration: 'Cancelled',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Primary Care',
        hospitalName: hospital,
        status: 'Discontinued',
        dispensedStatus: 'Pending Pharmacy',
        instructions: 'DISCONTINUED: Stopped immediately upon biometric allergy confirmation in hospital database.',
        createdAt: '2026-09-08T18:50:00Z',
      },
    ];
  } else if (pId === 'PID-1088') {
    return [
      {
        id: `RX-${pId}-01`,
        patientId: pId,
        medicationName: 'Albuterol Sulfate Inhalation Solution',
        dosage: '2.5 mg / 3 mL',
        route: 'Inhalation',
        frequency: 'Every 20 mins x 3 doses, then Q4H PRN',
        timing: 'STAT',
        duration: '48 Hours',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Marcus Vance, MD',
        doctorSpecialty: 'Critical Care Attending',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Administer with air/oxygen flow rate of 6-8 L/min via jet nebulizer. Assess peak flow pre and post.',
        createdAt: '2026-09-08T20:15:00Z',
      },
      {
        id: `RX-${pId}-02`,
        patientId: pId,
        medicationName: 'Budesonide-Formoterol (Symbicort)',
        dosage: '160 mcg / 4.5 mcg per actuation',
        route: 'Inhalation',
        frequency: '2 puffs BID (Morning & Evening)',
        timing: 'After Food',
        duration: '30 Days Maintenance',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Marcus Vance, MD',
        doctorSpecialty: 'Pulmonology',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Refill Authorized',
        instructions: 'Rinse mouth thoroughly with water after inhalation to prevent oral candidiasis.',
        createdAt: '2026-09-08T20:40:00Z',
      },
      {
        id: `RX-${pId}-03`,
        patientId: pId,
        medicationName: 'Methylprednisolone Sodium Succinate IV',
        dosage: '125 mg',
        route: 'IV',
        frequency: 'Once STAT',
        timing: 'STAT',
        duration: 'Single Dose',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Marcus Vance, MD',
        doctorSpecialty: 'Emergency Medicine',
        hospitalName: hospital,
        status: 'Completed',
        dispensedStatus: 'Dispensed',
        instructions: 'Rapid systemic anti-inflammatory protocol for acute severe bronchospasm.',
        createdAt: '2026-09-08T20:25:00Z',
      },
    ];
  } else if (pId === 'PID-2015') {
    return [
      {
        id: `RX-${pId}-01`,
        patientId: pId,
        medicationName: 'Mannitol 20% IV Infusion',
        dosage: '100 g (500 mL)',
        route: 'IV',
        frequency: 'STAT over 30 minutes',
        timing: 'STAT',
        duration: 'Acute Resuscitation',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Neurotrauma Resuscitation',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Administer via inline filter. Osmotic reduction of acute intracranial hypertension pending surgical decompression.',
        createdAt: '2026-09-08T22:10:00Z',
      },
      {
        id: `RX-${pId}-02`,
        patientId: pId,
        medicationName: 'Levetiracetam (Keppra) IV',
        dosage: '1000 mg in 100 mL Saline',
        route: 'IV',
        frequency: 'Every 12 hours',
        timing: 'STAT',
        duration: '7 Days',
        prescribedDate: '2026-09-08',
        prescribingDoctor: 'Dr. Evelyn Reed, MD',
        doctorSpecialty: 'Trauma Critical Care',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Post-traumatic seizure prophylaxis. Infuse over 15 minutes.',
        createdAt: '2026-09-08T22:15:00Z',
      },
    ];
  } else {
    return [
      {
        id: `RX-${pId}-01`,
        patientId: pId,
        medicationName: 'Acetaminophen Tablets',
        dosage: '500 mg',
        route: 'Oral',
        frequency: '1 - 0 - 1',
        timing: 'After Food',
        duration: '5 Days',
        prescribedDate: '2026-09-07',
        prescribingDoctor: 'Dr. Sarah Lin, MD',
        doctorSpecialty: 'General Practice',
        hospitalName: hospital,
        status: 'Active',
        dispensedStatus: 'Dispensed',
        instructions: 'Take with plenty of water. For pain management.',
        createdAt: '2026-09-07T14:40:00Z',
      },
    ];
  }
}

// ----------------------------------------------------------------------------------
// LAB REPORTS GENERATOR (Blood tests, CBC, CMP, ABG, Enzymes)
// ----------------------------------------------------------------------------------
export function getSampleLabReports(patient: Partial<Patient>): LabReportRecord[] {
  const pId = patient.id || 'PID-1042';
  const hospital = patient.originHospital || 'St. Jude Memorial Trauma Center';

  if (pId === 'PID-1042') {
    return [
      {
        id: `LAB-${pId}-01`,
        patientId: pId,
        testName: 'Complete Blood Count (CBC) with Automated Differential',
        category: 'Hematology',
        sampleType: 'Whole Blood (K2-EDTA)',
        collectionDate: '2026-09-08 18:50',
        reportDate: '2026-09-08 19:15',
        laboratoryName: 'St. Jude Central Clinical Pathology Lab',
        pathologistName: 'Dr. Kimberly Adams, MD (Director of Pathology)',
        status: 'Completed',
        overallSummary: 'Mild acute post-traumatic leukocytosis. Hemoglobin and platelet counts remain stable within acceptable trauma margins.',
        parameters: [
          { name: 'Hemoglobin (Hgb)', value: 14.1, unit: 'g/dL', referenceRange: '13.5 - 17.5', status: 'Normal' },
          { name: 'Hematocrit (Hct)', value: 42.0, unit: '%', referenceRange: '38.8 - 50.0', status: 'Normal' },
          { name: 'White Blood Cell (WBC)', value: 13.8, unit: 'x10³/µL', referenceRange: '4.5 - 11.0', status: 'High' },
          { name: 'Platelets (PLT)', value: 245, unit: 'x10³/µL', referenceRange: '150 - 450', status: 'Normal' },
          { name: 'Neutrophils', value: 81.2, unit: '%', referenceRange: '40.0 - 70.0', status: 'High' },
          { name: 'Lymphocytes', value: 12.4, unit: '%', referenceRange: '20.0 - 40.0', status: 'Low' },
          { name: 'Monocytes', value: 5.6, unit: '%', referenceRange: '2.0 - 8.0', status: 'Normal' },
        ],
        createdAt: '2026-09-08T19:15:00Z',
      },
      {
        id: `LAB-${pId}-02`,
        patientId: pId,
        testName: 'Comprehensive Metabolic Panel (CMP) & Renal Function',
        category: 'Biochemistry',
        sampleType: 'Serum Separator (SST)',
        collectionDate: '2026-09-08 18:50',
        reportDate: '2026-09-08 19:25',
        laboratoryName: 'St. Jude Central Clinical Pathology Lab',
        pathologistName: 'Dr. Kimberly Adams, MD',
        status: 'Completed',
        overallSummary: 'Electrolytes and renal clearance within normal physiological limits. Normal serum creatinine and anion gap.',
        parameters: [
          { name: 'Sodium (Na)', value: 139, unit: 'mEq/L', referenceRange: '136 - 145', status: 'Normal' },
          { name: 'Potassium (K)', value: 4.2, unit: 'mEq/L', referenceRange: '3.5 - 5.1', status: 'Normal' },
          { name: 'Chloride (Cl)', value: 102, unit: 'mEq/L', referenceRange: '98 - 107', status: 'Normal' },
          { name: 'Bicarbonate (CO2)', value: 24, unit: 'mEq/L', referenceRange: '22 - 29', status: 'Normal' },
          { name: 'Blood Urea Nitrogen (BUN)', value: 16, unit: 'mg/dL', referenceRange: '7 - 20', status: 'Normal' },
          { name: 'Serum Creatinine', value: 0.95, unit: 'mg/dL', referenceRange: '0.70 - 1.30', status: 'Normal' },
          { name: 'Glucose (Random)', value: 118, unit: 'mg/dL', referenceRange: '70 - 140', status: 'Normal' },
          { name: 'Calcium', value: 9.2, unit: 'mg/dL', referenceRange: '8.6 - 10.2', status: 'Normal' },
          { name: 'eGFR', value: 98, unit: 'mL/min/1.73m²', referenceRange: '> 60', status: 'Normal' },
        ],
        createdAt: '2026-09-08T19:25:00Z',
      },
      {
        id: `LAB-${pId}-03`,
        patientId: pId,
        testName: 'STAT Arterial Blood Gas (ABG) & Lactate Profile',
        category: 'Cardiac Markers',
        sampleType: 'Heparinized Arterial Blood',
        collectionDate: '2026-09-08 18:55',
        reportDate: '2026-09-08 19:08',
        laboratoryName: 'St. Jude Emergency Point-of-Care Lab',
        pathologistName: 'Dr. Evelyn Reed, MD',
        status: 'Completed',
        overallSummary: 'Adequate oxygenation maintained on 4 L/min nasal cannula. Serum lactate within normal reference limit.',
        parameters: [
          { name: 'pH', value: 7.38, unit: '', referenceRange: '7.35 - 7.45', status: 'Normal' },
          { name: 'PaCO2', value: 41.0, unit: 'mmHg', referenceRange: '35.0 - 45.0', status: 'Normal' },
          { name: 'PaO2', value: 89.0, unit: 'mmHg', referenceRange: '80.0 - 100.0', status: 'Normal' },
          { name: 'HCO3', value: 24.2, unit: 'mEq/L', referenceRange: '22.0 - 26.0', status: 'Normal' },
          { name: 'Base Excess', value: -0.8, unit: 'mEq/L', referenceRange: '-2.0 to +2.0', status: 'Normal' },
          { name: 'Oxygen Saturation (SaO2)', value: 97.2, unit: '%', referenceRange: '95.0 - 99.0', status: 'Normal' },
          { name: 'Blood Lactate', value: 1.4, unit: 'mmol/L', referenceRange: '0.5 - 2.0', status: 'Normal' },
        ],
        createdAt: '2026-09-08T19:08:00Z',
      },
    ];
  } else if (pId === 'PID-1088') {
    return [
      {
        id: `LAB-${pId}-01`,
        patientId: pId,
        testName: 'Arterial Blood Gas (ABG) & Acid-Base Panel',
        category: 'Hematology',
        sampleType: 'Radial Arterial Blood',
        collectionDate: '2026-09-08 20:18',
        reportDate: '2026-09-08 20:30',
        laboratoryName: 'Metropolitan General Emergency Lab',
        pathologistName: 'Dr. Marcus Vance, MD',
        status: 'Completed',
        overallSummary: 'Mild acute respiratory acidosis with compensated hypercapnia secondary to acute severe bronchospasm.',
        parameters: [
          { name: 'pH', value: 7.33, unit: '', referenceRange: '7.35 - 7.45', status: 'Low' },
          { name: 'PaCO2', value: 46.5, unit: 'mmHg', referenceRange: '35.0 - 45.0', status: 'High' },
          { name: 'PaO2', value: 72.0, unit: 'mmHg', referenceRange: '80.0 - 100.0', status: 'Low' },
          { name: 'HCO3', value: 24.8, unit: 'mEq/L', referenceRange: '22.0 - 26.0', status: 'Normal' },
          { name: 'SaO2', value: 92.4, unit: '%', referenceRange: '95.0 - 100.0', status: 'Low' },
        ],
        createdAt: '2026-09-08T20:30:00Z',
      },
    ];
  } else {
    return [
      {
        id: `LAB-${pId}-01`,
        patientId: pId,
        testName: 'Routine Emergency Blood Work & Chemistry',
        category: 'Biochemistry',
        sampleType: 'Whole Blood',
        collectionDate: '2026-09-07 14:00',
        reportDate: '2026-09-07 14:30',
        laboratoryName: 'Central Pathology Laboratory',
        pathologistName: 'Chief Pathologist',
        status: 'Completed',
        overallSummary: 'Baseline clinical chemistry and hematology profile within normal parameters.',
        parameters: [
          { name: 'Hemoglobin', value: 13.8, unit: 'g/dL', referenceRange: '12.0 - 16.0', status: 'Normal' },
          { name: 'White Blood Cell', value: 7.4, unit: 'x10³/µL', referenceRange: '4.0 - 11.0', status: 'Normal' },
          { name: 'Blood Glucose', value: 96, unit: 'mg/dL', referenceRange: '70 - 110', status: 'Normal' },
        ],
        createdAt: '2026-09-07T14:30:00Z',
      },
    ];
  }
}

// ----------------------------------------------------------------------------------
// DISCHARGE SUMMARIES GENERATOR
// ----------------------------------------------------------------------------------
export function getSampleDischargeSummaries(patient: Partial<Patient>): DischargeSummaryRecord[] {
  const pId = patient.id || 'PID-1042';
  const hospital = patient.originHospital || 'St. Jude Memorial Trauma Center';

  if (pId === 'PID-1042') {
    return [
      {
        id: `DIS-${pId}-01`,
        patientId: pId,
        admissionDate: '2026-09-08 18:45',
        dischargeDate: '2026-09-12 11:30',
        lengthOfStay: '4 Days (96 Hours)',
        department: 'Acute Trauma Surgery & Thoracic Critical Care',
        attendingPhysician: 'Dr. Evelyn Reed, MD (Chief Trauma Triage Coordinator)',
        hospitalName: hospital,
        primaryDiagnosis: 'Traumatic Pneumothorax (Left) with Multiple Rib Fractures (Left 4th-6th)',
        icdCode: 'S27.0XXA / S22.41XA',
        secondaryDiagnoses: ['Chest Wall Contusion', 'Documented Penicillin & NSAID Allergy'],
        clinicalSummary:
          'A 34-year-old male was brought in by EMS following a multi-vehicle highway collision. Rapid biometric scanning enabled instant identification and flagged a life-threatening penicillin allergy. On presentation, patient had left-sided apical pneumothorax (15%) and left 4th-6th posterior rib fractures. A 14-French pigtail catheter was inserted with immediate air decompression. Patient was managed in the Trauma Intermediate Care Unit with multimodal analgesia, incentive spirometry, and respiratory therapy. Serial chest radiographs demonstrated complete pulmonary re-expansion. Chest tube was successfully clamped for 12 hours without pneumothorax recurrence and safely removed on Day 3 without complications.',
        proceduresPerformed: [
          'Left tube thoracostomy (14 Fr pigtail catheter placement) under local anesthesia',
          'Trauma protocol whole body 64-slice contrast CT',
          'Incentive spirometry and chest physical therapy',
          'Safe thoracostomy tube removal with occlusive dressing application',
        ],
        conditionAtDischarge: 'Stable',
        dischargeMedications: [
          {
            name: 'Acetaminophen (Tylenol)',
            dosage: '650 mg',
            frequency: 'Every 6 hours PRN for pain',
            duration: '7 Days',
            instructions: 'Do not exceed 3000 mg in 24 hours. Avoid alcohol.',
          },
          {
            name: 'Tramadol HCl',
            dosage: '50 mg',
            frequency: 'Every 8 hours PRN severe pain only',
            duration: '3 Days',
            instructions: 'May cause drowsiness. Do not drive or operate machinery.',
          },
          {
            name: 'Polyethylene Glycol (Miralax)',
            dosage: '17 g in 8 oz water',
            frequency: 'Once daily as needed',
            duration: '5 Days',
            instructions: 'Prevent constipation associated with analgesic therapy.',
          },
        ],
        dietaryAdvice: 'Regular nutritious diet high in protein and fiber. Maintain hydration (2-3 liters water daily).',
        activityRestrictions:
          'No heavy lifting exceeding 10 lbs for 4 weeks. No contact sports or high-altitude flights for 6 weeks until thoracic clinic clearance. Daily light walking encouraged.',
        followUpDate: '2026-09-19 (7 days post-discharge)',
        followUpInstructions:
          'Review at St. Jude Outpatient Trauma Clinic, Suite 402 with Dr. Evelyn Reed. Repeat PA & Lateral chest radiograph 30 minutes prior to consultation.',
        emergencyWarningSigns: [
          'Sudden shortness of breath or rapid breathing',
          'Sharp, worsening left chest pain on deep inspiration',
          'Coughing up blood or blood-tinged sputum',
          'Fever greater than 101.0°F (38.3°C) or chills',
          'Redness, swelling, or foul-smelling drainage from chest tube site',
        ],
        createdAt: '2026-09-12T11:30:00Z',
      },
    ];
  } else if (pId === 'PID-1088') {
    return [
      {
        id: `DIS-${pId}-01`,
        patientId: pId,
        admissionDate: '2026-09-08 20:10',
        dischargeDate: '2026-09-09 14:00',
        lengthOfStay: '18 Hours (Observation)',
        department: 'Emergency Medicine & Acute Pulmonology',
        attendingPhysician: 'Dr. Marcus Vance, MD (Critical Care Attending)',
        hospitalName: hospital,
        primaryDiagnosis: 'Acute Severe Exacerbation of Bronchial Asthma (Status Asthmaticus - Resolved)',
        icdCode: 'J45.901',
        secondaryDiagnoses: ['Mild Respiratory Acidosis (Corrected)', 'Sulfa Allergy'],
        clinicalSummary:
          'A 28-year-old female was admitted via paramedics from a subway station with acute severe bronchospasm and audible expiratory wheezing following strenuous exertion. Peak expiratory flow (PEF) on arrival was 180 L/min (42% predicted). Treated with nebulized albuterol, ipratropium bromide, and IV methylprednisolone. Marked clinical improvement noted with clearing of wheezes and normalization of arterial blood gas. Prednisolone oral step-down regimen initiated.',
        proceduresPerformed: [
          'Continuous jet nebulization therapy with oxygen supplementation',
          'Peak flow spirometry monitoring (improved from 180 to 420 L/min)',
          'Radial arterial blood gas analysis',
        ],
        conditionAtDischarge: 'Improved',
        dischargeMedications: [
          {
            name: 'Prednisone Oral Tablets',
            dosage: '40 mg',
            frequency: 'Once daily in the morning with food',
            duration: '5 Days (No taper needed)',
            instructions: 'Complete full 5-day course.',
          },
          {
            name: 'Budesonide-Formoterol (Symbicort)',
            dosage: '160/4.5 mcg',
            frequency: '2 puffs twice daily',
            duration: 'Ongoing maintenance',
            instructions: 'Rinse mouth after each use.',
          },
          {
            name: 'Albuterol HFA Inhaler',
            dosage: '90 mcg/puff',
            frequency: '2 puffs Q4H PRN shortness of breath',
            duration: 'As needed',
            instructions: 'Keep rescue inhaler readily available at all times.',
          },
        ],
        dietaryAdvice: 'General diet. Avoid sulfa medications.',
        activityRestrictions: 'Avoid strenuous aerobic workouts for 72 hours. Resume daily activities as tolerated.',
        followUpDate: '2026-09-16 (1 week)',
        followUpInstructions:
          'Appointment at Pulmonology Specialty Clinic for comprehensive asthma action plan review.',
        emergencyWarningSigns: [
          'Peak flow drops below 50% of personal best (< 250 L/min)',
          'Inability to speak in full sentences due to breathlessness',
          'Rescue inhaler provides relief lasting less than 3 hours',
          'Cyanosis (bluish tint) around lips or fingernails',
        ],
        createdAt: '2026-09-09T14:00:00Z',
      },
    ];
  } else {
    return [
      {
        id: `DIS-${pId}-01`,
        patientId: pId,
        admissionDate: '2026-09-06 10:00',
        dischargeDate: '2026-09-07 16:00',
        lengthOfStay: '30 Hours',
        department: 'General Clinical Observation',
        attendingPhysician: 'Attending Physician, MD',
        hospitalName: hospital,
        primaryDiagnosis: 'Acute Clinical Observation & Wound Care',
        icdCode: 'Z04.9',
        clinicalSummary:
          'Patient evaluated, treated and monitored for acute symptoms. Vitals stabilized, treatment completed, discharge criteria fulfilled.',
        proceduresPerformed: ['Physical assessment', 'Diagnostic screening', 'Local wound dressing'],
        conditionAtDischarge: 'Stable',
        dischargeMedications: [
          {
            name: 'Oral Analgesic / Antibiotic as indicated',
            dosage: 'Standard dose',
            frequency: 'Twice daily',
            duration: '5 Days',
          },
        ],
        followUpDate: 'In 7 Days',
        followUpInstructions: 'Follow up with primary healthcare provider.',
        emergencyWarningSigns: ['Severe unremitting pain', 'High fever', 'Bleeding or worsening swelling'],
        createdAt: '2026-09-07T16:00:00Z',
      },
    ];
  }
}

// Helper to enrich a patient record with default clinical records if missing
export function enrichPatientWithClinicalData(patient: Patient): Patient {
  const scans = patient.scanReports && patient.scanReports.length > 0 ? patient.scanReports : getSampleScanReports(patient);
  const rx = patient.prescriptions && patient.prescriptions.length > 0 ? patient.prescriptions : getSamplePrescriptions(patient);
  const labs = patient.labReports && patient.labReports.length > 0 ? patient.labReports : getSampleLabReports(patient);
  const summaries = patient.dischargeSummaries && patient.dischargeSummaries.length > 0 ? patient.dischargeSummaries : getSampleDischargeSummaries(patient);

  return {
    ...patient,
    scanReports: scans,
    prescriptions: rx,
    labReports: labs,
    dischargeSummaries: summaries,
  };
}
