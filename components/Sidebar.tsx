import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../store/editorContext';
import { ClipType } from '../types';
import { 
  Film, Music, Type, Sparkles, Box, FileVideo, Plus, 
  ArrowLeft, Sliders, Trash2, Copy, Scissors, Key, 
  Sun, Contrast, Droplet, Monitor, X, Check, Volume2, Move
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'media', icon: FileVideo, label: 'Media' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'effects', icon: Sparkles, label: 'Effects' },
];

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('media');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileActiveTool, setMobileActiveTool] = useState<string | null>(null);

  const { 
    addClip, 
    uploadFile, 
    selectedClipId, 
    clips, 
    updateClip, 
    deleteSelectedClip, 
    selectClip,
    splitSelectedClip,
    addKeyframe,
    currentTime
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedClip = selectedClipId ? clips.find(c => c.id === selectedClipId) : null;

  // Close mobile tools when selection clears
  useEffect(() => {
    if (!selectedClipId) {
        setMobileActiveTool(null);
    }
  }, [selectedClipId]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setMobileDrawerOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleAddSample = (type: ClipType) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    let clipData: any = {
      id,
      type,
      startOffset: currentTime, // Insert at playhead
      duration: 5,
      trackId: type === ClipType.AUDIO ? 2 : 0,
      opacity: 1, scale: 1, rotation: 0,
      volume: 1, speed: 1,
      brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0,
      fadeIn: 0, fadeOut: 0, keyframes: []
    };

    if (type === ClipType.TEXT) {
      clipData.name = 'New Text';
      clipData.content = 'Add Text Here';
      clipData.trackId = 1;
    } else if (type === ClipType.VIDEO) {
      clipData.name = 'Sample Video';
      clipData.src = 'https://media.istockphoto.com/id/1369528766/video/beautiful-pink-flower-blooming-on-black-background.mp4?s=mp4-640x640-is&k=20&c=g-wXWgw5C9uXJgYQxO0GqF_S0-TjH1sN_P0_wV1w-1g=';
    } else if (type === ClipType.AUDIO) {
      clipData.name = 'Sample Beat';
      clipData.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; 
    }

    addClip(clipData);
    setMobileDrawerOpen(false);
  };

  const handleChange = (key: keyof any, value: number | string) => {
    if (selectedClip) updateClip(selectedClip.id, { [key]: value });
  };

  const handleAddKeyframe = (prop: string) => {
    // @ts-ignore
    if (selectedClip) addKeyframe(prop, selectedClip[prop]);
  };

  // --- RENDER HELPERS ---

  const renderLibraryContent = () => (
    <div className="p-4 grid grid-cols-2 gap-3 pb-20 md:pb-4">
        {activeTab === 'media' && (
            <>
                <button onClick={handleImportClick} className="aspect-video bg-gray-800 rounded flex flex-col items-center justify-center gap-2 border border-gray-700 border-dashed">
                    <Plus size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Import</span>
                </button>
                <button onClick={() => handleAddSample(ClipType.VIDEO)} className="aspect-video bg-gray-800 rounded relative overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900"></div>
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 px-1 rounded text-white">Sample</span>
                </button>
            </>
        )}
        {activeTab === 'audio' && (
            <>
                <button onClick={handleImportClick} className="col-span-2 p-3 bg-gray-800 rounded text-xs flex items-center justify-center gap-2 border border-dashed border-gray-600">
                    <Plus size={14}/> Import Music
                </button>
                <button onClick={() => handleAddSample(ClipType.AUDIO)} className="col-span-2 p-3 bg-gray-800 rounded flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-900 rounded flex items-center justify-center"><Music size={14} className="text-green-400"/></div>
                    <div className="text-left">
                        <div className="text-sm font-bold">Lofi Beat</div>
                        <div className="text-[10px] text-gray-400">03:45</div>
                    </div>
                </button>
            </>
        )}
        {activeTab === 'text' && (
            <button onClick={() => handleAddSample(ClipType.TEXT)} className="col-span-2 p-4 bg-gray-800 rounded text-left">
                <h3 className="font-bold text-xl">Default Text</h3>
            </button>
        )}
         {activeTab === 'effects' && (
            <div className="col-span-2 text-center text-gray-500 text-xs">
              Select a clip to add effects.
            </div>
          )}
    </div>
  );

  const renderPropertiesContent = () => {
    if (!selectedClip) return null;
    return (
        <div className="p-4 space-y-6 pb-20 md:pb-4">
             {/* Mobile specific tool header handled in toolbar */}
             <div className="hidden md:flex items-center justify-between mb-4">
                 <span className="font-bold truncate">{selectedClip.name}</span>
                 <button onClick={() => selectClip(null)}><X size={16}/></button>
             </div>

             {/* Tools */}
             <div className="space-y-4">
                 {selectedClip.type === ClipType.TEXT && (
                    <textarea 
                        value={selectedClip.content || ''}
                        onChange={(e) => handleChange('content', e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                        rows={2}
                    />
                 )}

                 {/* Rendering specific controls based on mobile tool selection or showing all on desktop */}
                 <div className={`space-y-4 ${mobileActiveTool ? 'block' : 'hidden md:block'}`}>
                     
                     {(!mobileActiveTool || mobileActiveTool === 'transform') && selectedClip.type !== ClipType.AUDIO && (
                         <div className="bg-[#121212] p-3 rounded-lg space-y-3">
                            <div className="text-xs font-bold text-gray-400 mb-2">TRANSFORM</div>
                            <ControlRow label="Scale" value={selectedClip.scale} min={0} max={3} step={0.1} onChange={(v) => handleChange('scale', v)} onKeyframe={() => handleAddKeyframe('scale')} />
                            <ControlRow label="Rotation" value={selectedClip.rotation} min={-180} max={180} step={1} onChange={(v) => handleChange('rotation', v)} onKeyframe={() => handleAddKeyframe('rotation')} />
                            <ControlRow label="Opacity" value={selectedClip.opacity} min={0} max={1} step={0.01} onChange={(v) => handleChange('opacity', v)} onKeyframe={() => handleAddKeyframe('opacity')} />
                         </div>
                     )}

                     {(!mobileActiveTool || mobileActiveTool === 'filter') && selectedClip.type !== ClipType.AUDIO && (
                        <div className="bg-[#121212] p-3 rounded-lg space-y-3">
                             <div className="text-xs font-bold text-gray-400 mb-2">FILTERS</div>
                             <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                <FilterButton name="Normal" onClick={() => updateClip(selectedClip.id, { grayscale: 0, sepia: 0 })} active={selectedClip.grayscale === 0} />
                                <FilterButton name="B&W" onClick={() => updateClip(selectedClip.id, { grayscale: 1, sepia: 0 })} active={selectedClip.grayscale === 1} />
                                <FilterButton name="Sepia" onClick={() => updateClip(selectedClip.id, { grayscale: 0, sepia: 1 })} active={selectedClip.sepia === 1} />
                             </div>
                             <ControlRow label="Bright" value={selectedClip.brightness} min={0} max={2} step={0.1} onChange={(v) => handleChange('brightness', v)} />
                             <ControlRow label="Contrast" value={selectedClip.contrast} min={0} max={2} step={0.1} onChange={(v) => handleChange('contrast', v)} />
                        </div>
                     )}

                     {(!mobileActiveTool || mobileActiveTool === 'volume') && (selectedClip.type === ClipType.AUDIO || selectedClip.type === ClipType.VIDEO) && (
                         <div className="bg-[#121212] p-3 rounded-lg space-y-3">
                            <div className="text-xs font-bold text-gray-400 mb-2">AUDIO</div>
                            <ControlRow label="Volume" value={selectedClip.volume} min={0} max={1} step={0.01} onChange={(v) => handleChange('volume', v)} />
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
  };

  // --- DESKTOP VIEW ---
  const DesktopSidebar = () => (
    <div className="hidden md:flex h-full w-80 bg-[#1e1e1e] border-r border-gray-800 flex-row">
       {/* Icon Rail */}
       <div className="w-16 flex flex-col items-center py-4 gap-6 border-r border-gray-800 bg-[#18181a]">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); selectClip(null); }}
            className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${activeTab === item.id && !selectedClip ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      
      {/* Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
         {selectedClip ? (
            renderPropertiesContent()
         ) : (
            <>
               <div className="h-12 flex items-center px-4 font-bold border-b border-gray-800">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
               </div>
               {renderLibraryContent()}
            </>
         )}
      </div>
    </div>
  );

  // --- MOBILE VIEW ---
  const MobileBottomBar = () => {
    // 1. Tool Specific Drawer (Slider controls etc)
    const renderToolDrawer = () => {
        if (!mobileActiveTool || !selectedClip) return null;
        return (
            <div className="absolute bottom-full left-0 w-full bg-[#1e1e1e] border-t border-gray-800 p-4 animate-slide-up shadow-2xl z-20">
               <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm capitalize">{mobileActiveTool}</span>
                  <button onClick={() => setMobileActiveTool(null)}><Check size={18} className="text-green-500"/></button>
               </div>
               {renderPropertiesContent()}
            </div>
        );
    };

    // 2. Library Drawer
    const renderLibraryDrawer = () => {
        if (!mobileDrawerOpen || selectedClip) return null;
        return (
            <div className="absolute bottom-full left-0 w-full bg-[#1e1e1e] border-t border-gray-800 h-[50vh] flex flex-col z-20">
                <div className="flex justify-between items-center p-3 border-b border-gray-700">
                     <span className="font-bold capitalize">{activeTab}</span>
                     <button onClick={() => setMobileDrawerOpen(false)}><X size={18}/></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {renderLibraryContent()}
                </div>
            </div>
        );
    };

    // 3. Main Bottom Bar
    return (
        <div className="md:hidden flex flex-col bg-[#18181a] border-t border-gray-800 relative z-10">
            {renderToolDrawer()}
            {renderLibraryDrawer()}
            
            <div className="h-16 flex items-center overflow-x-auto hide-scrollbar px-2 gap-2">
                {selectedClip ? (
                    // Clip Selected Toolbar
                    <>
                        <button onClick={() => selectClip(null)} className="flex flex-col items-center min-w-[60px] text-gray-400">
                            <ArrowLeft size={20} />
                            <span className="text-[10px] mt-1">Back</span>
                        </button>
                        <div className="w-px h-8 bg-gray-700 mx-1"></div>
                        <ToolIcon icon={Scissors} label="Split" onClick={splitSelectedClip} />
                        <ToolIcon icon={Trash2} label="Delete" onClick={deleteSelectedClip} active={false} color="text-red-400" />
                        {selectedClip.type !== ClipType.AUDIO && <ToolIcon icon={Move} label="Transform" onClick={() => setMobileActiveTool('transform')} active={mobileActiveTool === 'transform'} />}
                        {(selectedClip.type === ClipType.AUDIO || selectedClip.type === ClipType.VIDEO) && <ToolIcon icon={Volume2} label="Volume" onClick={() => setMobileActiveTool('volume')} active={mobileActiveTool === 'volume'} />}
                        {selectedClip.type !== ClipType.AUDIO && <ToolIcon icon={Sparkles} label="Filters" onClick={() => setMobileActiveTool('filter')} active={mobileActiveTool === 'filter'} />}
                        <ToolIcon icon={Copy} label="Duplicate" onClick={() => {}} />
                    </>
                ) : (
                    // Default Toolbar
                    MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setMobileDrawerOpen(true); }}
                            className={`flex flex-col items-center justify-center min-w-[70px] h-full gap-1 transition-colors ${activeTab === item.id && mobileDrawerOpen ? 'text-blue-500' : 'text-gray-400'}`}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
  };

  return (
    <>
      <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="video/*,audio/*,image/*" />
      <DesktopSidebar />
      <MobileBottomBar />
    </>
  );
};

// UI Components
const ToolIcon = ({ icon: Icon, label, onClick, active, color }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center min-w-[60px] h-full gap-1 ${active ? 'text-blue-500' : color || 'text-gray-300'}`}
    >
        <Icon size={20} />
        <span className="text-[10px] whitespace-nowrap">{label}</span>
    </button>
);

const ControlRow = ({ label, value, min, max, step, onChange, suffix = '', onKeyframe }: any) => (
  <div className="group">
    <div className="flex justify-between text-xs mb-1.5 items-center">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-200 font-mono text-[10px]">{Math.round(value * (label === 'Scale' ? 100 : 1))}{suffix}</span>
        {onKeyframe && (
          <button 
            onClick={onKeyframe}
            className="md:opacity-0 group-hover:opacity-100 p-0.5 hover:text-blue-400 transition-opacity text-gray-500"
            title="Add Keyframe"
          >
            <Key size={10} />
          </button>
        )}
      </div>
    </div>
    <input 
      type="range" min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer hover:bg-blue-600 transition-colors accent-blue-500"
    />
  </div>
);

const FilterButton = ({ name, onClick, active }: any) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 w-12 h-12 rounded flex items-center justify-center text-[10px] transition-all border ${active ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
  >
    {name}
  </button>
);