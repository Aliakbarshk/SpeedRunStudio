import React, { useState, useEffect } from "react";
import {
  AppStep,
  ScriptData,
  AudioData,
  StepItem,
  SocialOptions,
  AppSettings,
  THEMES,
  VOICE_OPTIONS,
  TimelineClip,
  Subtitle,
} from "./types";
import { generateTutorialScript, generateVoiceover } from "./services/gemini";
import { audioBufferToWav } from "./utils/audio";
import {
  processVideoAndAudio,
  processVideoWithTimeline,
} from "./utils/videoProcessor";
import { StepInput } from "./components/StepInput";
import { ScriptReview } from "./components/ScriptReview";
import { RecordingPhase } from "./components/RecordingPhase";
import { ManualEditor } from "./components/ManualEditor";
import { ProcessingView } from "./components/ProcessingView";
import { SettingsModal } from "./components/SettingsModal";
import { RunningLogo } from "./components/RunningLogo";
import {
  Download,
  Sparkles,
  RefreshCw,
  Settings,
  Edit3,
  ArrowRight,
  Zap,
  ShieldCheck,
} from "lucide-react";

const SETTINGS_STORAGE_KEY = "speedrun_studio_settings_v2";

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT_DETAILS);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [tempVideoFile, setTempVideoFile] = useState<File | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(
    null
  );
  const [processingProgress, setProcessingProgress] = useState(0);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    themeId: "neon",
    turboMode: true,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Error loading settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleManualEditorEntry = () => {
    setStep(AppStep.MANUAL_EDITING);
  };

  const handleStepInputComplete = async (
    title: string,
    steps: StepItem[],
    social: SocialOptions,
    fastTrack: boolean
  ) => {
    setStep(AppStep.GENERATING_SCRIPT);
    try {
      const generatedScript = await generateTutorialScript(
        title,
        steps,
        social,
        settings.turboMode
      );
      const newScriptData: ScriptData = {
        title,
        steps,
        socialOptions: social,
        scriptContent: generatedScript,
        fastTrack,
      };
      setScriptData(newScriptData);
      if (fastTrack) {
        handleScriptConfirm(generatedScript, VOICE_OPTIONS[0].id);
      } else {
        setStep(AppStep.REVIEW_SCRIPT);
      }
    } catch (error) {
      alert((error as Error).message);
      setStep(AppStep.INPUT_DETAILS);
    }
  };

  const handleScriptConfirm = async (
    finalScript: string,
    voiceName: string
  ) => {
    if (scriptData)
      setScriptData((prev) =>
        prev ? { ...prev, scriptContent: finalScript } : null
      );
    setStep(AppStep.GENERATING_AUDIO);
    try {
      const audioBuffer = await generateVoiceover(finalScript, voiceName);
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioData({ audioBuffer, blob: wavBlob, url });
      setStep(AppStep.RECORDING_PHASE);
    } catch (error) {
      alert((error as Error).message);
      setStep(AppStep.REVIEW_SCRIPT);
    }
  };

  const handleVideoSelection = async (file: File, isManual: boolean) => {
    if (!audioData) return;
    setTempVideoFile(file);
    if (isManual) {
      setStep(AppStep.MANUAL_EDITING);
    } else {
      setStep(AppStep.PROCESSING_VIDEO);
      try {
        const resultBlob = await processVideoAndAudio(
          file,
          audioData.blob,
          setProcessingProgress,
          settings.turboMode
        );
        setProcessedVideoUrl(URL.createObjectURL(resultBlob));
        setStep(AppStep.COMPLETED);
      } catch (error) {
        alert("Processing failed: " + (error as Error).message);
        setStep(AppStep.RECORDING_PHASE);
      }
    }
  };

  const handleManualFinish = async (
    vClips: TimelineClip[],
    aClips: TimelineClip[],
    subs: Subtitle[]
  ) => {
    if (!tempVideoFile || !audioData) return;
    setStep(AppStep.PROCESSING_VIDEO);
    try {
      const resultBlob = await processVideoWithTimeline(
        tempVideoFile,
        audioData.blob,
        vClips,
        aClips,
        subs,
        setProcessingProgress,
        settings.turboMode
      );
      setProcessedVideoUrl(URL.createObjectURL(resultBlob));
      setStep(AppStep.COMPLETED);
    } catch (error) {
      alert("Manual processing failed: " + (error as Error).message);
      setStep(AppStep.MANUAL_EDITING);
    }
  };

  const handleRestart = () => {
    if (
      confirm("Start new project? Any unsaved master renders will be lost.")
    ) {
      setStep(AppStep.INPUT_DETAILS);
      setAudioData(null);
      setProcessedVideoUrl(null);
      setProcessingProgress(0);
      setTempVideoFile(null);
    }
  };

  const currentTheme =
    THEMES.find((t) => t.id === settings.themeId) || THEMES[0];
  const sanitizedTitle = (scriptData?.title || "tutorial")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-700 bg-zinc-950"
      style={
        {
          "--c-primary": currentTheme.primaryRgb,
          "--c-secondary": currentTheme.secondaryRgb,
        } as React.CSSProperties
      }
    >
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[rgb(var(--c-primary))] opacity-[0.08] blur-[150px] rounded-full -z-10 animate-pulse" />
      <div
        className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[rgb(var(--c-secondary))] opacity-[0.08] blur-[150px] rounded-full -z-10 animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <header className="relative z-[60] border-b border-white/5 bg-zinc-950/80 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="p-2.5 bg-gradient-to-tr from-[rgb(var(--c-primary))] to-[rgb(var(--c-secondary))] rounded-2xl shadow-xl hover:rotate-6 transition-transform cursor-pointer"
              onClick={() => setStep(AppStep.INPUT_DETAILS)}
            >
              <RunningLogo className="w-8 h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
                SpeedRun{" "}
                <span className="text-[rgb(var(--c-primary))]">Studio</span>
              </h1>
              <p className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-1">
                v2.5 Production Master
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step === AppStep.INPUT_DETAILS && (
              <button
                onClick={handleManualEditorEntry}
                className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/5 rounded-full text-[11px] font-black text-zinc-300 hover:bg-white hover:text-black transition-all shadow-xl"
              >
                <Zap className="w-3.5 h-3.5 text-fuchsia-500 group-hover:animate-bounce" />
                SPEED EDITOR BETA
              </button>
            )}

            <div className="h-8 w-[1px] bg-white/5 mx-2" />

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>

            {step !== AppStep.INPUT_DETAILS &&
              step !== AppStep.MANUAL_EDITING && (
                <button
                  onClick={handleRestart}
                  className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 relative z-10 flex flex-col items-center justify-center">
        {step === AppStep.INPUT_DETAILS && (
          <div className="w-full max-w-4xl flex flex-col gap-12 py-12">
            <StepInput
              initialTitle={scriptData?.title || ""}
              initialSteps={scriptData?.steps || []}
              initialSocial={
                scriptData?.socialOptions || {
                  includeLike: false,
                  includeSubscribe: false,
                  includeBell: false,
                }
              }
              onComplete={handleStepInputComplete}
              isGenerating={false}
            />

            <div className="flex flex-col items-center gap-6">
              <div className="h-[1px] w-full max-w-xs bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <button
                onClick={handleManualEditorEntry}
                className="group p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 hover:border-fuchsia-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full max-w-xl"
              >
                <div className="w-20 h-20 bg-gradient-to-tr from-fuchsia-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform shrink-0">
                  <Zap className="w-10 h-10 text-white fill-current" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                    Enter Manual Editor
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium mt-1">
                    Multi-track precision timeline with Word-Sync AI.
                  </p>
                </div>
                <ArrowRight className="w-8 h-8 text-zinc-800 group-hover:text-white group-hover:translate-x-2 transition-all" />
              </button>
            </div>
          </div>
        )}

        {step === AppStep.GENERATING_SCRIPT && (
          <ProcessingView
            progress={25}
            message="Crafting professional script..."
          />
        )}
        {step === AppStep.REVIEW_SCRIPT && scriptData && (
          <ScriptReview
            initialScript={scriptData.scriptContent}
            onConfirm={handleScriptConfirm}
            isProcessing={false}
          />
        )}
        {step === AppStep.GENERATING_AUDIO && (
          <ProcessingView progress={50} message="Synthesizing narration..." />
        )}
        {step === AppStep.RECORDING_PHASE && audioData && (
          <RecordingPhase
            audioUrl={audioData.url}
            onVideoSelected={handleVideoSelection}
          />
        )}

        {step === AppStep.MANUAL_EDITING && (
          <ManualEditor
            videoFile={tempVideoFile}
            audioUrl={audioData?.url}
            scriptContent={scriptData?.scriptContent}
            onFinish={handleManualFinish}
            onCancel={() => setStep(AppStep.INPUT_DETAILS)}
          />
        )}

        {step === AppStep.PROCESSING_VIDEO && (
          <ProcessingView
            progress={processingProgress}
            message="Rendering 60FPS Final Master..."
          />
        )}

        {step === AppStep.COMPLETED && processedVideoUrl && (
          <div className="w-full max-w-5xl mx-auto glass-panel rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in duration-700 border border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Master Encode Verified
                  </span>
                </div>
                <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase">
                  {scriptData?.title || "Project Export"}
                </h2>
                <p className="text-zinc-500 mt-3 font-medium text-lg tracking-tight">
                  Your cinematic tutorial is ready for social distribution.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setStep(AppStep.MANUAL_EDITING)}
                  className="px-8 py-4 rounded-2xl border border-white/10 text-zinc-300 hover:bg-white hover:text-black transition-all font-black flex items-center gap-2 shadow-xl text-xs"
                >
                  <Edit3 className="w-4 h-4" /> RE-EDIT
                </button>
                <a
                  href={processedVideoUrl}
                  download={`${sanitizedTitle}.webm`}
                  className="px-10 py-5 rounded-2xl bg-white text-black hover:bg-fuchsia-600 hover:text-white transition-all font-black flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 text-xs"
                >
                  <Download className="w-6 h-6" /> DOWNLOAD MP4
                </a>
              </div>
            </div>
            <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
              <video
                src={processedVideoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center border-t border-white/5 bg-zinc-950/50 backdrop-blur-md relative z-10">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
          SPEEDRUN STUDIO / v2.5 / MASTERED BY ALIAKBAR
        </p>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
