import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, ArrowLeft, Upload, File as FileIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';

// Access the browser's SpeechRecognition API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface PathwayGeneratorProps {
  onGenerate: (data: {
    goal: string;
    skillLevel: string;
    purpose: string;
    timeAvailable: string;
    specialConstraints: string;
    uploadedFile?: { name: string, dataUrl: string, mimeType: string };
  }) => void;
  onBack: () => void;
}

const VoiceField = ({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  placeholder: string;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
           onChange(value ? `${value} ${finalTranscript}`.trim() : finalTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please allow it or open the app in a new tab.');
        } else {
          setErrorMsg(`Voice input error: ${event.error}`);
        }
        setTimeout(() => setErrorMsg(null), 5000);
      };

      recognitionRef.current = recognition;
    }
  }, [onChange, value]);

  const toggleListening = () => {
    setErrorMsg(null);
    if (!recognitionRef.current) {
      setErrorMsg("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <label className="text-xs font-black uppercase italic text-orange-500 accent-orange">
          {label}
        </label>
        {errorMsg && (
          <span className="text-xs font-bold text-red-500 animate-pulse">{errorMsg}</span>
        )}
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border-2 md:border-4 border-[var(--card-border)] p-3 md:p-4 pr-12 md:pr-14 font-bold focus:border-orange-500 outline-none transition-colors resize-none placeholder:text-[var(--placeholder)] h-20 md:h-24 text-sm md:text-base"
        />
        <button
          type="button"
          onClick={toggleListening}
          className={cn(
            "absolute bottom-3 right-3 md:bottom-4 md:right-4 p-1.5 md:p-2 rounded-full transition-colors",
            isListening ? "bg-red-500 text-white animate-pulse" : "bg-[var(--card-bg)] text-[var(--text-main)] hover:text-orange-500 border-2 border-[var(--card-border)]"
          )}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? <MicOff size={16} className="md:w-5 md:h-5" /> : <Mic size={16} className="md:w-5 md:h-5" />}
        </button>
      </div>
    </div>
  );
};

export const PathwayGenerator: React.FC<PathwayGeneratorProps> = ({ onGenerate, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    goal: '',
    skillLevel: '',
    purpose: '',
    timeAvailable: '',
    specialConstraints: '',
    uploadedFile: undefined as { name: string, dataUrl: string, mimeType: string } | undefined
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onGenerate(formData);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        uploadedFile: {
          name: file.name,
          dataUrl: dataUrl,
          mimeType: file.type || 'application/octet-stream'
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
        {/* Header */}
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={onBack}
            className="p-2 md:p-3 border-2 md:border-4 border-black hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] transition-colors inline-flex bg-[var(--card-bg)]"
          >
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div className="overflow-hidden">
            <span className="font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-orange-500 block mb-1">Configuration</span>
            <h1 className="text-3xl md:text-7xl font-black uppercase italic leading-none truncate">Pathway Generator</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 bg-[var(--card-bg)] p-4 md:p-8 border-4 border-[var(--card-border)] shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] md:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
          <VoiceField 
            label="1. Ultimate Goal"
            value={formData.goal}
            onChange={(v) => setFormData({ ...formData, goal: v })}
            placeholder="e.g. Master quantum mechanics, build a full-stack app..."
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase italic text-orange-500 accent-orange">
              2. Current Skill Level
            </label>
            <select
              value={formData.skillLevel}
              onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
              className="w-full bg-[var(--input-bg)] text-[var(--text-main)] border-4 border-[var(--card-border)] p-4 font-bold focus:border-orange-500 outline-none transition-colors"
            >
              <option value="" disabled>Select your skill level...</option>
              <option value="Absolute Beginner">Absolute Beginner</option>
              <option value="Have some background">Have some background</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <VoiceField 
            label="3. Purpose / Motivation"
            value={formData.purpose}
            onChange={(v) => setFormData({ ...formData, purpose: v })}
            placeholder="e.g. For academic research, career change, just for fun..."
          />

          <div className="flex flex-col gap-4">
            <label className="text-xs font-black uppercase italic text-orange-500 accent-orange">
              4. Time Available
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "15-30 mins/day", val: "15-30 mins/day" },
                { label: "1-2 hours/day", val: "1-2 hours/day" },
                { label: "3-5 hours/day", val: "3-5 hours/day" },
                { label: "Weekends only", val: "Weekends only" },
              ].map((opt) => (
                <motion.button
                  type="button"
                  key={opt.val}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, timeAvailable: opt.val })}
                  className={cn(
                    "p-4 border-4 font-bold transition-colors text-center text-sm",
                    formData.timeAvailable === opt.val
                      ? "border-orange-500 bg-orange-500 text-black shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]"
                      : "border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-main)] hover:border-orange-500"
                  )}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>

          <VoiceField 
            label="5. Specifications / Others"
            value={formData.specialConstraints}
            onChange={(v) => setFormData({ ...formData, specialConstraints: v })}
            placeholder="e.g. Dyslexia friendly, visual learner mostly... use this to personalize the pathway according to user"
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase italic text-orange-500 accent-orange">
              6. Supplemental Material (Optional)
            </label>
            <div className="text-sm opacity-70 mb-2">Upload notes, a syllabus, or any specifications to guide the pathway generation.</div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.txt,.md,image/*" 
            />
            {formData.uploadedFile ? (
              <div className="flex items-center justify-between p-4 bg-[var(--input-bg)] border-4 border-orange-500 text-[var(--text-main)] font-bold">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="shrink-0 text-orange-500" />
                  <span className="truncate">{formData.uploadedFile.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, uploadedFile: undefined }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 hover:bg-orange-500 hover:text-black transition-colors rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 p-6 border-4 border-dashed border-[var(--card-border)] bg-[var(--input-bg)] hover:border-orange-500 hover:text-orange-500 transition-colors font-black uppercase text-sm"
              >
                <Upload size={20} />
                Upload Notes / Syllabus
              </button>
            )}
          </div>

          <button 
            type="submit"
            disabled={!formData.goal || !formData.skillLevel || !formData.timeAvailable || isGenerating}
            className="w-full bg-[var(--text-main)] text-[var(--bg-main)] font-black uppercase italic text-2xl py-6 hover:bg-orange-500 hover:text-black transition-colors border-4 border-transparent hover:border-black disabled:opacity-50 disabled:cursor-not-allowed mt-8 relative"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin h-6 w-6 border-4 border-black border-t-transparent rounded-full" />
                Synthesizing Neural Pathway...
              </span>
            ) : (
              'Generate Neural Pathway'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PathwayGenerator;
