import React, { useState } from 'react';
import { Mic, FileText, Edit3, User, CheckCircle2 } from 'lucide-react';
import { VOICE_OPTIONS } from '../types';
import { VoiceInput } from './VoiceInput';

interface ScriptReviewProps {
  initialScript: string;
  onConfirm: (script: string, voiceName: string) => void;
  isProcessing: boolean;
}

export const ScriptReview: React.FC<ScriptReviewProps> = ({ initialScript, onConfirm, isProcessing }) => {
  const [script, setScript] = useState(initialScript);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Review & Narrator</h2>
        <p className="text-zinc-400">Polish the script and choose the voice for your tutorial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-zinc-400 text-sm px-1">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4"/> Script Editor</span>
                <div className="flex items-center gap-3">
                    <VoiceInput onTranscript={(t) => setScript(prev => prev ? `${prev} ${t}` : t)} />
                    <span className="flex items-center gap-2"><Edit3 className="w-3 h-3"/> Editable</span>
                </div>
            </div>
            <div className="relative group h-[500px]">
                <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 text-zinc-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[rgba(var(--c-primary),0.5)] focus:border-[rgb(var(--c-primary))] transition-all resize-none font-mono text-sm shadow-inner"
                />
            </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Select Voice
                </label>
                <div className="grid grid-cols-1 gap-3">
                    {VOICE_OPTIONS.map((voice) => (
                        <button
                            key={voice.id}
                            onClick={() => setSelectedVoice(voice.id)}
                            disabled={isProcessing}
                            className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                selectedVoice === voice.id 
                                ? 'bg-zinc-800 border-[rgb(var(--c-secondary))] shadow-lg shadow-[rgba(var(--c-secondary),0.1)]' 
                                : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                selectedVoice === voice.id 
                                ? 'bg-[rgb(var(--c-secondary))] text-white' 
                                : 'bg-zinc-800 text-zinc-500'
                            }`}>
                                {voice.gender === 'Male' ? 'M' : 'F'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className={`font-bold text-sm truncate ${selectedVoice === voice.id ? 'text-white' : 'text-zinc-300'}`}>
                                        {voice.name}
                                    </p>
                                    {selectedVoice === voice.id && <CheckCircle2 className="w-4 h-4 text-[rgb(var(--c-secondary))]" />}
                                </div>
                                <p className="text-xs text-zinc-500 truncate">{voice.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-800">
                <button
                    onClick={() => onConfirm(script, selectedVoice)}
                    disabled={isProcessing}
                    className="w-full bg-[rgb(var(--c-secondary))] hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-[rgba(var(--c-secondary),0.2)] transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isProcessing ? (
                    <span className="flex items-center gap-3">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                    </span>
                    ) : (
                    <>
                        <Mic className="w-5 h-5" />
                        Generate Voiceover
                    </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};