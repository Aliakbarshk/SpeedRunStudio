import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Upload, Zap, Clock, RotateCcw, Download, Scissors, FileVideo } from 'lucide-react';

interface RecordingPhaseProps {
  audioUrl: string;
  onVideoSelected: (file: File, isManual: boolean) => void;
}

export const RecordingPhase: React.FC<RecordingPhaseProps> = ({ audioUrl, onVideoSelected }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(2.0);
  const [isDragging, setIsDragging] = useState<null | 'auto' | 'manual'>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isManual: boolean) => {
    if (e.target.files && e.target.files[0]) {
      onVideoSelected(e.target.files[0], isManual);
    }
  };

  const handleDrop = (e: React.DragEvent, isManual: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onVideoSelected(file, isManual);
      } else {
        alert("Please drop a valid video file.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'auto' | 'manual') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Guide Card */}
        <div className="glass-panel rounded-2xl p-8 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-[rgb(var(--c-primary))] opacity-10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="mb-8 z-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                  <Zap className="w-6 h-6" />
                </div>
                Record Fast
              </h2>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Listen to the audio at <strong>2x speed</strong>. Record your actions to match this pace for a perfect 0.5x slowdown later.
              </p>
            </div>
            <a 
              href={audioUrl} 
              download="tutorial-guide.wav"
              className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700 group shadow-lg"
              title="Download Audio"
            >
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>

          <div className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 backdrop-blur-sm z-10 flex-1 flex flex-col justify-center">
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="w-full bg-zinc-800 h-2 rounded-full mb-8 overflow-hidden">
              <div 
                  className="bg-gradient-to-r from-[rgb(var(--c-primary))] to-[rgb(var(--c-secondary))] h-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(var(--c-primary),0.5)]" 
                  style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-4">
              <button
                  onClick={togglePlay}
                  className={`flex-1 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl ${isPlaying ? 'bg-zinc-700 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
              >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  {isPlaying ? "Pause Guide" : "Play Guide"}
              </button>
              <button 
                  onClick={() => { if(audioRef.current) audioRef.current.currentTime = 0; }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-4 rounded-xl transition-colors border border-zinc-700"
              ><RotateCcw className="w-5 h-5"/></button>
            </div>
          </div>
        </div>

        {/* Sync Choice Area */}
        <div className="flex flex-col gap-6">
            <div 
              onDragOver={(e) => handleDragOver(e, 'auto')}
              onDragLeave={() => setIsDragging(null)}
              onDrop={(e) => handleDrop(e, false)}
              className={`glass-panel rounded-2xl p-6 flex flex-col shadow-xl relative overflow-hidden group border-2 transition-all cursor-default ${isDragging === 'auto' ? 'border-[rgb(var(--c-primary))] bg-[rgba(var(--c-primary),0.15)] scale-[1.02]' : 'border-transparent hover:border-white/10'}`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <Clock className="w-5 h-5 text-[rgb(var(--c-primary))]" />
                       Automatic Sync
                    </h3>
                </div>
                <label className="cursor-pointer bg-white/5 border border-white/10 rounded-xl py-12 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all border-dashed">
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, false)} />
                    {isDragging === 'auto' ? <FileVideo className="w-12 h-12 text-[rgb(var(--c-primary))] animate-bounce" /> : <Upload className="w-8 h-8 text-zinc-500" />}
                    <span className="text-sm font-bold text-white mt-2">Drag & Drop or Click</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Auto 0.5x Slowdown (60 FPS)</span>
                </label>
            </div>

            <div 
              onDragOver={(e) => handleDragOver(e, 'manual')}
              onDragLeave={() => setIsDragging(null)}
              onDrop={(e) => handleDrop(e, true)}
              className={`glass-panel rounded-2xl p-6 flex flex-col shadow-xl relative overflow-hidden group border-2 transition-all cursor-default ${isDragging === 'manual' ? 'border-[rgb(var(--c-secondary))] bg-[rgba(var(--c-secondary),0.15)] scale-[1.02]' : 'border-transparent hover:border-white/10'}`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <Scissors className="w-5 h-5 text-[rgb(var(--c-secondary))]" />
                       Manual Timeline Editor
                    </h3>
                </div>
                <label className="cursor-pointer bg-[rgb(var(--c-secondary))]/5 border border-[rgb(var(--c-secondary))]/20 rounded-xl py-12 flex flex-col items-center justify-center gap-2 hover:bg-[rgb(var(--c-secondary))]/10 transition-all border-dashed">
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, true)} />
                    {isDragging === 'manual' ? <FileVideo className="w-12 h-12 text-[rgb(var(--c-secondary))] animate-bounce" /> : <Upload className="w-8 h-8 text-[rgb(var(--c-secondary))]" />}
                    <span className="text-sm font-bold text-[rgb(var(--c-secondary))] mt-2">Open Professional Editor</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Multi-Clip Speed & Offset Control</span>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};