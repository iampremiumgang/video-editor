
import React, { useRef, useEffect, useState } from 'react';
import { useEditor } from '../store/editorContext';
import { Clip, ClipType } from '../types';
import { Video, Mic, Type, Image as ImageIcon, Scissors, Trash2, MousePointer2, Plus, Volume2, VolumeX, Lock, Unlock, Music, Film } from 'lucide-react';

const TRACK_HEIGHT = 80;
const HEADER_HEIGHT = 30;

const Waveform: React.FC<{ waveform: number[]; color: string }> = ({ waveform, color }) => {
  return (
    <svg className="w-full h-full opacity-60" preserveAspectRatio="none" viewBox={`0 0 ${waveform.length} 100`}>
      <path
        d={waveform.map((peak, i) => {
          const height = peak * 80; // Scale peak to 80% height
          const y1 = 50 - height / 2;
          const y2 = 50 + height / 2;
          return `M${i},${y1} L${i},${y2}`;
        }).join(' ')}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

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

  useEffect(() => {
    const handleUp = () => setDraggingClipId(null);
    const handleMove = (clientX: number, clientY: number) => {
      if (draggingClipId) {
        const deltaX = clientX - dragStartX.current;
        const deltaTime = deltaX / zoomLevel;
        let newStart = Math.max(0, clipStartOffset.current + deltaTime);
        const deltaY = clientY - dragStartY.current;
        const trackChange = Math.round(deltaY / TRACK_HEIGHT);
        let newTrackId = Math.max(0, clipStartTrack.current + trackChange);
        const targetTrack = tracks.find(t => t.id === newTrackId);
        if (targetTrack?.isLocked) newTrackId = clipStartTrack.current;
        updateClip(draggingClipId, { startOffset: newStart, trackId: newTrackId });
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
    seek(Math.max(0, x / zoomLevel));
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
    if (isSelected) return "bg-yellow-500 border-2 border-white text-black z-20 shadow-xl ring-2 ring-yellow-500/50";
    switch (type) {
      case ClipType.VIDEO: return "bg-blue-900/80 border border-blue-600 text-blue-100 hover:bg-blue-800";
      case ClipType.AUDIO: return "bg-teal-900/80 border border-teal-600 text-teal-100 hover:bg-teal-800";
      case ClipType.TEXT: return "bg-purple-900/80 border border-purple-600 text-purple-100 hover:bg-purple-800";
      case ClipType.IMAGE: return "bg-orange-900/80 border border-orange-600 text-orange-100 hover:bg-orange-800";
    }
  };

  const maxClipTrackId = Math.max(-1, ...clips.map(c => c.trackId));
  const maxTrackId = Math.max(tracks.length - 1, maxClipTrackId);
  const renderTracks = Array.from({ length: maxTrackId + 2 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] select-none border-t border-gray-800">
      <div className="h-10 border-b border-gray-700 flex items-center px-4 gap-4 bg-[#252525] overflow-x-auto hide-scrollbar whitespace-nowrap min-h-[40px]">
        <button className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded" onClick={() => selectClip(null)}>
           <MousePointer2 size={14} /> <span className="hidden md:inline">Select</span>
        </button>
        <button className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded disabled:opacity-50" onClick={splitSelectedClip} disabled={!selectedClipId}>
           <Scissors size={14} /> Split
        </button>
        <button className="flex items-center gap-2 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 rounded disabled:opacity-50" onClick={deleteSelectedClip} disabled={!selectedClipId}>
           <Trash2 size={14} /> Delete
        </button>
        <button className={`flex items-center gap-2 px-3 py-1 text-xs rounded transition-colors ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} onClick={() => isRecording ? stopRecording() : startRecording()}>
           <Mic size={14} /> {isRecording ? 'Stop' : 'Rec'}
        </button>
        <button className="flex items-center gap-2 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded ml-auto" onClick={addTrack}>
            <Plus size={14}/> Add Track
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-20 md:w-24 flex-shrink-0 bg-[#252525] border-r border-gray-700 z-20 shadow-lg flex flex-col overflow-hidden">
          <div style={{ height: HEADER_HEIGHT }} className="border-b border-gray-700 bg-[#1f1f1f] flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase">Tracks</div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
             {renderTracks.map((i) => {
                const track = tracks.find(t => t.id === i) || { id: i, type: i >= 2 ? 'audio' : 'visual', isMuted: false, isLocked: false };
                const isAudio = track.type === 'audio';
                return (
                    <div key={i} style={{ height: TRACK_HEIGHT }} className={`border-b border-gray-700 flex flex-col items-center justify-center gap-1.5 ${isAudio ? 'bg-[#1c2220]' : 'bg-[#1c1c24]'}`}>
                        <div className={`text-[10px] font-bold flex items-center gap-1 ${isAudio ? 'text-teal-500' : 'text-blue-500'}`}>
                           {isAudio ? <Music size={10} /> : <Film size={10} />}
                           <span>{isAudio ? 'A' : 'V'}{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleTrackMute(i)} className={`p-1 rounded ${track.isMuted ? 'text-red-500' : 'text-gray-500'}`}>
                                {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            </button>
                            <button onClick={() => toggleTrackLock(i)} className={`p-1 rounded ${track.isLocked ? 'text-yellow-500' : 'text-gray-500'}`}>
                                {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>
                        </div>
                    </div>
                );
             })}
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto relative bg-[#121212]" onMouseDown={(e) => handleTimelineClick(e.clientX)}>
          <div style={{ width: Math.max(duration * zoomLevel + 200, 1000), minHeight: '100%' }} className="relative">
            <div className="sticky top-0 left-0 w-full bg-[#252525] border-b border-gray-700 z-10 flex items-end pointer-events-none" style={{ height: HEADER_HEIGHT }}>
              {Array.from({ length: 120 }).map((_, i) => (
                <div key={i} className="absolute bottom-0 border-l border-gray-600 text-[10px] text-gray-500 pl-1" style={{ left: (i * 5) * zoomLevel, height: '40%' }}>{i * 5}s</div>
              ))}
            </div>

            <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-30 pointer-events-none" style={{ left: currentTime * zoomLevel, height: (renderTracks.length * TRACK_HEIGHT) + HEADER_HEIGHT }}>
               <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 text-red-500"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M0 0 H12 V6 L6 12 L0 6 Z" /></svg></div>
            </div>

            <div className="relative pt-0">
              {renderTracks.map((i) => {
                  const track = tracks.find(t => t.id === i);
                  const isLocked = track?.isLocked;
                  return (
                    <div key={i} className={`relative border-b border-gray-800 w-full ${isLocked ? 'bg-black/20' : 'bg-[#151515]'}`} style={{ height: TRACK_HEIGHT }}>
                    {clips.filter(c => c.trackId === i).map(clip => (
                        <div
                        key={clip.id}
                        className={`absolute top-2 bottom-2 rounded-md overflow-hidden flex items-center px-2 clip-node ${getClipColor(clip.type, selectedClipId === clip.id)} ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
                        style={{ left: clip.startOffset * zoomLevel, width: clip.duration * zoomLevel }}
                        onMouseDown={(e) => { e.stopPropagation(); handleClipStart(e.clientX, e.clientY, clip); }}
                        >
                        {/* Real Waveform for Audio or Video Clips */}
                        {clip.waveform && (
                          <div className="absolute inset-0 pointer-events-none px-1">
                            <Waveform waveform={clip.waveform} color={selectedClipId === clip.id ? "black" : (clip.type === ClipType.AUDIO ? "#2dd4bf" : "#60a5fa")} />
                          </div>
                        )}
                        
                        <div className="relative flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-semibold pointer-events-none w-full z-10">
                            {getClipIcon(clip.type)} <span className="truncate">{clip.name}</span>
                        </div>
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
