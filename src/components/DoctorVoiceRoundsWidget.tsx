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
  X,
  Maximize2,
  Minimize2,
  ArrowRight,
  AlertTriangle,
  HeartPulse,
  Pill,
  Activity,
  User,
  Check,
  Copy,
  Radio,
  Languages,
} from 'lucide-react';
import { Patient, EmergencyCase } from '../types';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speechController,
  processDoctorVoiceQuery,
  VoiceQueryResponse,
} from '../services/voiceAssistant';
import { useToast } from './Toast';

interface DoctorVoiceRoundsWidgetProps {
  patients: Patient[];
  emergencyCases: EmergencyCase[];
  onSelectPatient?: (patient: Patient) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const DoctorVoiceRoundsWidget: React.FC<DoctorVoiceRoundsWidgetProps> = ({
  patients,
  emergencyCases,
  onSelectPatient,
  isOpen,
  onToggle,
  onClose,
}) => {
  const { showToast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [voiceLang, setVoiceLang] = useState<'ta-IN' | 'en-IN'>('en-IN');
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeResponse, setActiveResponse] = useState<VoiceQueryResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Subscribe to speech synthesis state updates
  useEffect(() => {
    const unsubscribe = speechController.subscribe((speaking, paused) => {
      setIsSpeaking(speaking);
      setIsPaused(paused);
    });
    return () => {
      unsubscribe();
      speechController.stop();
    };
  }, []);

  // Initialize Web Speech Recognition
  const startListening = () => {
    setRecognitionError(null);
    if (!isSpeechRecognitionSupported()) {
      showToast(
        'error',
        'Voice Recognition Not Supported',
        'Your browser does not support Web Speech Recognition. You can type your question in the text box below.'
      );
      return;
    }

    try {
      speechController.stop(); // Stop speaking while listening

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

        // If finalized
        if (event.results[0].isFinal) {
          handleExecuteQuery(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission was denied. Please allow microphone access in browser settings.');
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
      console.error('Failed to start recognition:', err);
      setIsListening(false);
      setRecognitionError('Could not start microphone.');
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

  // Process and speak response
  const handleExecuteQuery = (textQuery: string) => {
    const q = textQuery.trim();
    if (!q) return;

    stopListening();
    setTranscript(q);

    // Process using medical voice assistant service
    const response = processDoctorVoiceQuery(q, patients, emergencyCases);
    setActiveResponse(response);

    // Auto-speak out the clinical summary
    const textToSpeak = voiceLang === 'ta-IN' ? response.spokenSummaryTamil : response.spokenSummary;
    speechController.speak(textToSpeak, {
      lang: voiceLang,
      rate: voiceRate,
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim()) {
      handleExecuteQuery(manualQuery.trim());
      setManualQuery('');
    }
  };

  const handlePlaySpokenText = (langToUse = voiceLang) => {
    if (!activeResponse) return;
    const text = langToUse === 'ta-IN' ? activeResponse.spokenSummaryTamil : activeResponse.spokenSummary;
    speechController.speak(text, {
      lang: langToUse,
      rate: voiceRate,
    });
  };

  const handleTogglePlayPause = () => {
    if (isSpeaking && !isPaused) {
      speechController.pause();
    } else if (isPaused) {
      speechController.resume();
    } else if (activeResponse) {
      handlePlaySpokenText();
    }
  };

  const handleStopSpeech = () => {
    speechController.stop();
  };

  const handleCopySummary = () => {
    if (!activeResponse) return;
    navigator.clipboard.writeText(activeResponse.displayText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const sampleVoicePrompts = [
    { label: 'Patient Rajesh Summary', query: 'Tell me about patient Rajesh Sharma', lang: 'en-IN' },
    { label: 'ராஜேஷ் ஷர்மா (தமிழ்)', query: 'பேஷன்ட் ராஜேஷ் ஷர்மா பற்றி சொல்லு', lang: 'ta-IN' },
    { label: 'PID-1042 Allergies & Meds', query: 'What are the allergies and medications for PID-1042?', lang: 'en-IN' },
    { label: 'Unidentified Cases', query: 'Which patients are still unidentified?', lang: 'en-IN' },
    { label: 'மீரா படேல் விவரம்', query: 'நோயாளி மீரா படேல் மருத்துவ விவரம் என்ன?', lang: 'ta-IN' },
    { label: 'Emergency Trauma 9901', query: 'Summarize emergency case TEMP-9901', lang: 'en-IN' },
  ];

  return (
    <>
      {/* Universal Floating Doctor Voice Button (Visible on every screen) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="doctor-voice-rounds-floating-btn"
            onClick={onToggle}
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-teal-700/30 border border-teal-400/40 transition-all cursor-pointer"
            title="Doctor Voice Assistant • Ask patient details and listen to spoken summary"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute -inset-1 rounded-full bg-teal-300 opacity-40 animate-ping" />
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Mic className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight">Doctor Voice AI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                  குரல்
                </span>
              </div>
              <p className="text-[11px] text-teal-100 font-normal">Ask patient & listen</p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Interactive Voice Console Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="doctor-voice-rounds-modal"
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white flex items-center justify-between border-b border-teal-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                      Doctor Voice Rounds AI
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Spoken Audio
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Ask patient details by voice • AI speaks back the concise clinical summary
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setVoiceLang('en-IN')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      voiceLang === 'en-IN'
                        ? 'bg-teal-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setVoiceLang('ta-IN')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      voiceLang === 'ta-IN'
                        ? 'bg-teal-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>

                <button
                  id="close-voice-rounds-btn"
                  onClick={() => {
                    speechController.stop();
                    stopListening();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
              {/* Central Voice Recording Hub */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs text-center relative overflow-hidden">
                <div className="max-w-md mx-auto space-y-4">
                  {/* Big Microphone Button with Audio Wave Rings */}
                  <div className="relative inline-flex items-center justify-center my-2">
                    {isListening && (
                      <>
                        <span className="absolute -inset-4 rounded-full bg-teal-500/20 animate-ping" />
                        <span className="absolute -inset-8 rounded-full bg-emerald-500/10 animate-pulse" />
                      </>
                    )}

                    <button
                      id="voice-mic-main-btn"
                      onClick={isListening ? stopListening : startListening}
                      className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer active:scale-95 ${
                        isListening
                          ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30 scale-105'
                          : 'bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-500 text-white hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/30 hover:scale-105'
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse" />
                      ) : (
                        <Mic className="w-9 h-9 sm:w-10 sm:h-10" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {isListening
                        ? 'Listening to Doctor...'
                        : isSpeaking
                        ? 'Doctor Voice AI Speaking...'
                        : 'Tap Microphone & Speak Patient Query'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isListening
                        ? voiceLang === 'ta-IN'
                          ? 'பேசுங்கள்: "நோயாளி ராஜேஷ் ஷர்மா பற்றி சொல்லு" அல்லது "PID-1042"'
                          : 'Speak now: "Tell me about patient Rajesh Sharma" or "PID-1042 vitals and medications"'
                        : 'Or type your question below. AI will speak out the complete clinical summary.'}
                    </p>
                  </div>

                  {/* Audio Equalizer Visualizer when speaking */}
                  {isSpeaking && (
                    <div className="flex items-center justify-center gap-1.5 py-2">
                      <span className="w-1.5 h-6 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-8 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-10 bg-teal-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-7 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-1.5 h-5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.35s]" />
                      <span className="ml-2 text-xs font-bold text-teal-700">Playing Spoken Briefing...</span>
                    </div>
                  )}

                  {/* Live Transcript Bubble */}
                  {transcript && (
                    <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-950 text-xs sm:text-sm font-medium text-left flex items-start gap-2.5">
                      <Radio className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                          Doctor Spoken Query:
                        </span>
                        <p className="text-slate-900 font-semibold">{transcript}</p>
                      </div>
                    </div>
                  )}

                  {recognitionError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{recognitionError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Spoken Response & Patient Briefing Card */}
              {activeResponse && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  {/* Audio Player Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 text-white">
                    <div className="flex items-center gap-2.5">
                      <button
                        id="voice-toggle-play-btn"
                        onClick={handleTogglePlayPause}
                        className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all cursor-pointer"
                        title={isSpeaking && !isPaused ? 'Pause Speech' : 'Play Speech'}
                      >
                        {isSpeaking && !isPaused ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 fill-slate-950" />
                        )}
                      </button>

                      <button
                        id="voice-replay-btn"
                        onClick={() => handlePlaySpokenText()}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        title="Replay from start"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        id="voice-stop-btn"
                        onClick={handleStopSpeech}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        title="Stop Voice"
                      >
                        <VolumeX className="w-4 h-4" />
                      </button>

                      <div className="hidden sm:flex items-center gap-1 text-xs text-slate-300 ml-1">
                        <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isSpeaking ? (isPaused ? 'Paused' : 'Speaking...') : 'Ready to listen'}</span>
                      </div>
                    </div>

                    {/* Speed Selector & Tamil Switcher */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlaySpokenText(voiceLang === 'ta-IN' ? 'en-IN' : 'ta-IN')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                        title="Switch speech audio language"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>{voiceLang === 'ta-IN' ? 'Listen in English' : 'தமிழில் கேட்க'}</span>
                      </button>

                      <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-1 rounded-lg border border-slate-700 text-xs">
                        <span className="text-[10px] text-slate-400">Speed:</span>
                        {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => {
                              setVoiceRate(rate);
                              if (isSpeaking) {
                                speechController.stop();
                                setTimeout(() => handlePlaySpokenText(), 100);
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              voiceRate === rate ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Patient Profile Snapshot (if matched) */}
                  {activeResponse.patient && (
                    <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={activeResponse.patient.photo}
                            alt={activeResponse.patient.fullName}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-teal-500 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-base text-slate-900">
                                {activeResponse.patient.fullName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs font-mono">
                                {activeResponse.patient.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {activeResponse.patient.age} years • {activeResponse.patient.gender} • Blood Group:{' '}
                              <strong className="text-rose-600">{activeResponse.patient.bloodType || 'Unknown'}</strong>
                            </p>
                          </div>
                        </div>

                        {onSelectPatient && (
                          <button
                            id="voice-open-patient-btn"
                            onClick={() => {
                              speechController.stop();
                              onSelectPatient(activeResponse.patient!);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <span>Open Locker</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Critical Allergies & Alerts */}
                      {activeResponse.criticalAlerts && activeResponse.criticalAlerts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {activeResponse.criticalAlerts.map((alert, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs font-extrabold"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{alert}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Active Medications Pills */}
                      {activeResponse.activeMeds && activeResponse.activeMeds.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-slate-500 font-semibold block text-[11px]">Active Medications:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeResponse.activeMeds.map((med, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[11px]"
                              >
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spoken Text Transcripts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-teal-700">
                        Spoken Clinical Briefing:
                      </span>
                      <button
                        onClick={handleCopySummary}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                      <p className="font-medium">
                        {voiceLang === 'ta-IN' ? activeResponse.spokenSummaryTamil : activeResponse.spokenSummary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Voice Prompts Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Quick Doctor Prompts (Click to Ask & Listen):
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleVoicePrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setVoiceLang(item.lang as any);
                        handleExecuteQuery(item.query);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 font-semibold text-xs transition-all cursor-pointer shadow-2xs text-left"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input Fallback */}
              <form onSubmit={handleManualSubmit} className="pt-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Or type patient name (e.g. Rajesh Sharma) or ID (PID-1042)..."
                    className="w-full pl-4 pr-24 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!manualQuery.trim()}
                    className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Ask AI
                  </button>
                </div>
              </form>
            </div>

            {/* Footer Disclaimer */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-500">
              MediLocker Doctor Voice Rounds • Clinical information organizing assistant. Does not replace physician judgement.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
