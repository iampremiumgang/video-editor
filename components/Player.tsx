import React, { useMemo, useRef, useEffect } from 'react';
import { useEditor } from '../store/editorContext';
import { ClipType, Clip } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize, Volume2, VolumeX } from 'lucide-react';

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
    project
  } = useEditor();

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // --- Audio Sync Logic ---
  useEffect(() => {
    clips.forEach(clip => {
      if (clip.type === ClipType.AUDIO || clip.type === ClipType.VIDEO) {
        let audioEl = audioRefs.current[clip.id];
        if (!audioEl && clip.type === ClipType.AUDIO && clip.src) {
           audioEl = new Audio(clip.src);
           audioRefs.current[clip.id] = audioEl;
        }

        if (audioEl) {
           // Check track mute status
           const track = tracks.find(t => t.id === clip.trackId);
           const isTrackMuted = track ? track.isMuted : false;
           
           audioEl.volume = isTrackMuted ? 0 : clip.volume;

           const clipEnd = clip.startOffset + clip.duration;
           const isWithinClip = currentTime >= clip.startOffset && currentTime < clipEnd;
           const clipTime = currentTime - clip.startOffset;

           if (isWithinClip && isPlaying) {
             if (audioEl.paused) audioEl.play().catch(() => {});
             if (Math.abs(audioEl.currentTime - clipTime) > 0.1) {
                audioEl.currentTime = clipTime;
             }
           } else {
             if (!audioEl.paused) audioEl.pause();
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
  }, [clips]);

  const activeClips = useMemo(() => {
    return clips.filter(c => {
      // Logic for Visual Rendering:
      // Must not be Audio type (Audio logic handled above)
      // Must be within time range
      // Track must NOT be hidden? (We don't have hide track yet, but we have Mute. For visual tracks, Mute could mean Hide?)
      // Let's assume Mute on visual track means Hide.
      
      const track = tracks.find(t => t.id === c.trackId);
      const isTrackHidden = track?.isMuted && track?.type === 'visual';
      
      return (
          c.type !== ClipType.AUDIO && 
          !isTrackHidden &&
          currentTime >= c.startOffset && 
          currentTime < (c.startOffset + c.duration)
      );
    }).sort((a, b) => a.trackId - b.trackId);
  }, [clips, currentTime, tracks]);

  const getInterpolatedValue = (clip: Clip, prop: keyof Clip | string, baseValue: number) => {
    if (!clip.keyframes || clip.keyframes.length === 0) return baseValue;
    const clipTime = currentTime - clip.startOffset;
    const propKeyframes = clip.keyframes.filter(k => k.property === prop).sort((a, b) => a.time - b.time);

    if (propKeyframes.length === 0) return baseValue;
    if (clipTime < propKeyframes[0].time) return propKeyframes[0].value;
    if (clipTime > propKeyframes[propKeyframes.length - 1].time) return propKeyframes[propKeyframes.length - 1].value;

    for (let i = 0; i < propKeyframes.length - 1; i++) {
        const k1 = propKeyframes[i];
        const k2 = propKeyframes[i+1];
        if (clipTime >= k1.time && clipTime <= k2.time) {
            const t = (clipTime - k1.time) / (k2.time - k1.time);
            return k1.value + t * (k2.value - k1.value);
        }
    }
    return baseValue;
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${min}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  const getAspectRatioStyle = () => {
    // Return CSS aspect-ratio string or style object
    switch (project.ratio) {
      case '9:16': return { aspectRatio: '9/16' };
      case '1:1': return { aspectRatio: '1/1' };
      case '4:5': return { aspectRatio: '4/5' };
      case '21:9': return { aspectRatio: '21/9' };
      case '16:9': 
      default: return { aspectRatio: '16/9' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-black w-full">
      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] overflow-hidden m-0 md:m-4 rounded-none md:rounded-lg border-b md:border border-gray-800">
        <div 
          className="relative bg-black shadow-2xl overflow-hidden max-w-full"
          style={{ 
             ...getAspectRatioStyle(),
             height: '100%',
             maxHeight: '100%'
          }}
        >
          {activeClips.map(clip => {
            const opacity = getInterpolatedValue(clip, 'opacity', clip.opacity);
            const scale = getInterpolatedValue(clip, 'scale', clip.scale);
            const rotation = getInterpolatedValue(clip, 'rotation', clip.rotation);

            let transitionOpacity = 1;
            const clipTime = currentTime - clip.startOffset;
            const timeRemaining = clip.duration - clipTime;
            
            if (clip.fadeIn > 0 && clipTime < clip.fadeIn) {
                transitionOpacity = clipTime / clip.fadeIn;
            } else if (clip.fadeOut > 0 && timeRemaining < clip.fadeOut) {
                transitionOpacity = timeRemaining / clip.fadeOut;
            }
            const finalOpacity = opacity * transitionOpacity;

            return (
                <div
                key={clip.id}
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none origin-center"
                style={{
                    opacity: finalOpacity,
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    filter: `brightness(${clip.brightness}) contrast(${clip.contrast}) saturate(${clip.saturation}) blur(${clip.blur}px) grayscale(${clip.grayscale}) sepia(${clip.sepia})`,
                }}
                >
                {clip.type === ClipType.VIDEO ? (
                    <video 
                        src={clip.src} 
                        className="w-full h-full object-cover"
                        ref={el => {
                            if (el && Math.abs(el.currentTime - (currentTime - clip.startOffset)) > 0.2) {
                                el.currentTime = currentTime - clip.startOffset;
                            }
                            if (el) {
                                if (isPlaying && el.paused) el.play().catch(()=>{});
                                if (!isPlaying && !el.paused) el.pause();
                            }
                        }}
                        muted={true} 
                        playsInline
                    />
                ) : clip.type === ClipType.IMAGE ? (
                    <img 
                    src={clip.src} 
                    alt={clip.name} 
                    className="w-full h-full object-cover"
                    />
                ) : clip.type === ClipType.TEXT ? (
                    <div className="text-center p-4">
                    <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-pre-wrap" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {clip.content || clip.name}
                    </h1>
                    </div>
                ) : null}
                </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="h-12 md:h-14 bg-[#18181a] border-t border-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="text-xs font-mono text-blue-400 w-16">
          {formatTime(currentTime)}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button 
            className="p-2 hover:bg-gray-700 rounded-full text-gray-300 transition-colors"
            onClick={() => seek(0)}
          >
            <SkipBack size={18} />
          </button>
          <button 
            onClick={() => isPlaying ? pause() : play()}
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-all transform active:scale-95"
          >
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded-full text-gray-300 transition-colors"
            onClick={() => seek(duration)}
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div className="w-16 flex justify-end gap-2">
           <button className="p-2 hover:bg-gray-700 rounded-full text-gray-300 transition-colors hidden md:block">
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};