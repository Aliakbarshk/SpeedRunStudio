import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSupported(true);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.start();
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={isListening}
      className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400 hover:text-[rgb(var(--c-primary))] hover:bg-zinc-700'} ${className}`}
      title="Voice Typing"
    >
      {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};