
export enum AppStep {
  INPUT_DETAILS = 'INPUT_DETAILS',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  REVIEW_SCRIPT = 'REVIEW_SCRIPT',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  RECORDING_PHASE = 'RECORDING_PHASE',
  MANUAL_EDITING = 'MANUAL_EDITING',
  PROCESSING_VIDEO = 'PROCESSING_VIDEO',
  COMPLETED = 'COMPLETED',
}

export interface StepItem {
  id: string;
  text: string;
}

export interface SocialOptions {
  includeLike: boolean;
  includeSubscribe: boolean;
  includeBell: boolean;
}

export interface ScriptData {
  title: string;
  steps: StepItem[];
  socialOptions: SocialOptions;
  scriptContent: string;
  fastTrack: boolean;
}

export interface AudioData {
  audioBuffer: AudioBuffer;
  blob: Blob;
  url: string;
}

export interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  effect: 'pop' | 'fade' | 'slide';
}

export interface TimelineClip {
  id: string;
  type: 'video' | 'audio';
  startTime: number; // point in source file
  endTime: number;   // point in source file
  timelineStart: number; // point on timeline
  playbackRate: number;
  filter?: string; // CSS filter string
  overlayText?: string;
}

export interface AppSettings {
  themeId: string;
  turboMode: boolean;
  encodedApiKey?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Fenrir', name: 'John', gender: 'Male', description: 'Deep & Epic' },
  { id: 'Puck', name: 'Steve', gender: 'Male', description: 'Energetic & Fun' },
  { id: 'Kore', name: 'Rosa', gender: 'Female', description: 'Calm & Soothing' },
];

export interface Theme {
  id: string;
  name: string;
  primaryRgb: string;
  secondaryRgb: string;
}

export const THEMES: Theme[] = [
  { id: 'neon', name: 'Neon Night', primaryRgb: '217 70 239', secondaryRgb: '79 70 229' },
  { id: 'ocean', name: 'Deep Ocean', primaryRgb: '6 182 212', secondaryRgb: '59 130 246' },
  { id: 'sunset', name: 'Solar Flare', primaryRgb: '249 115 22', secondaryRgb: '239 68 68' },
  { id: 'forest', name: 'Cyber Jungle', primaryRgb: '16 185 129', secondaryRgb: '13 148 136' },
  { id: 'gold', name: 'Luxury', primaryRgb: '234 179 8', secondaryRgb: '202 138 4' },
];
