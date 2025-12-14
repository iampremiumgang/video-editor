import React, { useRef, useEffect, useState } from 'react';
import { useEditor } from '../store/editorContext';
import { Clip, ClipType } from '../types';
import { Video, Mic, Type, Image as ImageIcon, Scissors, Trash2, Key, MousePointer2, Plus, Volume2, VolumeX, Lock, Unlock, Music, Film, Eye, EyeOff } from 'lucide-react';

const TRACK_HEIGHT = 80;
const HEADER_HEIGHT = 30;

export const Timeline: React.FC = () => {
  const { 
    tracks, 
    clips, 
    currentTime, 
    duration, 
    zoomLevel, 
    seek, 
    selectedClipId, 
    selectClip,
    updateClip,
    splitSelectedClip,
    deleteSelectedClip,
    addKeyframe,
    startRecording,
    stopRecording,
    isRecording,
    addTrack,
    toggleTrackMute,
    toggleTrackLock
  } = useEditor();

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const dragStartX = useRef<number>(0);
  const clipStartOffset = useRef<number>(0);
  const clipStartTrack = useRef<number>(0);
  const dragStartY = useRef<number>(0);

  // Global Drag Handlers
  useEffect(() => {
    const handleUp = () => setDraggingClipId(null);

    const handleMove = (clientX: number, clientY: number) => {
      if (draggingClipId) {
        // Horizontal Move (Time)
        const deltaX = clientX - dragStartX.current;
        const deltaTime = deltaX / zoomLevel;
        let newStart = clipStartOffset.current + deltaTime;
        newStart = Math.max(0, newStart);
        
        // Vertical Move (Track)
        const deltaY = clientY - dragStartY.current;
        const trackChange = Math.round(deltaY / TRACK_HEIGHT);
        let newTrackId = clipStartTrack.current + trackChange;
        newTrackId = Math.max(0, newTrackId); 

        // Check if target track is locked
        const targetTrack = tracks.find(t => t.id === newTrackId);
        
        if (targetTrack && targetTrack.isLocked) {
           newTrackId = clipStartTrack.current;
        }

        updateClip(draggingClipId, { 
            startOffset: newStart, 
            trackId: newTrackId
        });
      }
    };

    const handleWindowMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleWindowTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

    if (draggingClipId) {
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    }

    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('touchmove', handleWindowTouchMove);
    };
  }, [draggingClipId, zoomLevel, updateClip, tracks]);

  const handleTimelineClick = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const newTime = Math.max(0, x / zoomLevel);
    seek(newTime);
    selectClip(null); 
  };

  const handleClipStart = (clientX: number, clientY: number, clip: Clip) => {
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked) return;

    selectClip(clip.id);
    setDraggingClipId(clip.id);
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    clipStartOffset.current = clip.startOffset;
    clipStartTrack.current = clip.trackId;
  };

  const getClipIcon = (type: ClipType) => {
    switch (type) {
      case ClipType.VIDEO: return <Video size={14} />;
      case ClipType.AUDIO: return <Mic size={14} />;
      case ClipType.TEXT: return <Type size={14} />;
      case ClipType.IMAGE: return <ImageIcon size={14} />;
    }
  };

  const getClipColor = (type: ClipType, isSelected: boolean) => {
    const baseClass = "transition-all shadow-sm";
    if (isSelected) return `${baseClass} bg-yellow-500 border-2 border-white text-black z-20 shadow-xl ring-2 ring-yellow-500/50`;
    switch (type) {
      case ClipType.VIDEO: return `${baseClass} bg-blue-900/80 border border-blue-600 text-blue-100 hover:bg-blue-800`;
      case ClipType.AUDIO: return `${baseClass} bg-teal-900/80 border border-teal-600 text-teal-100 hover:bg-teal-800`;
      case ClipType.TEXT: return `${baseClass} bg-purple-900/80 border border-purple-600 text-purple-100 hover:bg-purple-800`;
      case ClipType.IMAGE: return `${baseClass} bg-orange-900/80 border border-orange-600 text-orange-100 hover:bg-orange-800`;
    }
  };

  // Determine max track index to render + 1 empty
  const maxClipTrackId = Math.max(-1, ...clips.map(c => c.trackId));
  const maxTrackId = Math.max(tracks.length - 1, maxClipTrackId);
  const renderTracks = Array.from({ length: maxTrackId + 2 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] select-none border-t border-gray-800">
      {/* Toolbar - Scrollable on mobile */}
      <div className="h-10 border-b border-gray-700 flex items-center px-4 gap-4 bg-[#252525] overflow-x-auto hide-scrollbar whitespace-nowrap min-h-[40px]">
        <button className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded" onClick={() => selectClip(null)}>
           <MousePointer2 size={14} /> <span className="hidden md:inline">Select</span>
        </button>
        <div className="w-px h-4 bg-gray-600 mx-1"></div>
        <button 
          className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded disabled:opacity-50"
          onClick={(e) => { e.stopPropagation(); splitSelectedClip(); }}
          disabled={!selectedClipId}
        >
           <Scissors size={14} /> Split
        </button>
        <button 
          className="flex items-center gap-2 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded disabled:opacity-50"
          onClick={(e) => { e.stopPropagation(); deleteSelectedClip(); }}
          disabled={!selectedClipId}
        >
           <Trash2 size={14} /> Delete
        </button>
         <button 
          className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded disabled:opacity-50"
          onClick={(e) => { e.stopPropagation(); addKeyframe('opacity', 1); }}
          disabled={!selectedClipId}
        >
           <Key size={14} /> Keyframe
        </button>

        <div className="w-px h-4 bg-gray-600 mx-1"></div>

        <button 
           className={`flex items-center gap-2 px-3 py-1 text-xs rounded transition-colors ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
           onClick={(e) => { e.stopPropagation(); isRecording ? stopRecording() : startRecording(); }}
        >
           <Mic size={14} /> {isRecording ? 'Stop' : 'Rec'}
        </button>

        <button 
            className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded ml-auto"
            onClick={addTrack}
        >
            <Plus size={14}/> Add Track
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers */}
        <div className="w-20 md:w-24 flex-shrink-0 bg-[#252525] border-r border-gray-700 z-20 shadow-lg flex flex-col overflow-hidden">
          <div style={{ height: HEADER_HEIGHT }} className="border-b border-gray-700 bg-[#1f1f1f] flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
             Tracks
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
             {renderTracks.map((i) => {
                const track = tracks.find(t => t.id === i) || { id: i, type: 'visual', isMuted: false, isLocked: false };
                const isAudio = track.type === 'audio';
                
                return (
                    <div 
                    key={i} 
                    style={{ height: TRACK_HEIGHT }} 
                    className={`border-b border-gray-700 flex flex-col items-center justify-center gap-1.5 transition-colors relative group ${isAudio ? 'bg-[#1c2220]' : 'bg-[#1c1c24]'}`}
                    >
                        {/* Track Label */}
                        <div className={`text-[10px] font-bold flex items-center gap-1 ${isAudio ? 'text-teal-500' : 'text-blue-500'}`}>
                           {isAudio ? <Music size={10} /> : <Film size={10} />}
                           <span>{isAudio ? 'A' : 'V'}{i + 1}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 mt-1">
                            <button 
                                onClick={() => toggleTrackMute(i)} 
                                className={`p-1.5 rounded-full transition-colors ${track.isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-gray-700 text-gray-400'}`}
                                title={track.isMuted ? "Unmute" : "Mute"}
                            >
                                {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            </button>
                            <button 
                                onClick={() => toggleTrackLock(i)} 
                                className={`p-1.5 rounded-full transition-colors ${track.isLocked ? 'bg-yellow-500/20 text-yellow-500' : 'hover:bg-gray-700 text-gray-400'}`}
                                title={track.isLocked ? "Unlock" : "Lock"}
                            >
                                {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>
                        </div>

                        {/* Active Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${selectedClipId && clips.find(c=>c.id === selectedClipId)?.trackId === i ? (isAudio ? 'bg-teal-500' : 'bg-blue-500') : 'bg-transparent'}`} />
                    </div>
                );
             })}
          </div>
        </div>

        {/* Timeline Content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto relative bg-[#121212]"
          onMouseDown={(e) => handleTimelineClick(e.clientX)}
          onTouchStart={(e) => {
             if ((e.target as HTMLElement).closest('.clip-node')) return;
             handleTimelineClick(e.touches[0].clientX);
          }}
        >
          <div style={{ width: Math.max(duration * zoomLevel + 200, 1000), minHeight: '100%' }} className="relative">
            
            {/* Time Ruler */}
            <div 
              className="sticky top-0 left-0 w-full bg-[#252525] border-b border-gray-700 z-10 flex items-end pointer-events-none"
              style={{ height: HEADER_HEIGHT }}
            >
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bottom-0 border-l border-gray-600 text-[10px] text-gray-500 pl-1 select-none"
                  style={{ left: i * zoomLevel, height: '40%' }}
                >
                  {i}s
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              style={{ left: currentTime * zoomLevel, height: (renderTracks.length * TRACK_HEIGHT) + HEADER_HEIGHT }}
            >
               <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 text-red-500 filter drop-shadow-md">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                     <path d="M0 0 H12 V6 L6 12 L0 6 Z" />
                  </svg>
               </div>
            </div>

            {/* Tracks */}
            <div className="relative pt-0">
              {renderTracks.map((i) => {
                  const track = tracks.find(t => t.id === i);
                  const isLocked = track?.isLocked;
                  const isMuted = track?.isMuted;
                  const isAudio = track?.type === 'audio';

                  return (
                    <div 
                    key={i}
                    className={`relative border-b border-gray-800 w-full transition-colors 
                        ${isLocked ? 'bg-[#1a1a1a]' : 'bg-[#151515] hover:bg-[#181818]'}`}
                    style={{ 
                        height: TRACK_HEIGHT,
                        backgroundImage: isLocked 
                            ? 'repeating-linear-gradient(45deg, #151515, #151515 10px, #1c1c1c 10px, #1c1c1c 20px)' 
                            : 'none'
                    }}
                    >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" 
                        style={{ backgroundImage: 'linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: `${zoomLevel}px 100%` }} 
                    />

                    {/* Muted Overlay */}
                    {isMuted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10 backdrop-grayscale">
                            <VolumeX size={24} className="text-gray-500/50" />
                        </div>
                    )}

                    {clips.filter(c => c.trackId === i).map(clip => (
                        <div
                        key={clip.id}
                        className={`clip-node absolute top-2 bottom-2 rounded-md overflow-hidden flex items-center px-2 
                            ${getClipColor(clip.type, selectedClipId === clip.id)}
                            ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-move'}
                        `}
                        style={{
                            left: clip.startOffset * zoomLevel,
                            width: Math.max(clip.duration * zoomLevel, 10), // Min width
                        }}
                        onMouseDown={(e) => { e.stopPropagation(); handleClipStart(e.clientX, e.clientY, clip); }}
                        onTouchStart={(e) => { e.stopPropagation(); handleClipStart(e.touches[0].clientX, e.touches[0].clientY, clip); }}
                        >
                        {/* Keyframe Dots */}
                        {clip.keyframes.length > 0 && (
                            <div className="absolute bottom-1 left-0 w-full h-2 flex items-center pointer-events-none">
                                {clip.keyframes.map(k => (
                                    <div key={k.id} className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-sm" style={{ left: (k.time / clip.duration) * 100 + '%' }} />
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-semibold pointer-events-none w-full relative z-10">
                            {getClipIcon(clip.type)}
                            <span className="truncate">{clip.name}</span>
                        </div>
                        
                        {/* Waveform Visualization (Fake) for Audio */}
                        {clip.type === ClipType.AUDIO && (
                             <div className="absolute inset-0 opacity-20 flex items-center gap-0.5 pl-2 pointer-events-none">
                                {Array.from({ length: 20 }).map((_, idx) => (
                                    <div key={idx} className="bg-white w-1 rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                                ))}
                             </div>
                        )}
                        
                        {!isLocked && <div className="absolute right-0 top-0 bottom-0 w-4 hover:bg-white/20 cursor-e-resize z-20" />}
                        </div>
                    ))}
                    </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};