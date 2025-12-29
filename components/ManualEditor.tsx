import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Play, Pause, Scissors, ChevronLeft, FastForward, Rewind, MousePointer2, Trash2, Settings2, Sparkles, Wand2, Loader2, ZoomIn, ZoomOut, Upload, FileVideo, FileAudio, CheckCircle2, Video, Volume2 } from 'lucide-react';
import { TimelineClip, Subtitle } from '../types';
import { GoogleGenAI, Type as GType } from "@google/genai";

interface ManualEditorProps {
  videoFile?: File | null;
  audioUrl?: string | null;
  scriptContent?: string | null;
  onFinish: (videoClips: TimelineClip[], audioClips: TimelineClip[], subtitles: Subtitle[]) => void;
  onCancel: () => void;
}

const INITIAL_PIXELS_PER_SECOND = 120;

export const ManualEditor: React.FC<ManualEditorProps> = ({ 
  videoFile: initialVideoFile, 
  audioUrl: initialAudioUrl, 
  scriptContent, 
  onFinish, 
  onCancel 
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(initialVideoFile || null);
  const [externalAudioUrl, setExternalAudioUrl] = useState<string | null>(initialAudioUrl || null);
  
  const videoUrl = useMemo(() => videoFile ? URL.createObjectURL(videoFile) : null, [videoFile]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(INITIAL_PIXELS_PER_SECOND);
  
  const [videoClips, setVideoClips] = useState<TimelineClip[]>([]);
  const [audioClips, setAudioClips] = useState<TimelineClip[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  useEffect(() => {
    if (videoUrl && videoClips.length === 0) {
      const v = document.createElement('video');
      v.src = videoUrl;
      v.onloadedmetadata = () => {
        setVideoClips([{ id: 'v-init', type: 'video', startTime: 0, endTime: v.duration, timelineStart: 0, playbackRate: 1.0, filter: 'none' }]);
      };
    }
  }, [videoUrl]);

  useEffect(() => {
    if (externalAudioUrl && audioClips.length === 0) {
      const a = document.createElement('audio');
      a.src = externalAudioUrl;
      a.onloadedmetadata = () => {
        setAudioClips([{ id: 'a-init', type: 'audio', startTime: 0, endTime: a.duration, timelineStart: 0, playbackRate: 1.0 }]);
      };
    }
  }, [externalAudioUrl]);

  const totalDuration = useMemo(() => {
    const maxV = videoClips.length > 0 ? Math.max(...videoClips.map(c => c.timelineStart + (c.endTime - c.startTime) / c.playbackRate)) : 0;
    const maxA = audioClips.length > 0 ? Math.max(...audioClips.map(c => c.timelineStart + (c.endTime - c.startTime) / c.playbackRate)) : 0;
    const maxS = subtitles.length > 0 ? Math.max(...subtitles.map(s => s.endTime)) : 0;
    return Math.max(maxV, maxA, maxS, 1);
  }, [videoClips, audioClips, subtitles]);

  const togglePlay = () => {
    if (!videoRef.current || !audioRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      audioRef.current.pause();
    } else {
      if (currentTime >= totalDuration - 0.1) setCurrentTime(0);
      syncMedia(currentTime);
      videoRef.current.play();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const syncMedia = useCallback((time: number) => {
    if (!videoRef.current || !audioRef.current) return;
    
    const vClip = videoClips.find(c => {
      const d = (c.endTime - c.startTime) / c.playbackRate;
      return time >= c.timelineStart && time < (c.timelineStart + d);
    });
    if (vClip) {
      const timeIntoClip = time - vClip.timelineStart;
      videoRef.current.currentTime = vClip.startTime + (timeIntoClip * vClip.playbackRate);
      videoRef.current.playbackRate = vClip.playbackRate;
    }

    const aClip = audioClips.find(c => {
      const d = (c.endTime - c.startTime) / c.playbackRate;
      return time >= c.timelineStart && time < (c.timelineStart + d);
    });
    if (aClip) {
      const timeIntoClip = time - aClip.timelineStart;
      audioRef.current.currentTime = aClip.startTime + (timeIntoClip * aClip.playbackRate);
      audioRef.current.playbackRate = aClip.playbackRate;
    }
  }, [videoClips, audioClips]);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const update = (timestamp: number) => {
      if (isPlaying) {
        const delta = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        
        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
        animationId = requestAnimationFrame(update);
      }
    };
    
    if (isPlaying) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, totalDuration]);

  const onTimelineMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPlayhead(true);
    updateTimeFromMouse(e.clientX);
  };

  const updateTimeFromMouse = (clientX: number) => {
    if (!timelineContentRef.current) return;
    const rect = timelineContentRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newTime = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
    setCurrentTime(newTime);
    syncMedia(newTime);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => isDraggingPlayhead && updateTimeFromMouse(e.clientX);
    const handleUp = () => setIsDraggingPlayhead(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingPlayhead, pixelsPerSecond, totalDuration]);

  const handleCut = () => {
    const time = currentTime;
    const vIdx = videoClips.findIndex(c => {
      const dur = (c.endTime - c.startTime) / c.playbackRate;
      return time > c.timelineStart && time < (c.timelineStart + dur);
    });

    if (vIdx !== -1) {
      const clip = videoClips[vIdx];
      const offset = (time - clip.timelineStart) * clip.playbackRate;
      const splitTime = clip.startTime + offset;
      
      const newClips = [...videoClips];
      newClips.splice(vIdx, 1, 
        { ...clip, id: `v-${Math.random()}`, endTime: splitTime },
        { ...clip, id: `v-${Math.random()}`, startTime: splitTime, timelineStart: time }
      );
      setVideoClips(newClips);
    }
  };

  const generateMagicWordCaptions = async () => {
    if (!scriptContent) {
      alert("Please provide a script in the Tutorial mode to use Magic Captions.");
      return;
    }
    setIsGeneratingSubtitles(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const prompt = `Break script into word-by-word JSON for high-energy subtitles. Proportional timing. Total duration: ${totalDuration.toFixed(2)}s. Script: "${scriptContent}"`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GType.ARRAY,
            items: {
              type: GType.OBJECT,
              properties: {
                text: { type: GType.STRING },
                start: { type: GType.NUMBER },
                end: { type: GType.NUMBER }
              },
              required: ["text", "start", "end"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setSubtitles(data.map((item: any, i: number) => ({
        id: `sub-${i}`,
        text: item.text.toUpperCase(),
        startTime: item.start,
        endTime: item.end,
        effect: 'pop'
      })));
    } catch (e) { console.error(e); } finally { setIsGeneratingSubtitles(false); }
  };

  const selectedClip = useMemo(() => {
    if (!selectedClipId) return null;
    return videoClips.find(c => c.id === selectedClipId) || audioClips.find(c => c.id === selectedClipId) || null;
  }, [selectedClipId, videoClips, audioClips]);

  if (!videoFile || !externalAudioUrl) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex flex-col animate-in fade-in duration-700">
        <header className="h-20 flex items-center px-8 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl shrink-0">
          <button onClick={onCancel} className="flex items-center gap-2 text-zinc-500 hover:text-white font-bold transition-all uppercase text-xs tracking-widest">
            <ChevronLeft className="w-5 h-5"/> Exit Editor
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="flex flex-col gap-8 justify-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Project Initialization</span>
                </div>
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">Speed Editor <span className="text-fuchsia-600">Pro</span></h1>
                <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                  Professional multi-track environment. Import your source assets to begin precision timeline editing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: Scissors, label: 'PRECISION CUT' },
                   { icon: Wand2, label: 'AI SYNC' },
                   { icon: ZoomIn, label: 'SUBFRAME EDIT' },
                   { icon: Play, label: '60FPS PREVIEW' }
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <feat.icon className="w-5 h-5 text-zinc-400" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{feat.label}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
               <div className="relative h-64 glass-panel rounded-[2rem] border-2 border-dashed border-white/5 hover:border-fuchsia-600/50 transition-all group overflow-hidden flex flex-col items-center justify-center text-center p-8">
                  <input type="file" accept="video/*" onChange={e => e.target.files?.[0] && setVideoFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-all ${videoFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600 group-hover:bg-fuchsia-600/20 group-hover:text-fuchsia-400'}`}>
                     {videoFile ? <CheckCircle2 className="w-8 h-8"/> : <Video className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight">{videoFile ? videoFile.name : 'Drop Video Asset'}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">{videoFile ? 'READY FOR TIMELINE' : 'MP4, MOV, WEBM'}</p>
                  </div>
               </div>

               <div className="relative h-64 glass-panel rounded-[2rem] border-2 border-dashed border-white/5 hover:border-indigo-600/50 transition-all group overflow-hidden flex flex-col items-center justify-center text-center p-8">
                  <input type="file" accept="audio/*" onChange={e => {
                    if (e.target.files?.[0]) {
                      setExternalAudioUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-all ${externalAudioUrl ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600 group-hover:bg-indigo-600/20 group-hover:text-indigo-400'}`}>
                     {externalAudioUrl ? <CheckCircle2 className="w-8 h-8"/> : <Volume2 className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-tight">{externalAudioUrl ? 'Audio Track Decoded' : 'Drop Audio Asset'}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">{externalAudioUrl ? 'SYNC READY' : 'WAV, MP3, AAC'}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-[#0a0a0a] text-zinc-100 overflow-hidden select-none font-sans animate-in fade-in duration-500">
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#141414]/95 backdrop-blur-2xl z-50">
        <button onClick={onCancel} className="flex items-center gap-2 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">
          <ChevronLeft className="w-5 h-5"/> Back
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-zinc-900 rounded-2xl px-5 py-2 border border-white/5 font-mono text-sm shadow-inner">
             <span className="text-zinc-600 uppercase text-[9px] font-black tracking-widest">Master Clock</span>
             <span className="text-fuchsia-500 font-black text-lg">{currentTime.toFixed(3)}s</span>
          </div>
          
          <button 
            onClick={generateMagicWordCaptions}
            disabled={isGeneratingSubtitles}
            className="px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 rounded-full text-[11px] font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(217,70,239,0.3)] disabled:opacity-50"
          >
            {isGeneratingSubtitles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            MAGIC CAPTIONS
          </button>

          <button onClick={() => onFinish(videoClips, audioClips, subtitles)} className="px-8 py-2.5 bg-white text-black font-black rounded-full text-[11px] hover:bg-zinc-200 transition-all uppercase tracking-tighter">
            Export Master
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-8 gap-8 items-center justify-center bg-[#050505] relative">
          <div className="relative w-full max-w-[90%] aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.7)] group">
             <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" muted />
             <audio ref={audioRef} src={externalAudioUrl} className="hidden" />
             
             {subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime) && (
               <div className="absolute bottom-[20%] inset-x-0 flex justify-center pointer-events-none z-50">
                  <span className="text-7xl font-black italic text-white drop-shadow-[0_4px_12px_rgba(0,0,0,1)] tracking-tighter animate-in zoom-in duration-100 uppercase">
                    {subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime)?.text}
                  </span>
               </div>
             )}

             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-12">
                <div className="flex items-center gap-10 bg-zinc-900/90 backdrop-blur-3xl px-12 py-5 rounded-full border border-white/10 shadow-2xl">
                   <button onClick={() => {setCurrentTime(Math.max(0, currentTime - 0.5)); syncMedia(currentTime - 0.5);}} className="text-zinc-500 hover:text-white transition-all transform active:scale-75"><Rewind className="w-7 h-7"/></button>
                   <button onClick={togglePlay} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                      {isPlaying ? <Pause className="w-8 h-8 fill-current"/> : <Play className="w-8 h-8 fill-current ml-1"/>}
                   </button>
                   <button onClick={() => {setCurrentTime(Math.min(totalDuration, currentTime + 0.5)); syncMedia(currentTime + 0.5);}} className="text-zinc-500 hover:text-white transition-all transform active:scale-75"><FastForward className="w-7 h-7"/></button>
                </div>
             </div>
          </div>
          
          <div className="flex gap-4">
             <button onClick={handleCut} className="flex items-center gap-3 px-8 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-300 hover:bg-white hover:text-black font-black transition-all shadow-lg uppercase text-[10px] tracking-widest">
                <Scissors className="w-4 h-4"/> Split Clip
             </button>
          </div>
        </div>

        <div className="w-80 bg-[#111111] border-l border-white/5 p-8 overflow-y-auto custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-8 flex items-center gap-2"><Settings2 className="w-4 h-4"/> Property Inspector</h3>
          {selectedClip ? (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Playback Velocity</label>
                  <div className="flex items-center gap-4 bg-zinc-900 p-5 rounded-3xl border border-white/5 shadow-inner">
                     <input type="range" min="0.1" max="5" step="0.1" value={selectedClip.playbackRate} onChange={e => {
                       const val = parseFloat(e.target.value);
                       if (selectedClip.type === 'video') setVideoClips(v => v.map(c => c.id === selectedClip.id ? {...c, playbackRate: val} : c));
                       else setAudioClips(a => a.map(c => c.id === selectedClip.id ? {...c, playbackRate: val} : c));
                     }} className="flex-1 accent-fuchsia-600" />
                     <span className="text-xs font-black font-mono text-fuchsia-500">{selectedClip.playbackRate}x</span>
                  </div>
               </div>
               
               <div className="p-6 bg-zinc-900/30 rounded-3xl border border-white/5 text-[10px] space-y-3 font-bold text-zinc-500 uppercase">
                  <div className="flex justify-between"><span>Source Start</span> <span className="text-zinc-300">{selectedClip.startTime.toFixed(2)}s</span></div>
                  <div className="flex justify-between"><span>Timeline Start</span> <span className="text-zinc-300">{selectedClip.timelineStart.toFixed(2)}s</span></div>
                  <div className="flex justify-between"><span>Active Dur</span> <span className="text-zinc-300">{((selectedClip.endTime - selectedClip.startTime) / selectedClip.playbackRate).toFixed(2)}s</span></div>
               </div>

               <button onClick={() => {
                 if (selectedClip.type === 'video') setVideoClips(v => v.filter(c => c.id !== selectedClip.id));
                 else setAudioClips(a => a.filter(c => c.id !== selectedClip.id));
                 setSelectedClipId(null);
               }} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all uppercase border border-red-500/20">Remove Segment</button>
            </div>
          ) : (
            <div className="mt-20 text-center opacity-10">
               <MousePointer2 className="w-16 h-16 mx-auto mb-6" />
               <p className="text-[10px] uppercase font-black tracking-[0.4em]">Select segment to edit</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-72 bg-[#0d0d0d] border-t border-white/10 relative flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-40">
        <div className="h-10 border-b border-white/5 bg-[#141414] flex items-center overflow-hidden shrink-0">
           <div className="w-32 h-full border-r border-white/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">Ruler</span>
           </div>
           <div className="flex-1 h-full relative overflow-hidden" onMouseDown={onTimelineMouseDown} ref={timelineContentRef}>
              <div className="absolute inset-0" style={{ width: `${totalDuration * pixelsPerSecond + 2000}px` }}>
                 {Array.from({length: Math.ceil(totalDuration) + 10}).map((_, i) => (
                   <div key={i} className="absolute top-0 bottom-0 border-l border-white/5 h-full" style={{ left: `${i * pixelsPerSecond}px` }}>
                     <span className="text-[8px] font-black text-zinc-800 p-2 font-mono">{i}s</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
           <div className="w-32 bg-[#111111] border-r border-white/10 pt-4 flex flex-col shrink-0">
              <div className="h-14 flex items-center px-4 text-[9px] font-black text-fuchsia-500 uppercase tracking-widest">Caption Track</div>
              <div className="h-14 flex items-center px-4 text-[9px] font-black text-blue-400 uppercase tracking-widest">Video Stream</div>
              <div className="h-14 flex items-center px-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Narration</div>
           </div>

           <div className="flex-1 overflow-x-auto custom-scrollbar" ref={timelineContainerRef}>
              <div className="relative pt-4 pb-12" style={{ width: `${totalDuration * pixelsPerSecond + 2000}px` }}>
                 <div className="absolute top-0 bottom-0 w-0.5 bg-white z-[100] pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ left: `${currentTime * pixelsPerSecond}px` }}>
                    <div className="absolute top-0 w-4 h-4 bg-white rounded-full -left-[7px] -mt-2 shadow-2xl border-2 border-zinc-950" />
                 </div>

                 <div className="relative h-14 flex items-center">
                    {subtitles.map(s => (
                      <div key={s.id} className="absolute h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center px-2 overflow-hidden shadow-lg" style={{left: `${s.startTime * pixelsPerSecond}px`, width: `${(s.endTime - s.startTime) * pixelsPerSecond}px`}}>
                        <span className="text-[9px] font-black text-fuchsia-400 truncate uppercase">{s.text}</span>
                      </div>
                    ))}
                 </div>

                 <div className="relative h-14 flex items-center">
                    {videoClips.map(clip => (
                      <div key={clip.id} onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }} className={`absolute h-11 rounded-[1.2rem] border-2 flex items-center px-4 cursor-pointer transition-all ${selectedClipId === clip.id ? 'bg-blue-500/30 border-blue-400 z-10 scale-[1.02] shadow-2xl' : 'bg-zinc-800 border-white/5 hover:border-white/10'}`} style={{left: `${clip.timelineStart * pixelsPerSecond}px`, width: `${((clip.endTime - clip.startTime) / clip.playbackRate) * pixelsPerSecond}px`}}>
                         <div className="flex items-center gap-2">
                           <Video className="w-3 h-3 text-blue-400" />
                           <span className="text-[10px] font-black text-white truncate uppercase tracking-tighter">Segment {clip.playbackRate}x</span>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="relative h-14 flex items-center">
                    {audioClips.map(clip => (
                      <div key={clip.id} onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }} className={`absolute h-10 rounded-xl border-2 flex items-center px-4 cursor-pointer transition-all ${selectedClipId === clip.id ? 'bg-zinc-100 border-white z-10 scale-[1.02]' : 'bg-zinc-900 border-white/5'}`} style={{left: `${clip.timelineStart * pixelsPerSecond}px`, width: `${((clip.endTime - clip.startTime) / clip.playbackRate) * pixelsPerSecond}px`}}>
                         <div className="w-full h-[2px] bg-zinc-700 rounded-full" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="absolute right-10 bottom-6 flex items-center gap-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl z-[150]">
           <ZoomOut className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer" onClick={() => setPixelsPerSecond(p => Math.max(20, p - 30))} />
           <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${(pixelsPerSecond / 400) * 100}%` }} />
              <input type="range" min="20" max="400" value={pixelsPerSecond} onChange={e => setPixelsPerSecond(parseInt(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer" />
           </div>
           <ZoomIn className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer" onClick={() => setPixelsPerSecond(p => Math.min(400, p + 30))} />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
};