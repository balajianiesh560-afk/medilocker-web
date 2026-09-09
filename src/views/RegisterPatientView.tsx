import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { Patient, PatientStatus } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { BiometricSimulator } from '../components/BiometricSimulator';
import { generateAvatar } from '../data/sampleData';

interface RegisterPatientViewProps {
  initialPatient?: Patient | null;
  onSaved: (patient: Patient) => void;
  onCancel?: () => void;
}

export const RegisterPatientView: React.FC<RegisterPatientViewProps> = ({
  initialPatient,
  onSaved,
  onCancel,
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(initialPatient);

  // Auto-generate fresh ID if not editing
  const generateNewId = () => `PID-${Math.floor(1000 + Math.random() * 9000)}`;

  const [patientId, setPatientId] = useState(initialPatient?.id || generateNewId());
  const [fullName, setFullName] = useState(initialPatient?.fullName || '');
  const [age, setAge] = useState<string | number>(initialPatient?.age || '');
  const [gender, setGender] = useState(initialPatient?.gender || 'Male');
  const [phone, setPhone] = useState(initialPatient?.phone || '');
  const [photo, setPhoto] = useState(initialPatient?.photo || generateAvatar('PT', '#0284c7'));
  const [identificationRemarks, setIdentificationRemarks] = useState(
    initialPatient?.identificationRemarks || ''
  );
  const [fingerprintRefId, setFingerprintRefId] = useState(
    initialPatient?.fingerprintRefId || `FP-${Math.floor(1000 + Math.random() * 9000)}-A1`
  );
  const [emergencyNotes, setEmergencyNotes] = useState(initialPatient?.emergencyNotes || '');
  const [status, setStatus] = useState<PatientStatus>(initialPatient?.status || 'Identified');
  const [bloodType, setBloodType] = useState(initialPatient?.bloodType || 'O+');
  const [allergies, setAllergies] = useState(initialPatient?.allergies || 'No Known Allergies');

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset or initialize if initialPatient changes
  useEffect(() => {
    if (initialPatient) {
      setPatientId(initialPatient.id);
      setFullName(initialPatient.fullName);
      setAge(initialPatient.age);
      setGender(initialPatient.gender);
      setPhone(initialPatient.phone);
      setPhoto(initialPatient.photo);
      setIdentificationRemarks(initialPatient.identificationRemarks);
      setFingerprintRefId(initialPatient.fingerprintRefId);
      setEmergencyNotes(initialPatient.emergencyNotes);
      setStatus(initialPatient.status);
      setBloodType(initialPatient.bloodType || 'O+');
      setAllergies(initialPatient.allergies || 'No Known Allergies');
    }
  }, [initialPatient]);

  const handleRegenerateId = () => {
    if (!isEditing) {
      setPatientId(generateNewId());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim()) {
      setValidationError('Please enter a patient name or temporary identification moniker.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Patient> = {
        id: patientId,
        fullName: fullName.trim(),
        age: age || 'Unknown',
        gender,
        phone: phone.trim() || 'Unrecorded',
        photo,
        identificationRemarks: identificationRemarks.trim(),
        fingerprintRefId: fingerprintRefId.trim() || `FP-${Math.floor(1000 + Math.random() * 9000)}-UN`,
        emergencyNotes: emergencyNotes.trim(),
        status,
        bloodType,
        allergies,
      };

      let savedPatient: Patient;
      if (isEditing && initialPatient) {
        savedPatient = await api.updatePatient(initialPatient.id, payload);
        showToast('success', 'Patient Record Updated', `${savedPatient.fullName} (${savedPatient.id}) updated successfully.`);
      } else {
        savedPatient = await api.createPatient(payload);
        showToast('success', 'Patient Registered Successfully', `Record ${savedPatient.id} has been added to hospital database.`);
      }

      onSaved(savedPatient);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save patient record. Please check network connection.');
      showToast('error', 'Error Saving Patient', err?.message || 'Database write error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              id="patient-form-cancel-top-btn"
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isEditing ? `Edit Patient Record: ${initialPatient?.id}` : 'Patient Registration Form'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Update stored biometric references, personal attributes, and emergency notes.'
                : 'Enter trauma admission details, distinctive remarks, and biometric reference keys.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
            {patientId}
          </span>
          {!isEditing && (
            <button
              id="regenerate-id-btn"
              type="button"
              onClick={handleRegenerateId}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Generate a new Patient ID"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Biometric Reference */}
        <BiometricSimulator
          photoValue={photo}
          onPhotoChange={setPhoto}
          fingerprintRefId={fingerprintRefId}
          onFingerprintChange={setFingerprintRefId}
          patientNamePlaceholder={fullName || 'PT'}
        />

        {/* Section 2: Core Patient Identification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Personal & Demographics Record</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="full-name-input">
                Full Legal Name / Identification Moniker <span className="text-rose-500">*</span>
              </label>
              <input
                id="full-name-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Liam Alexander Walker or Unknown Male #5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                For unidentified patients, enter temporary identifier (e.g. "Unknown Female - Blue Jacket").
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="status-select">
                Identification Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              >
                <option value="Identified">Identified (Full Match)</option>
                <option value="Unidentified">Unidentified (Pending Biometric/Family Match)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="age-input">
                Age or Estimated Age
              </label>
              <input
                id="age-input"
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34 or Approx. 30-35"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gender-select">
                Gender
              </label>
              <select
                id="gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Unknown">Unknown / Indeterminate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="phone-input">
                Contact Phone Number
              </label>
              <input
                id="phone-input"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 389-4412"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="blood-type-select">
                Blood Type
              </label>
              <select
                id="blood-type-select"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Pending Lab / Unknown</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="allergies-input">
                Recorded Allergies
              </label>
              <input
                id="allergies-input"
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, Latex"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Identification Remarks & Clinical Emergency Notes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>Physical Markers & Emergency Notes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="remarks-textarea">
                Identification Remarks
              </label>
              <textarea
                id="remarks-textarea"
                rows={4}
                value={identificationRemarks}
                onChange={(e) => setIdentificationRemarks(e.target.value)}
                placeholder="Record distinctive physical markers: scars, tattoos, birthmarks, jewelry, dental features, clothing, or personal effects found on patient."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white leading-relaxed resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Crucial for visual re-identification during multi-casualty incidents.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emergency-notes-textarea">
                Emergency Clinical Notes
              </label>
              <textarea
                id="emergency-notes-textarea"
                rows={4}
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="Immediate triage observations, vitals on intake, trauma severity, location found, incoming paramedic notes."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white leading-relaxed resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Included in the AI-generated clinical summary for attending staff.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              id="patient-form-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            id="patient-form-save-btn"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Record...' : isEditing ? 'Update Patient Record' : 'Save Patient'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
