
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useEditor } from '../store/editorContext';
import { ClipType, Clip } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize, Move } from 'lucide-react';

export const Player: React.FC = () => {
  const { 
    currentTime, 
    clips, 
    tracks,
    isPlaying, 
    play, 
    pause, 
    seek, 
    duration,
    project,
    selectedClipId,
    selectClip,
    updateClip
  } = useEditor();

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const clipStartProps = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    clips.forEach(clip => {
      if (clip.type === ClipType.AUDIO || clip.type === ClipType.VIDEO) {
        let mediaEl: HTMLMediaElement | undefined;
        
        if (clip.type === ClipType.AUDIO) {
            if (!audioRefs.current[clip.id] && clip.src) {
                audioRefs.current[clip.id] = new Audio(clip.src);
            }
            mediaEl = audioRefs.current[clip.id];
        } else {
            mediaEl = videoRefs.current[clip.id];
        }

        if (mediaEl) {
           const track = tracks.find(t => t.id === clip.trackId);
           const isTrackMuted = track ? track.isMuted : false;
           
           mediaEl.volume = isTrackMuted ? 0 : clip.volume;
           mediaEl.muted = isTrackMuted; 
           
           if (mediaEl.playbackRate !== (clip.speed || 1.0)) {
             mediaEl.playbackRate = clip.speed || 1.0;
           }

           const clipEnd = clip.startOffset + clip.duration;
           const isWithinClip = currentTime >= clip.startOffset && currentTime < clipEnd;
           const clipTime = (currentTime - clip.startOffset) * (clip.speed || 1.0);

           if (isWithinClip && isPlaying) {
             if (mediaEl.paused) {
                mediaEl.play().catch((err) => {
                    console.warn("Autoplay blocked or playback failed", err);
                });
             }
             if (Math.abs(mediaEl.currentTime - clipTime) > 0.1) {
                mediaEl.currentTime = clipTime;
             }
           } else {
             if (!mediaEl.paused) mediaEl.pause();
             if (isWithinClip && Math.abs(mediaEl.currentTime - clipTime) > 0.05) {
                 mediaEl.currentTime = clipTime;
             }
           }
        }
      }
    });
  }, [currentTime, isPlaying, clips, tracks]);

  useEffect(() => {
     Object.keys(audioRefs.current).forEach(id => {
         if (!clips.find(c => c.id === id)) {
             audioRefs.current[id].pause();
             delete audioRefs.current[id];
         }
     });
     Object.keys(videoRefs.current).forEach(id => {
        if (!clips.find(c => c.id === id)) {
            delete videoRefs.current[id];
        }
    });
  }, [clips]);

  const activeClips = useMemo(() => {
    return clips.filter(c => {
      const track = tracks.find(t => t.id === c.trackId);
      const isTrackHidden = track?.isMuted && track?.type === 'visual';
      return c.type !== ClipType.AUDIO && !isTrackHidden && currentTime >= c.startOffset && currentTime < (c.startOffset + c.duration);
    }).sort((a, b) => a.trackId - b.trackId);
  }, [clips, currentTime, tracks]);

  const selectedClip = useMemo(() => activeClips.find(c => c.id === selectedClipId), [activeClips, selectedClipId]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${min}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  const getAspectRatioStyle = () => {
    switch (project.ratio) {
      case '9:16': return { aspectRatio: '9/16' };
      case '1:1': return { aspectRatio: '1/1' };
      case '4:5': return { aspectRatio: '4/5' };
      case '21:9': return { aspectRatio: '21/9' };
      case '16:9': default: return { aspectRatio: '16/9' };
    }
  };

  // Interaction Handlers
  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, clip: Clip, mode: 'drag' | 'resize') => {
    e.stopPropagation();
    selectClip(clip.id);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    clipStartProps.current = { x: clip.x || 0, y: clip.y || 0, scale: clip.scale || 1 };
    
    if (mode === 'drag') setIsDragging(true);
    else setIsResizing(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!selectedClip || (!isDragging && !isResizing)) return;

      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - dragStartPos.current.x;
      const deltaY = clientY - dragStartPos.current.y;

      if (isDragging) {
        updateClip(selectedClip.id, {
          x: clipStartProps.current.x + deltaX,
          y: clipStartProps.current.y + deltaY
        });
      } else if (isResizing) {
        // Simple scale calculation based on horizontal movement
        const newScale = Math.max(0.1, clipStartProps.current.scale + (deltaX / 100));
        updateClip(selectedClip.id, { scale: newScale });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing, selectedClip, updateClip]);

  return (
    <div className="flex flex-col h-full bg-black w-full overflow-hidden">
      <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] m-0 md:m-4 md:rounded-lg border-b md:border border-gray-800">
        <div 
          ref={canvasRef}
          className="relative bg-black shadow-2xl overflow-hidden" 
          style={{ 
            ...getAspectRatioStyle(), 
            maxHeight: '100%', 
            maxWidth: '100%', 
            width: project.ratio === '9:16' || project.ratio === '4:5' ? 'auto' : '100%',
            height: project.ratio === '9:16' || project.ratio === '4:5' ? '100%' : 'auto' 
          }}
          onClick={() => selectClip(null)}
        >
          {activeClips.map(clip => (
                <div 
                  key={clip.id} 
                  className={`absolute top-0 left-0 w-full h-full flex items-center justify-center origin-center pointer-events-auto cursor-pointer ${selectedClipId === clip.id ? 'z-50' : ''}`}
                  onMouseDown={(e) => handleInteractionStart(e, clip, 'drag')}
                  onTouchStart={(e) => handleInteractionStart(e, clip, 'drag')}
                  style={{
                      opacity: clip.opacity, 
                      transform: `translate(${clip.x || 0}px, ${clip.y || 0}px) scale(${clip.scale}) rotate(${clip.rotation}deg)`,
                      filter: `brightness(${clip.brightness}) contrast(${clip.contrast}) saturate(${clip.saturation}) blur(${clip.blur}px) grayscale(${clip.grayscale}) sepia(${clip.sepia}) hue-rotate(${clip.hueRotate || 0}deg)`,
                  }}>
                
                {selectedClipId === clip.id && (
                  <div className="absolute inset-0 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-50 pointer-events-none">
                    {/* Resizing Handle */}
                    <div 
                      className="absolute bottom-[-8px] right-[-8px] w-8 h-8 bg-white border-4 border-blue-500 rounded-full pointer-events-auto cursor-nwse-resize flex items-center justify-center z-[60]"
                      onMouseDown={(e) => handleInteractionStart(e, clip, 'resize')}
                      onTouchStart={(e) => handleInteractionStart(e, clip, 'resize')}
                    >
                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                )}

                {clip.type === ClipType.VIDEO ? (
                    <video 
                        src={clip.src} 
                        className="w-full h-full object-contain pointer-events-none" 
                        ref={el => { if (el) videoRefs.current[clip.id] = el; }} 
                        playsInline 
                    />
                ) : clip.type === ClipType.IMAGE ? (
                    <img src={clip.src} alt={clip.name} className="w-full h-full object-contain pointer-events-none" />
                ) : clip.type === ClipType.TEXT ? (
                    <div className="p-4 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                      <h1 style={{ 
                        fontFamily: clip.fontFamily || 'sans-serif',
                        fontSize: `${(clip.fontSize || 40)}px`,
                        color: clip.color || 'white',
                        backgroundColor: clip.backgroundColor || 'transparent',
                        fontWeight: clip.fontWeight || 'bold',
                        textAlign: clip.textAlign || 'center',
                        textShadow: clip.textShadow || '2px 2px 4px rgba(0,0,0,0.5)',
                        padding: '10px'
                      }}>
                        {clip.content || clip.name}
                      </h1>
                    </div>
                ) : null}
                </div>
            ))}
        </div>
      </div>
      <div className="h-12 bg-[#18181a] border-t border-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="text-xs font-mono text-blue-400 w-16">{formatTime(currentTime)}</div>
        <div className="flex items-center gap-6">
          <button onClick={() => seek(0)} className="text-gray-400 hover:text-white transition-colors"><SkipBack size={18} /></button>
          <button onClick={() => isPlaying ? pause() : play()} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
          </button>
          <button onClick={() => seek(duration)} className="text-gray-400 hover:text-white transition-colors"><SkipForward size={18} /></button>
        </div>
        <div className="w-16 flex justify-end"><Maximize size={16} className="text-gray-500" /></div>
      </div>
    </div>
  );
};
