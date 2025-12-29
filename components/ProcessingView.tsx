import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface ProcessingViewProps {
  progress: number;
  message?: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ progress, message = "Processing Magic..." }) => {
  return (
    <div className="w-full max-w-xl mx-auto glass-panel rounded-[3rem] p-16 shadow-[0_50px_100px_rgba(0,0,0,0.6)] text-center animate-in fade-in zoom-in duration-500 border border-white/5">
      <div className="relative inline-flex items-center justify-center mb-10">
        <div className="absolute inset-0 bg-fuchsia-600 blur-[80px] opacity-20 rounded-full animate-pulse"></div>
        <div className="relative">
          <Loader2 className="w-24 h-24 text-fuchsia-600 animate-spin" strokeWidth={1} />
          <Sparkles className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">{message}</h2>
      <p className="text-zinc-500 mb-12 text-lg font-medium">Hyper-threading at 60 frames per second.</p>
      
      <div className="relative">
        <div className="w-full bg-zinc-900 h-4 rounded-full overflow-hidden shadow-inner border border-white/5">
          <div 
            className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 h-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(217,70,239,0.5)]"
            style={{ width: `${Math.max(8, progress)}%` }} 
          />
        </div>
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">System Encoding</span>
          </div>
          <span className="text-2xl text-white font-black font-mono tracking-tighter">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};