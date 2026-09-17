import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Search,
  ArrowRight,
  AlertTriangle,
  HeartPulse,
  Pill,
  Activity,
  User,
  Check,
  Copy,
  Languages,
  Stethoscope,
  Clock,
  Radio,
  Share2,
} from 'lucide-react';
import { Patient, EmergencyCase } from '../types';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speechController,
  processDoctorVoiceQuery,
  generateSpokenPatientSummary,
  VoiceQueryResponse,
} from '../services/voiceAssistant';
import { useToast } from '../components/Toast';

interface DoctorVoiceViewProps {
  patients: Patient[];
  emergencyCases: EmergencyCase[];
  onSelectPatient: (patient: Patient) => void;
}

export const DoctorVoiceView: React.FC<DoctorVoiceViewProps> = ({
  patients,
  emergencyCases,
  onSelectPatient,
}) => {
  const { showToast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeResponse, setActiveResponse] = useState<VoiceQueryResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Subscribe to speech controller events
  useEffect(() => {
    const unsub = speechController.subscribe((speaking, paused) => {
      setIsSpeaking(speaking);
      setIsPaused(paused);
    });
    return () => {
      unsub();
      speechController.stop();
    };
  }, []);

  const startListening = () => {
    setRecognitionError(null);
    if (!isSpeechRecognitionSupported()) {
      showToast(
        'error',
        'Voice Input Unavailable',
        'Speech recognition is not supported in this browser. You can type patient queries in the search box.'
      );
      return;
    }

    try {
      speechController.stop();

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleExecuteQuery(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission denied. Please allow microphone access in your browser address bar.');
        } else if (event.error !== 'no-speech') {
          setRecognitionError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      setRecognitionError('Failed to access microphone.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleExecuteQuery = (query: string) => {
    const q = query.trim();
    if (!q) return;

    stopListening();
    setTranscript(q);

    const result = processDoctorVoiceQuery(q, patients, emergencyCases);
    setActiveResponse(result);

    // Read aloud in selected voice
    const textToSpeak = voiceLang === 'ta-IN' ? result.spokenSummaryTamil : result.spokenSummary;
    speechController.speak(textToSpeak, {
      lang: voiceLang,
      rate: voiceRate,
    });
  };

  const handleQuickPatientBriefing = (patient: Patient) => {
    const result = generateSpokenPatientSummary(patient);
    setActiveResponse(result);
    setTranscript(`Summarize patient ${patient.fullName} (${patient.id})`);

    const textToSpeak = voiceLang === 'ta-IN' ? result.spokenSummaryTamil : result.spokenSummary;
    speechController.speak(textToSpeak, {
      lang: voiceLang,
      rate: voiceRate,
    });
  };

  const handlePlayVoice = (lang = voiceLang) => {
    if (!activeResponse) return;
    const text = lang === 'ta-IN' ? activeResponse.spokenSummaryTamil : activeResponse.spokenSummary;
    speechController.speak(text, {
      lang,
      rate: voiceRate,
    });
  };

  const handleTogglePlayPause = () => {
    if (isSpeaking && !isPaused) {
      speechController.pause();
    } else if (isPaused) {
      speechController.resume();
    } else if (activeResponse) {
      handlePlayVoice();
    }
  };

  const handleCopy = () => {
    if (!activeResponse) return;
    navigator.clipboard.writeText(activeResponse.displayText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.allergies && p.allergies.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>Hospital Rounds Assistant • வாய்ஸ் சம்மரி</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Doctor Voice Rounds (குரல் உதவியாளர்)
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Ask about any patient by speaking naturally in <strong>English or தமிழ் (Tamil)</strong>. MediLocker
              instantly extracts clinical records, active medications, vital signs, and drug allergies, then speaks the
              summary aloud.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setVoiceLang('en-IN')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                voiceLang === 'en-IN' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              English Voice
            </button>
            <button
              onClick={() => setVoiceLang('ta-IN')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                voiceLang === 'ta-IN' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              தமிழ் குரல் (Tamil)
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Console & Audio Player */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Voice Interactive Card */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
            <div className="max-w-lg mx-auto space-y-5">
              {/* Mic Icon & Ripple */}
              <div className="relative inline-flex items-center justify-center my-3">
                {isListening && (
                  <>
                    <span className="absolute -inset-4 rounded-full bg-teal-500/20 animate-ping" />
                    <span className="absolute -inset-10 rounded-full bg-emerald-500/10 animate-pulse" />
                  </>
                )}

                <button
                  id="doctor-voice-main-mic-btn"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer active:scale-95 ${
                    isListening
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30 scale-105'
                      : 'bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-500 text-white hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/30 hover:scale-105'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
                  ) : (
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
                  )}
                </button>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {isListening
                    ? 'Listening to Doctor...'
                    : isSpeaking
                    ? 'Speaking Patient Summary...'
                    : 'Press Mic & Ask Any Patient Details'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isListening
                    ? voiceLang === 'ta-IN'
                      ? 'உதாரணம்: "நோயாளி ராஜேஷ் ஷர்மா பற்றி சொல்லு", "மீரா படேல் மருந்துகள் என்ன?"'
                      : 'Example: "Tell me about Rajesh Sharma", "What are PID-1042 medications?", "Who has penicillin allergy?"'
                    : 'Hands-free clinical voice briefing for emergency doctors and hospital staff.'}
                </p>
              </div>

              {/* Sound Wave Animation */}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-1.5 h-6 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-9 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-12 bg-teal-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-8 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  <span className="w-1.5 h-5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.35s]" />
                  <span className="ml-2 text-xs font-bold text-teal-700">Audio Playback Active</span>
                </div>
              )}

              {/* Live Transcript */}
              {transcript && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs sm:text-sm font-medium text-left flex items-start gap-2.5 shadow-2xs">
                  <Radio className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                      Spoken Question:
                    </span>
                    <p className="text-slate-900 font-semibold">{transcript}</p>
                  </div>
                </div>
              )}

              {recognitionError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{recognitionError}</span>
                </div>
              )}

              {/* Text Input Fallback */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (textInput.trim()) {
                    handleExecuteQuery(textInput.trim());
                    setTextInput('');
                  }
                }}
                className="pt-2"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Or type query (e.g. Rajesh Sharma, PID-1042, Penicillin allergy)..."
                    className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Ask
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Active Audio Briefing & Response Display */}
          {activeResponse && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
              {/* Audio Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shadow-md">
                <div className="flex items-center gap-2">
                  <button
                    id="doctor-voice-play-pause-btn"
                    onClick={handleTogglePlayPause}
                    className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all cursor-pointer active:scale-95"
                    title={isSpeaking && !isPaused ? 'Pause' : 'Play'}
                  >
                    {isSpeaking && !isPaused ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-slate-950" />
                    )}
                  </button>

                  <button
                    id="doctor-voice-replay-btn"
                    onClick={() => handlePlayVoice()}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                    title="Replay Voice Summary"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    id="doctor-voice-stop-btn"
                    onClick={() => speechController.stop()}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                    title="Stop Voice"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 ml-1">
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isSpeaking ? (isPaused ? 'Audio Paused' : 'Playing Audio Briefing...') : 'Audio Ready'}</span>
                  </div>
                </div>

                {/* Voice Rate & Language Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayVoice(voiceLang === 'ta-IN' ? 'en-IN' : 'ta-IN')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{voiceLang === 'ta-IN' ? 'Listen English' : 'தமிழில் கேட்க'}</span>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
                    <span className="text-[10px] text-slate-400">Speed:</span>
                    {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setVoiceRate(rate);
                          if (isSpeaking) {
                            speechController.stop();
                            setTimeout(() => handlePlayVoice(), 100);
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                          voiceRate === rate ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient Profile Card (if matched) */}
              {activeResponse.patient && (
                <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={activeResponse.patient.photo}
                        alt={activeResponse.patient.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-lg text-slate-900">
                            {activeResponse.patient.fullName}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs font-mono">
                            {activeResponse.patient.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {activeResponse.patient.age} years • {activeResponse.patient.gender} • Blood Group:{' '}
                          <strong className="text-rose-600">{activeResponse.patient.bloodType || 'Unknown'}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      id="view-patient-locker-btn"
                      onClick={() => {
                        speechController.stop();
                        onSelectPatient(activeResponse.patient!);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <span>Open Locker</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Critical Alerts */}
                  {activeResponse.criticalAlerts && activeResponse.criticalAlerts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {activeResponse.criticalAlerts.map((alert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-extrabold"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{alert}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Active Medications */}
                  {activeResponse.activeMeds && activeResponse.activeMeds.length > 0 && (
                    <div className="text-xs space-y-1.5 pt-1">
                      <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                        Active Medications & Dosages:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResponse.activeMeds.map((med, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold text-xs shadow-2xs"
                          >
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spoken Text Transcript */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-teal-700">
                    Spoken Script ({voiceLang === 'ta-IN' ? 'தமிழ்' : 'English'}):
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed font-medium">
                  {voiceLang === 'ta-IN' ? activeResponse.spokenSummaryTamil : activeResponse.spokenSummary}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Patient Selector for Instant Audio Briefings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Admitted Patients ({patients.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Tap any patient to instantly hear their audio briefing
                </p>
              </div>
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <Volume2 className="w-4 h-4" />
              </span>
            </div>

            {/* Patient Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by name, ID, or condition..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleQuickPatientBriefing(patient)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={patient.photo}
                      alt={patient.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate group-hover:text-teal-900">
                          {patient.fullName}
                        </h5>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {patient.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {patient.age}y • {patient.gender} • Blood: {patient.bloodType || 'Unknown'}
                      </p>
                      {patient.allergies && (
                        <span className="text-[10px] text-rose-600 font-bold block truncate">
                          Allergy: {patient.allergies}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-all"
                      title="Listen to audio briefing"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
