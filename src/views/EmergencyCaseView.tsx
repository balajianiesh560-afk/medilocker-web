import React, { useState } from 'react';
import {
  AlertOctagon,
  Save,
  RotateCcw,
  Clock,
  MapPin,
  HeartPulse,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import { EmergencyCase, EmergencyStatus } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { BiometricSimulator } from '../components/BiometricSimulator';
import { generateAvatar } from '../data/sampleData';

interface EmergencyCaseViewProps {
  onSaved: (emergencyCase: EmergencyCase) => void;
  onCancel?: () => void;
}

export const EmergencyCaseView: React.FC<EmergencyCaseViewProps> = ({
  onSaved,
  onCancel,
}) => {
  const { showToast } = useToast();

  const generateTempId = () => `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
  const getInitialDateTime = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').slice(0, 16);
  };

  const [temporaryId, setTemporaryId] = useState(generateTempId());
  const [photo, setPhoto] = useState(generateAvatar('?', '#ea580c'));
  const [estimatedAge, setEstimatedAge] = useState('Approx. 30-35');
  const [gender, setGender] = useState('Male');
  const [identificationRemarks, setIdentificationRemarks] = useState('');
  const [fingerprintRefId, setFingerprintRefId] = useState(
    `FP-${Math.floor(1000 + Math.random() * 9000)}-UN`
  );
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [dateTime, setDateTime] = useState(getInitialDateTime());
  const [identificationStatus, setIdentificationStatus] = useState<EmergencyStatus>('Unidentified');
  const [triageLevel, setTriageLevel] = useState<'Immediate' | 'Delayed' | 'Minimal' | 'Expectant'>('Immediate');
  const [locationFound, setLocationFound] = useState('Field Trauma Rescue Site');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegenerateId = () => {
    setTemporaryId(generateTempId());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const payload: Partial<EmergencyCase> = {
        temporaryId,
        photo,
        estimatedAge: estimatedAge || 'Unknown',
        gender,
        identificationRemarks: identificationRemarks.trim(),
        fingerprintRefId: fingerprintRefId.trim() || `FP-${Math.floor(1000 + Math.random() * 9000)}-UN`,
        emergencyNotes: emergencyNotes.trim(),
        dateTime,
        identificationStatus,
        triageLevel,
        locationFound: locationFound.trim(),
      };

      const savedCase = await api.createEmergencyCase(payload);
      showToast(
        'success',
        'Emergency Case Registered',
        `Temporary Emergency ID ${savedCase.temporaryId} saved to triage registry.`
      );
      onSaved(savedCase);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save emergency case');
      showToast('error', 'Error Saving Case', err?.message || 'Server error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Rapid Intake Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 text-white p-6 rounded-2xl shadow-lg shadow-rose-600/20">
        <div className="flex items-center gap-3.5">
          {onCancel && (
            <button
              id="emergency-form-cancel-top-btn"
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-rose-700 font-mono">
                RAPID TRIAGE PROTOCOL
              </span>
              <span className="text-xs font-semibold text-rose-100">Mass Casualty Intake</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">Emergency Case Registration</h2>
            <p className="text-xs text-rose-100 mt-0.5">
              Rapid physical identification, immediate vitals, and reference assignment for incoming trauma admissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/30 font-mono text-sm font-bold text-white">
            {temporaryId}
          </div>
          <button
            id="regen-temp-id-btn"
            type="button"
            onClick={handleRegenerateId}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Generate new Temporary ID"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Biometric Reference */}
        <BiometricSimulator
          photoValue={photo}
          onPhotoChange={setPhoto}
          fingerprintRefId={fingerprintRefId}
          onFingerprintChange={setFingerprintRefId}
          patientNamePlaceholder="EMG"
        />

        {/* Section 2: Case Parameters & Triage */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Emergency Status & Triage Intake Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-status-select">
                Identification Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="emg-status-select"
                value={identificationStatus}
                onChange={(e) => setIdentificationStatus(e.target.value as EmergencyStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="Unidentified">Unidentified (John/Jane Doe)</option>
                <option value="In Progress">In Progress (Biometric / Family Match Pending)</option>
                <option value="Identified">Identified (Confirmed Identity)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-triage-select">
                Triage Acuity Level <span className="text-rose-500">*</span>
              </label>
              <select
                id="emg-triage-select"
                value={triageLevel}
                onChange={(e) => setTriageLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="Immediate">Immediate (Red - Resuscitation / Severe Trauma)</option>
                <option value="Delayed">Delayed (Yellow - Serious but stable)</option>
                <option value="Minimal">Minimal (Green - Walking wounded / Minor)</option>
                <option value="Expectant">Expectant (Black - Non-salvageable)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-datetime-input">
                Date & Time of Intake <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="emg-datetime-input"
                  type="text"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-age-input">
                Estimated Age
              </label>
              <input
                id="emg-age-input"
                type="text"
                value={estimatedAge}
                onChange={(e) => setEstimatedAge(e.target.value)}
                placeholder="e.g. Approx. 25-30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-gender-select">
                Gender
              </label>
              <select
                id="emg-gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Unknown">Unknown / Indeterminate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-location-input">
                Location Found / Incident Site
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="emg-location-input"
                  type="text"
                  value={locationFound}
                  onChange={(e) => setLocationFound(e.target.value)}
                  placeholder="e.g. I-95 Mile Marker 42"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Physical Identification Remarks & Emergency Notes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Physical Identification Remarks & Emergency Triage Notes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-remarks-textarea">
                Identification Remarks <span className="text-slate-400 font-normal">(Scars, Tattoos, Jewelry, Clothing)</span>
              </label>
              <textarea
                id="emg-remarks-textarea"
                rows={4}
                value={identificationRemarks}
                onChange={(e) => setIdentificationRemarks(e.target.value)}
                placeholder="Physical markers noted on arrival: scars, tattoos, distinctive clothing (e.g. yellow rain jacket), wristwatch, wallet items, race wristbands."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white leading-relaxed resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used by family liaisons and law enforcement to cross-reference missing person logs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="emg-notes-textarea">
                Emergency Triage & Clinical Notes
              </label>
              <textarea
                id="emg-notes-textarea"
                rows={4}
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="Initial vitals, suspected injury patterns, consciousness status (GCS), resuscitation measures underway, paramedic handoff notes."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white leading-relaxed resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Critical notes visible to attending trauma surgeons and resuscitation teams.
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              id="emergency-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            id="emergency-save-case-btn"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Logging Emergency Case...' : 'Save Emergency Case'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
