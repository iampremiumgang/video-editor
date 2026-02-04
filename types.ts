
export enum ClipType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export interface ProjectSettings {
  name: string;
  ratio: AspectRatio;
  isInitialized: boolean;
}

export interface Keyframe {
  id: string;
  time: number; // Relative to clip start
  property: 'opacity' | 'scale' | 'rotation' | 'x' | 'y';
  value: number;
}

export interface Clip {
  id: string;
  type: ClipType;
  name: string;
  content?: string; // For text clips
  startOffset: number; // Where it starts on the timeline (seconds)
  duration: number; // How long it plays (seconds)
  trackId: number;
  src?: string;
  waveform?: number[]; // Array of normalized peaks (0 to 1)
  
  // Visual Properties
  opacity: number;
  scale: number;
  rotation: number;
  x: number; // Horizontal position offset (px)
  y: number; // Vertical position offset (px)
  volume: number;
  speed: number;
  
  // Filters
  brightness: number; // 1.0 is normal
  contrast: number; // 1.0 is normal
  saturation: number; // 1.0 is normal
  blur: number; // px
  grayscale: number; // 0-1
  sepia: number; // 0-1
  hueRotate: number; // degrees

  // Transitions
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  
  // Style properties for Text
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: string;
  textShadow?: string;

  keyframes: Keyframe[];
}

export interface Track {
  id: number;
  type: 'visual' | 'audio';
  isMuted: boolean;
  isLocked: boolean;
}

export interface EditorState {
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoomLevel: number;
  selectedClipId: string | null;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '2k' | '4k';
  fps: 30 | 60;
  format: 'mp4' | 'webm';
}
