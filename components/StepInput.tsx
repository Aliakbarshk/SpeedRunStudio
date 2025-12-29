import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2, ArrowUp, ArrowDown, ThumbsUp, Bell, UserPlus, ClipboardPaste, X, Zap } from 'lucide-react';
import { SocialOptions, StepItem } from '../types';
import { VoiceInput } from './VoiceInput';

interface StepInputProps {
  initialTitle: string;
  initialSteps: StepItem[];
  initialSocial: SocialOptions;
  onComplete: (title: string, steps: StepItem[], social: SocialOptions, fastTrack: boolean) => void;
  isGenerating: boolean;
}

export const StepInput: React.FC<StepInputProps> = ({ 
  initialTitle, 
  initialSteps, 
  initialSocial, 
  onComplete, 
  isGenerating 
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [steps, setSteps] = useState<StepItem[]>(initialSteps.length > 0 ? initialSteps : [{ id: '1', text: '' }]);
  const [social, setSocial] = useState<SocialOptions>(initialSocial);
  const [fastTrack, setFastTrack] = useState(false);
  
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const addStep = () => {
    setSteps([...steps, { id: Date.now().toString(), text: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = [...steps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
    }
  };

  const updateStep = (index: number, text: string) => {
    const newSteps = [...steps];
    newSteps[index].text = text;
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setSteps(newSteps);
  };

  const toggleSocial = (key: keyof SocialOptions) => {
    setSocial(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasteImport = () => {
    const lines = pasteText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    if (lines.length > 0) {
      const newSteps = lines.map(text => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text
      }));
      setSteps(newSteps);
      setIsPasteMode(false);
      setPasteText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && steps.every(s => s.text.trim())) {
      onComplete(title, steps, social, fastTrack);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-panel rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold bg-clip-text text-transparent mb-3 bg-gradient-to-r from-[rgb(var(--c-primary))] to-[rgb(var(--c-secondary))]">
            Design Your Tutorial
          </h2>
          <p className="text-zinc-400 text-lg">Define the structure and let AI write the perfect script.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              Video Title
              <VoiceInput onTranscript={(t) => setTitle(prev => prev ? `${prev} ${t}` : t)} />
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to Code in Python in 10 Minutes"
              className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-5 py-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--c-primary),0.5)] focus:border-[rgb(var(--c-primary))] transition-all text-lg"
              required
            />
          </div>

          <div className="space-y-3">
             <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Engagement Boosters
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => toggleSocial('includeLike')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 ${social.includeLike ? 'bg-[rgba(var(--c-primary),0.2)] border-[rgba(var(--c-primary),0.5)] text-white' : 'bg-zinc-900/30 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${social.includeLike ? 'fill-current' : ''}`} />
                <span className="font-medium">Ask for Like</span>
              </button>
              
              <button
                type="button"
                onClick={() => toggleSocial('includeSubscribe')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 ${social.includeSubscribe ? 'bg-[rgba(var(--c-secondary),0.2)] border-[rgba(var(--c-secondary),0.5)] text-white' : 'bg-zinc-900/30 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
              >
                <UserPlus className={`w-5 h-5 ${social.includeSubscribe ? 'fill-current' : ''}`} />
                <span className="font-medium">Subscribe Call</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSocial('includeBell')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 ${social.includeBell ? 'bg-yellow-500/20 border-yellow-500/50 text-white' : 'bg-zinc-900/30 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
              >
                <Bell className={`w-5 h-5 ${social.includeBell ? 'fill-current' : ''}`} />
                <span className="font-medium">Notification Bell</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Tutorial Steps
              </label>
              <button 
                type="button" 
                onClick={() => setIsPasteMode(!isPasteMode)}
                className="text-xs font-black text-[rgb(var(--c-primary))] hover:text-[rgb(var(--c-secondary))] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[rgba(var(--c-primary),0.1)] uppercase tracking-tight"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                {isPasteMode ? 'Close' : 'Add all steps together'}
              </button>
            </div>
            
            {isPasteMode && (
              <div className="bg-zinc-900/80 p-4 rounded-xl border border-[rgba(var(--c-primary),0.3)] animate-in fade-in slide-in-from-top-2 relative">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-xs text-zinc-400">Paste steps below (one per line). This replaces current steps.</p>
                   <div className="flex items-center gap-2">
                      <VoiceInput onTranscript={(t) => setPasteText(prev => prev ? `${prev}\n${t}` : t)} />
                      <button onClick={() => setIsPasteMode(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4"/></button>
                   </div>
                </div>
                <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`1. Open your code editor\n2. Create a new file...`}
                    className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-[rgb(var(--c-primary))] font-mono leading-relaxed resize-none"
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => setIsPasteMode(false)} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">Cancel</button>
                    <button type="button" onClick={handlePasteImport} disabled={!pasteText.trim()} className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-[rgb(var(--c-primary))] to-[rgb(var(--c-secondary))] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[rgba(var(--c-primary),0.2)]">Import & Replace</button>
                </div>
              </div>
            )}

            {!isPasteMode && (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="group flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-xl flex items-center px-4 transition-colors focus-within:border-[rgb(var(--c-secondary))] focus-within:ring-1 focus-within:ring-[rgba(var(--c-secondary),0.5)]">
                      <span className="font-mono text-zinc-500 text-sm mr-2">{index + 1}.</span>
                      <input
                        type="text"
                        value={step.text}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder={`Step ${index + 1}...`}
                        className="flex-1 bg-transparent border-none py-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                        required
                      />
                      <VoiceInput onTranscript={(t) => updateStep(index, step.text ? `${step.text} ${t}` : t)} className="ml-2" />
                    </div>

                    <button type="button" onClick={() => removeStep(index)} disabled={steps.length === 1} className="p-3 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-30"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            )}

            {!isPasteMode && (
              <button type="button" onClick={addStep} className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-[rgb(var(--c-primary))] hover:border-[rgba(var(--c-primary),0.5)] hover:bg-[rgba(var(--c-primary),0.05)] transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Another Step
              </button>
            )}
          </div>

          <div className="pt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${fastTrack ? 'bg-[rgb(var(--c-secondary))] border-[rgb(var(--c-secondary))]' : 'border-zinc-700 bg-zinc-900'}`}>
                 {fastTrack && <Zap className="w-3 h-3 text-white" />}
               </div>
               <input type="checkbox" checked={fastTrack} onChange={(e) => setFastTrack(e.target.checked)} className="hidden" />
               <span className={`text-sm font-medium transition-colors ${fastTrack ? 'text-[rgb(var(--c-secondary))]' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                 Fast Track (Auto-Generate Audio)
               </span>
            </label>

            <button type="submit" disabled={isGenerating || !title || steps.some(s => !s.text.trim())} className="flex-1 bg-gradient-to-r from-[rgb(var(--c-primary))] to-[rgb(var(--c-secondary))] hover:opacity-90 disabled:opacity-50 disabled:grayscale text-white font-bold py-5 rounded-xl shadow-lg shadow-[rgba(var(--c-primary),0.2)] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Crafting Script...
                </span>
              ) : (
                <>Generate Script <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};