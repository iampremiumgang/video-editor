
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
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const [project, setProject] = useState<ProjectSettings>({
    name: 'Lumina Pro Project',
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
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const duration = 3600;

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

  const initProject = (name: string, ratio: AspectRatio) => {
    setProject({ name, ratio, isInitialized: true });
  };

  const animate = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    setCurrentTime((prev) => {
      const newTime = prev + deltaTime;
      if (newTime >= duration) {
        setIsPlaying(false);
        return duration;
      }
      return newTime;
    });
    if (isPlaying) requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, duration]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
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
  const seek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
    lastTimeRef.current = 0; 
  };

  const extractWaveform = async (file: File): Promise<number[]> => {
    let audioContext: AudioContext | null = null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200;
      const blockSize = Math.floor(channelData.length / samples);
      const filteredData = [];
      for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum = sum + Math.abs(channelData[blockStart + j]);
        }
        filteredData.push(sum / Math.max(1, blockSize));
      }
      const maxVal = Math.max(...filteredData);
      const multiplier = maxVal > 0 ? Math.pow(maxVal, -1) : 1;
      const result = filteredData.map(n => n * multiplier);
      await audioContext.close();
      return result;
    } catch (e) {
      if (audioContext) await audioContext.close();
      return Array(200).fill(0.1);
    }
  };

  const uploadFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? ClipType.VIDEO : file.type.startsWith('audio') ? ClipType.AUDIO : ClipType.IMAGE;
    
    let waveform: number[] | undefined;
    if (type === ClipType.AUDIO || type === ClipType.VIDEO) {
      waveform = await extractWaveform(file);
    }

    const tempMedia = type === ClipType.VIDEO ? document.createElement('video') : (type === ClipType.AUDIO ? document.createElement('audio') : null);
    
    const finalizeUpload = (mediaDuration: number) => {
        const newClip: Clip = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          name: file.name,
          startOffset: currentTime,
          duration: mediaDuration || 5,
          trackId: type === ClipType.AUDIO ? 2 : 0,
          src: url,
          waveform,
          opacity: 1, scale: 1, rotation: 0,
          x: 0, y: 0,
          volume: 1, speed: 1,
          brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0,
          hueRotate: 0,
          fadeIn: 0, fadeOut: 0,
          keyframes: []
        };
        addClip(newClip);
    };

    if (tempMedia) {
        tempMedia.src = url;
        tempMedia.onloadedmetadata = () => finalizeUpload(tempMedia.duration);
        tempMedia.onerror = () => finalizeUpload(5);
    } else {
        finalizeUpload(5);
    }
  };

  const addClip = (clip: Clip) => {
    saveToHistory();
    setClips((prev) => [...prev, clip]);
    if (clip.trackId >= tracks.length) {
      setTracks(prev => {
         const nt = [...prev];
         for(let i=prev.length; i<=clip.trackId; i++) nt.push({id: i, type: 'visual', isMuted: false, isLocked: false});
         return nt;
      });
    }
  };

  const updateClip = (id: string, changes: Partial<Clip>) => {
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
    if (!clip || currentTime <= clip.startOffset || currentTime >= (clip.startOffset + clip.duration)) return;
    
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
      keyframes: []
    };
    addClip(newClip);
    selectClip(newClip.id);
  };

  const addKeyframe = (property: Keyframe['property'], value: number) => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    saveToHistory();
    const relativeTime = currentTime - clip.startOffset;
    const newKeyframe: Keyframe = { id: Math.random().toString(36).substr(2, 9), time: relativeTime, property, value };
    updateClip(clip.id, {
      keyframes: [...clip.keyframes.filter(k => !(k.time === relativeTime && k.property === property)), newKeyframe].sort((a, b) => a.time - b.time)
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const durationSec = (Date.now() - recordingStartTimeRef.current) / 1000;
        addClip({
          id: `rec-${Date.now()}`, type: ClipType.AUDIO, name: 'Recording',
          startOffset: currentTime, duration: Math.max(0.5, durationSec), trackId: 3,
          src: audioUrl, opacity: 1, scale: 1, rotation: 0, x: 0, y: 0, volume: 1, speed: 1,
          brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0,
          hueRotate: 0,
          fadeIn: 0, fadeOut: 0, keyframes: []
        });
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      play();
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      pause();
    }
  };

  const addTrack = () => {
    setTracks(prev => [...prev, { id: prev.length, type: 'visual', isMuted: false, isLocked: false }]);
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
