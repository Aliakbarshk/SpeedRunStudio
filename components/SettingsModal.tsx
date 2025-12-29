import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  Save,
  Check,
  Zap,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  FileAudio,
} from "lucide-react";
import { THEMES, AppSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState(
    currentSettings.themeId
  );
  const [turboMode, setTurboMode] = useState(currentSettings.turboMode);
  const [encodedApiKey, setEncodedApiKey] = useState(
    currentSettings.encodedApiKey || ""
  );
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedThemeId(currentSettings.themeId);
      setTurboMode(currentSettings.turboMode ?? true);
      setEncodedApiKey(currentSettings.encodedApiKey || "");
    }
  }, [isOpen, currentSettings]);

  const handleSave = () => {
    onSave({
      themeId: selectedThemeId,
      turboMode,
      encodedApiKey: encodedApiKey.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Production Controls
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Manage Keys & Performance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* API Key Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock className="w-4 h-4" /> Secure Production Key
            </h3>
            <div className="p-6 bg-zinc-950 border border-white/5 rounded-[2rem] space-y-5 shadow-inner">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Add Your API Key (Obfuscated)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={encodedApiKey}
                    onChange={(e) => setEncodedApiKey(e.target.value)}
                    placeholder="Enter encoded key..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-4 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-fuchsia-600 transition-all font-mono"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-4 text-[10px] text-zinc-500 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                <ShieldAlert className="w-6 h-6 text-fuchsia-500 shrink-0" />
                <p>
                  Input your multi-layer obfuscated key. This will be decoded in
                  local memory and used for all AI operations.
                </p>
              </div>
            </div>
          </section>

          {/* Performance Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-4 h-4" /> Engine Dynamics
            </h3>
            <label className="flex items-center justify-between p-5 bg-zinc-900/50 border border-white/5 rounded-[1.5rem] cursor-pointer hover:bg-zinc-800 transition-all group">
              <div className="flex flex-col gap-1">
                <span className="font-black text-white text-sm uppercase">
                  Turbo Sync Mode
                </span>
                <span className="text-[10px] text-zinc-500 font-medium tracking-tight">
                  Prioritize speed over high-bitrate export.
                </span>
              </div>
              <div
                className={
                  turboMode
                    ? "w-14 h-7 rounded-full p-1 transition-all bg-fuchsia-600"
                    : "w-14 h-7 rounded-full p-1 transition-all bg-zinc-700"
                }
              >
                <div
                  className={
                    turboMode
                      ? "w-5 h-5 bg-white rounded-full shadow-2xl transition-transform translate-x-7"
                      : "w-5 h-5 bg-white rounded-full shadow-2xl transition-transform translate-x-0"
                  }
                />
              </div>
              <input
                type="checkbox"
                checked={turboMode}
                onChange={(e) => setTurboMode(e.target.checked)}
                className="hidden"
              />
            </label>
          </section>

          {/* Theme Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Palette className="w-4 h-4" /> Visual Identity
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={
                    selectedThemeId === theme.id
                      ? "relative flex items-center justify-between p-4 rounded-xl border transition-all bg-white/5 border-white/20"
                      : "relative flex items-center justify-between p-4 rounded-xl border transition-all bg-transparent border-white/5 hover:bg-white/5"
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: `rgb(${theme.primaryRgb})` }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{
                          backgroundColor: `rgb(${theme.secondaryRgb})`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {theme.name}
                    </span>
                  </div>
                  {selectedThemeId === theme.id && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-8 border-t border-white/5 bg-zinc-950/50">
          <button
            onClick={handleSave}
            className="w-full bg-white text-black hover:bg-zinc-200 font-black py-4 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-xs"
          >
            <Save className="w-5 h-5" />
            Commit Changes
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};
