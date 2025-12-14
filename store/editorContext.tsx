import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Clip, ClipType, EditorState, Track, ProjectSettings, AspectRatio, Keyframe } from '../types';

interface EditorContextType extends EditorState {
  initProject: (name: string, ratio: AspectRatio) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  addClip: (clip: Clip) => void;
  updateClip: (id: string, changes: Partial<Clip>) => void;
  selectClip: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  deleteSelectedClip: () => void;
  splitSelectedClip: () => void;
  uploadFile: (file: File) => void;
  
  // New Features
  undo: () => void;
  redo: () => void;
  addKeyframe: (property: Keyframe['property'], value: number) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  addTrack: () => void;
  toggleTrackMute: (trackId: number) => void;
  toggleTrackLock: (trackId: number) => void;
}

const defaultTracks: Track[] = [
  { id: 0, type: 'visual', isMuted: false, isLocked: false },
  { id: 1, type: 'visual', isMuted: false, isLocked: false },
  { id: 2, type: 'audio', isMuted: false, isLocked: false },
  { id: 3, type: 'audio', isMuted: false, isLocked: false },
];

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // History Stacks
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  // State
  const [project, setProject] = useState<ProjectSettings>({
    name: 'Untitled Project',
    ratio: '16:9',
    isInitialized: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [clips, setClips] = useState<Clip[]>([]);
  const [zoomLevel, setZoomLevel] = useState(40);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const duration = 120; // Extended timeline

  // --- History Management ---
  const saveToHistory = useCallback(() => {
    const currentState = JSON.stringify({ clips, tracks, project });
    setPast(prev => [...prev, currentState]);
    setFuture([]);
  }, [clips, tracks, project]);

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture(prev => [JSON.stringify({ clips, tracks, project }), ...prev]);
    setPast(newPast);

    const state = JSON.parse(previous);
    setClips(state.clips);
    setTracks(state.tracks);
    setProject(state.project);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prev => [...prev, JSON.stringify({ clips, tracks, project })]);
    setFuture(newFuture);

    const state = JSON.parse(next);
    setClips(state.clips);
    setTracks(state.tracks);
    setProject(state.project);
  };

  // --- Core Logic ---

  const initProject = (name: string, ratio: AspectRatio) => {
    setProject({ name, ratio, isInitialized: true });
    // Initial demo clip
    addClip({
      id: 'welcome-text',
      type: ClipType.TEXT,
      name: 'Welcome',
      content: 'Hello World',
      startOffset: 0,
      duration: 3,
      trackId: 1,
      opacity: 1, scale: 1, rotation: 0,
      volume: 1, speed: 1,
      brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0,
      fadeIn: 0, fadeOut: 0,
      keyframes: []
    });
  };

  const requestRef = useRef<number | null>(null);

  const animate = useCallback((time: number) => {
    setCurrentTime((prev) => {
      const newTime = prev + 0.033;
      if (newTime >= duration) {
        setIsPlaying(false);
        return duration;
      }
      return newTime;
    });

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, duration]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const seek = (time: number) => setCurrentTime(Math.max(0, Math.min(time, duration)));

  const addClip = (clip: Clip) => {
    saveToHistory();
    setClips((prev) => [...prev, clip]);
    
    // Auto-expand tracks if needed
    if (clip.trackId >= tracks.length) {
      const newTracks = [...tracks];
      for (let i = tracks.length; i <= clip.trackId; i++) {
        newTracks.push({ 
          id: i, 
          type: clip.type === ClipType.AUDIO ? 'audio' : 'visual',
          isMuted: false, 
          isLocked: false 
        });
      }
      setTracks(newTracks);
    }
  };

  const updateClip = (id: string, changes: Partial<Clip>) => {
    // Only save history on "end" of drag usually, but for simplicity saving here or wrapping in a debounce
    // For sliders, we might want to debounce history saving, but omitting for brevity
    setClips((prev) => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  };

  const selectClip = (id: string | null) => setSelectedClipId(id);

  const deleteSelectedClip = () => {
    if (selectedClipId) {
      saveToHistory();
      setClips((prev) => prev.filter(c => c.id !== selectedClipId));
      setSelectedClipId(null);
    }
  };

  const splitSelectedClip = () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    if (currentTime > clip.startOffset && currentTime < (clip.startOffset + clip.duration)) {
      saveToHistory();
      const firstPartDuration = currentTime - clip.startOffset;
      const secondPartDuration = clip.duration - firstPartDuration;

      updateClip(clip.id, { duration: firstPartDuration });

      const newClip: Clip = {
        ...clip,
        id: Math.random().toString(36).substr(2, 9),
        startOffset: currentTime,
        duration: secondPartDuration,
        name: `${clip.name} (Split)`,
        keyframes: [] // Reset keyframes for split part for simplicity
      };
      
      addClip(newClip);
      selectClip(newClip.id);
    }
  };

  const uploadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? ClipType.VIDEO : file.type.startsWith('audio') ? ClipType.AUDIO : ClipType.IMAGE;
    
    const newClip: Clip = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: file.name,
      startOffset: currentTime,
      duration: 5,
      trackId: type === ClipType.AUDIO ? 3 : 0, // Default tracks
      src: url,
      opacity: 1, scale: 1, rotation: 0,
      volume: 1, speed: 1,
      brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0,
      fadeIn: 0, fadeOut: 0,
      keyframes: []
    };
    addClip(newClip);
  };

  // --- Keyframes ---
  const addKeyframe = (property: Keyframe['property'], value: number) => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    
    saveToHistory();
    const relativeTime = currentTime - clip.startOffset;
    if (relativeTime < 0 || relativeTime > clip.duration) return;

    const newKeyframe: Keyframe = {
      id: Math.random().toString(36).substr(2, 9),
      time: relativeTime,
      property,
      value
    };

    // Remove existing keyframe at same time/property
    const filtered = clip.keyframes.filter(k => !(Math.abs(k.time - relativeTime) < 0.1 && k.property === property));
    
    updateClip(clip.id, {
      keyframes: [...filtered, newKeyframe].sort((a, b) => a.time - b.time)
    });
  };

  // --- Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Calculate duration based on elapsed time
        const durationSec = (Date.now() - recordingStartTimeRef.current) / 1000;

        const newClip: Clip = {
          id: `voiceover-${Date.now()}`,
          type: ClipType.AUDIO,
          name: 'Voice Over',
          startOffset: currentTime, 
          duration: Math.max(0.5, durationSec), 
          trackId: tracks.length, // Add to new track at the bottom
          src: audioUrl,
          opacity: 1, scale: 1, rotation: 0, volume: 1, speed: 1,
          brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0,
          fadeIn: 0, fadeOut: 0, keyframes: []
        };
        addClip(newClip);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      play(); // Auto play timeline while recording
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      pause();
    }
  };

  const addTrack = () => {
    setTracks(prev => [...prev, {
      id: prev.length,
      type: 'visual', // Generic, can hold anything
      isMuted: false,
      isLocked: false
    }]);
  };

  const toggleTrackMute = (trackId: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
  };

  const toggleTrackLock = (trackId: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isLocked: !t.isLocked } : t));
  };

  return (
    <EditorContext.Provider value={{
      project, tracks, clips, currentTime, duration, isPlaying, zoomLevel, selectedClipId,
      initProject, play, pause, seek, addClip, updateClip, selectClip, setZoom: setZoomLevel,
      deleteSelectedClip, splitSelectedClip, uploadFile,
      undo, redo, addKeyframe, startRecording, stopRecording, isRecording, addTrack,
      toggleTrackMute, toggleTrackLock
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within EditorProvider");
  return context;
};