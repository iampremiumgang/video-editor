
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useEditor } from '../store/editorContext';
import { ClipType, Clip } from '../types';
import { 
  Film, Music, Type, Sparkles, Box, FileVideo, Plus, 
  ArrowLeft, Sliders, Trash2, Copy, Scissors, Key, 
  Sun, Contrast, Droplet, Monitor, X, Check, Volume2, Move, Search, Filter
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'media', icon: FileVideo, label: 'Media' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'filters', icon: Sparkles, label: 'Filters' },
];

const FILTER_CATEGORIES = ['Cinematic', 'Aesthetic', 'Vintage', 'B&W', 'Fresh', 'Nature', 'Art'];
const GENERATED_FILTERS = (() => {
  const list = [];
  for (let i = 0; i < 210; i++) {
    const cat = FILTER_CATEGORIES[i % FILTER_CATEGORIES.length];
    const hue = (i * 17) % 360;
    const sat = 0.5 + (Math.random() * 1.5);
    const bri = 0.8 + (Math.random() * 0.4);
    list.push({
      id: `filter-${i}`,
      category: cat,
      name: `${cat} ${Math.floor(i / FILTER_CATEGORIES.length) + 1}`,
      props: {
        brightness: bri,
        contrast: 0.9 + (Math.random() * 0.5),
        saturation: sat,
        sepia: i % 10 === 0 ? 0.5 : 0,
        grayscale: i % 15 === 0 ? 1 : 0,
        hueRotate: hue,
        blur: i % 50 === 0 ? 2 : 0
      }
    });
  }
  return list;
})();

const TEXT_CATEGORIES = ['Basic', 'Titles', 'Social', 'Neon', 'Aesthetic', 'Minimal'];
const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui', 'Georgia', 'Impact'];
const GENERATED_TEXT_STYLES = (() => {
  const list = [];
  for (let i = 0; i < 210; i++) {
    const cat = TEXT_CATEGORIES[i % TEXT_CATEGORIES.length];
    const color = i % 2 === 0 ? '#ffffff' : i % 3 === 0 ? '#ff00ff' : '#00ffff';
    list.push({
      id: `text-${i}`,
      category: cat,
      name: `${cat} Style ${Math.floor(i / TEXT_CATEGORIES.length) + 1}`,
      props: {
        fontFamily: FONT_FAMILIES[i % FONT_FAMILIES.length],
        fontSize: 40 + (i % 20),
        color: color,
        fontWeight: i % 5 === 0 ? '900' : 'bold',
        textShadow: i % 4 === 0 ? `0 0 10px ${color}` : '2px 2px 4px rgba(0,0,0,0.5)',
        backgroundColor: i % 10 === 0 ? 'rgba(255,255,255,0.2)' : 'transparent',
        textAlign: 'center' as any
      }
    });
  }
  return list;
})();

// Stable component to fix text input focus loss
const PropertiesPanelContent = ({ clip, updateClip, selectClip, mobileActiveTool }: { 
  clip: Clip, 
  updateClip: (id: string, changes: any) => void,
  selectClip: (id: string | null) => void,
  mobileActiveTool: string | null 
}) => (
  <div className="p-4 space-y-6 pb-20 md:pb-4 h-full overflow-y-auto custom-scrollbar bg-[#18181a]">
    <div className="hidden md:flex items-center justify-between mb-2">
      <span className="font-bold truncate text-sm text-gray-300">{clip.name}</span>
      <button onClick={() => selectClip(null)} className="p-1 hover:bg-gray-800 rounded"><X size={16}/></button>
    </div>

    <div className="space-y-4">
      {clip.type === ClipType.TEXT && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CONTENT</label>
          <textarea 
            value={clip.content || ''}
            onChange={(e) => updateClip(clip.id, { content: e.target.value })}
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
            rows={3}
          />
        </div>
      )}

      <div className={`space-y-4 ${mobileActiveTool ? 'block' : 'hidden md:block'}`}>
        {(!mobileActiveTool || mobileActiveTool === 'transform') && clip.type !== ClipType.AUDIO && (
          <div className="bg-[#121212] p-4 rounded-xl space-y-4 border border-gray-800 shadow-xl">
            <div className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Move size={12}/> TRANSFORM
            </div>
            <ControlRow label="X Offset" value={clip.x || 0} min={-500} max={500} step={1} onChange={(v:any) => updateClip(clip.id, { x: v })} suffix="px" />
            <ControlRow label="Y Offset" value={clip.y || 0} min={-500} max={500} step={1} onChange={(v:any) => updateClip(clip.id, { y: v })} suffix="px" />
            <ControlRow label="Scale" value={clip.scale} min={0} max={3} step={0.1} onChange={(v:any) => updateClip(clip.id, { scale: v })} />
            <ControlRow label="Rotation" value={clip.rotation} min={-180} max={180} step={1} onChange={(v:any) => updateClip(clip.id, { rotation: v })} suffix="°" />
            <ControlRow label="Opacity" value={clip.opacity} min={0} max={1} step={0.01} onChange={(v:any) => updateClip(clip.id, { opacity: v })} />
          </div>
        )}

        {(!mobileActiveTool || mobileActiveTool === 'filter') && clip.type !== ClipType.AUDIO && (
          <div className="bg-[#121212] p-4 rounded-xl space-y-4 border border-gray-800 shadow-xl">
            <div className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Filter size={12}/> ADJUSTMENTS
            </div>
            <ControlRow label="Bright" value={clip.brightness} min={0} max={2} step={0.1} onChange={(v:any) => updateClip(clip.id, { brightness: v })} />
            <ControlRow label="Contrast" value={clip.contrast} min={0} max={2} step={0.1} onChange={(v:any) => updateClip(clip.id, { contrast: v })} />
            <ControlRow label="Saturation" value={clip.saturation} min={0} max={3} step={0.1} onChange={(v:any) => updateClip(clip.id, { saturation: v })} />
            <ControlRow label="Hue" value={clip.hueRotate} min={0} max={360} step={1} onChange={(v:any) => updateClip(clip.id, { hueRotate: v })} suffix="°" />
          </div>
        )}

        {(!mobileActiveTool || mobileActiveTool === 'volume') && (clip.type === ClipType.AUDIO || clip.type === ClipType.VIDEO) && (
          <div className="bg-[#121212] p-4 rounded-xl space-y-4 border border-gray-800 shadow-xl">
            <div className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Volume2 size={12}/> AUDIO
            </div>
            <ControlRow label="Volume" value={clip.volume} min={0} max={1} step={0.01} onChange={(v:any) => updateClip(clip.id, { volume: v })} />
          </div>
        )}
      </div>
    </div>
  </div>
);

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('media');
  const [filterQuery, setFilterQuery] = useState('');
  const [textQuery, setTextQuery] = useState('');
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
    currentTime
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedClip = selectedClipId ? clips.find(c => c.id === selectedClipId) : null;

  useEffect(() => {
    if (!selectedClipId) setMobileActiveTool(null);
  }, [selectedClipId]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setMobileDrawerOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) uploadFile(e.target.files[0]);
  };

  const handleAddSample = (type: ClipType, props: any = {}) => {
    const id = Math.random().toString(36).substr(2, 9);
    let clipData: any = {
      id, type, startOffset: currentTime, duration: 5, trackId: type === ClipType.AUDIO ? 2 : 0,
      opacity: 1, scale: 1, rotation: 0, x: 0, y: 0, volume: 1, speed: 1,
      brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0,
      fadeIn: 0, fadeOut: 0, keyframes: [], ...props
    };
    if (type === ClipType.TEXT) {
      clipData.name = props.name || 'New Text';
      clipData.content = 'Edit Me';
      clipData.trackId = 1;
    } else if (type === ClipType.VIDEO) {
      clipData.name = 'Sample Video';
      clipData.src = 'https://media.istockphoto.com/id/1369528766/video/beautiful-pink-flower-blooming-on-black-background.mp4?s=mp4-640x640-is&k=20&c=g-wXWgw5C9uXJgYQxO0GqF_S0-TjH1sN_P0_wV1w-1g=';
      clipData.waveform = Array.from({length: 100}, () => 0.2 + Math.random() * 0.5);
    }
    addClip(clipData);
    setMobileDrawerOpen(false);
  };

  const applyPresetFilter = (props: any) => {
    if (selectedClip) updateClip(selectedClip.id, props);
  };

  const filteredFiltersList = useMemo(() => 
    GENERATED_FILTERS.filter(f => f.name.toLowerCase().includes(filterQuery.toLowerCase())),
    [filterQuery]
  );

  const filteredTextList = useMemo(() => 
    GENERATED_TEXT_STYLES.filter(t => t.name.toLowerCase().includes(textQuery.toLowerCase())),
    [textQuery]
  );

  return (
    <>
      <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="video/*,audio/*,image/*" />
      
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex h-full w-80 bg-[#1e1e1e] border-r border-gray-800 flex-row">
        <div className="w-16 flex flex-col items-center py-4 gap-6 border-r border-gray-800 bg-[#18181a]">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); selectClip(null); }}
              className={`flex flex-col items-center gap-1 text-[9px] transition-all ${activeTab === item.id && !selectedClip ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <item.icon size={22} className={activeTab === item.id && !selectedClip ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
              <span className="font-bold uppercase tracking-tighter mt-1">{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden bg-[#18181a]">
          {selectedClip ? (
            <PropertiesPanelContent 
              clip={selectedClip} 
              updateClip={updateClip} 
              selectClip={selectClip} 
              mobileActiveTool={null} 
            />
          ) : (
            <>
              <div className="h-12 flex items-center px-4 font-black border-b border-gray-800 text-xs text-gray-500 uppercase tracking-widest">
                Library: {activeTab}
              </div>
              <div className="flex-1 overflow-hidden">
                <LibraryContent 
                  activeTab={activeTab} 
                  handleImportClick={handleImportClick} 
                  handleAddSample={handleAddSample} 
                  filterQuery={filterQuery} 
                  setFilterQuery={setFilterQuery} 
                  filteredFiltersList={filteredFiltersList} 
                  applyPresetFilter={applyPresetFilter} 
                  textQuery={textQuery} 
                  setTextQuery={setTextQuery} 
                  filteredTextList={filteredTextList} 
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden flex flex-col bg-[#18181a] border-t border-gray-800 relative z-40">
        {mobileActiveTool && selectedClip && (
          <div className="absolute bottom-full left-0 w-full bg-[#1e1e1e] border-t border-gray-800 h-[40vh] animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 flex flex-col">
            <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-[#252525]">
              <span className="font-black text-[10px] uppercase tracking-widest text-blue-500">{mobileActiveTool}</span>
              <button onClick={() => setMobileActiveTool(null)} className="bg-blue-600/20 p-1.5 rounded-lg"><Check size={18} className="text-blue-400"/></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PropertiesPanelContent 
                clip={selectedClip} 
                updateClip={updateClip} 
                selectClip={selectClip} 
                mobileActiveTool={mobileActiveTool} 
              />
            </div>
          </div>
        )}

        {mobileDrawerOpen && !selectedClip && (
          <div className="absolute bottom-full left-0 w-full bg-[#1e1e1e] border-t border-gray-800 h-[60vh] flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-[#252525]">
              <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">{activeTab} Library</span>
              <button onClick={() => setMobileDrawerOpen(false)} className="p-1 hover:bg-gray-800 rounded"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LibraryContent 
                activeTab={activeTab} 
                handleImportClick={handleImportClick} 
                handleAddSample={handleAddSample} 
                filterQuery={filterQuery} 
                setFilterQuery={setFilterQuery} 
                filteredFiltersList={filteredFiltersList} 
                applyPresetFilter={applyPresetFilter} 
                textQuery={textQuery} 
                setTextQuery={setTextQuery} 
                filteredTextList={filteredTextList} 
              />
            </div>
          </div>
        )}
        
        <div className="h-16 flex items-center overflow-x-auto hide-scrollbar px-2 gap-1 bg-[#121214]">
          {selectedClip ? (
            <>
              <button onClick={() => selectClip(null)} className="flex flex-col items-center min-w-[50px] text-gray-500">
                <ArrowLeft size={20} />
                <span className="text-[8px] mt-1 font-bold">BACK</span>
              </button>
              <div className="w-px h-8 bg-gray-800 mx-1"></div>
              <ToolIcon icon={Scissors} label="Split" onClick={splitSelectedClip} />
              <ToolIcon icon={Trash2} label="Delete" onClick={deleteSelectedClip} color="text-red-500" />
              {selectedClip.type !== ClipType.AUDIO && <ToolIcon icon={Move} label="Transform" onClick={() => setMobileActiveTool('transform')} active={mobileActiveTool === 'transform'} />}
              {(selectedClip.type === ClipType.AUDIO || selectedClip.type === ClipType.VIDEO) && <ToolIcon icon={Volume2} label="Volume" onClick={() => setMobileActiveTool('volume')} active={mobileActiveTool === 'volume'} />}
              {selectedClip.type !== ClipType.AUDIO && <ToolIcon icon={Sparkles} label="Filters" onClick={() => setMobileActiveTool('filter')} active={mobileActiveTool === 'filter'} />}
              <ToolIcon icon={Copy} label="Duplicate" onClick={() => {}} />
            </>
          ) : (
            MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileDrawerOpen(true); }}
                className={`flex flex-col items-center justify-center min-w-[75px] h-full gap-1 transition-all ${activeTab === item.id && mobileDrawerOpen ? 'text-blue-500' : 'text-gray-500'}`}
              >
                <item.icon size={20} className={activeTab === item.id && mobileDrawerOpen ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : ''} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

const LibraryContent = ({ activeTab, handleImportClick, handleAddSample, filterQuery, setFilterQuery, filteredFiltersList, applyPresetFilter, textQuery, setTextQuery, filteredTextList }: any) => (
  <div className="flex flex-col h-full bg-[#18181a]">
    {activeTab === 'media' && (
      <div className="p-4 grid grid-cols-2 gap-3">
        <button onClick={handleImportClick} className="aspect-video bg-gray-800 rounded flex flex-col items-center justify-center gap-2 border border-gray-700 border-dashed hover:bg-gray-700 transition-all">
          <Plus size={24} className="text-gray-400" />
          <span className="text-xs text-gray-400">Import</span>
        </button>
        <button onClick={() => handleAddSample(ClipType.VIDEO)} className="aspect-video bg-gray-800 rounded relative overflow-hidden hover:opacity-80">
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900"></div>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/50">SAMPLE</span>
        </button>
      </div>
    )}
    {activeTab === 'filters' && (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text" placeholder="Search 200+ filters..."
              className="w-full bg-black border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {filteredFiltersList.map((f: any) => (
              <button key={f.id} onClick={() => applyPresetFilter(f.props)} className="group relative aspect-square bg-[#121212] rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center" style={{ filter: `brightness(${f.props.brightness}) contrast(${f.props.contrast}) saturate(${f.props.saturation}) hue-rotate(${f.props.hueRotate}deg)` }}>
                  <Sparkles size={16} className="text-white/40 mb-1" />
                  <span className="text-[10px] text-white/80 font-medium truncate w-full">{f.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    {activeTab === 'text' && (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input type="text" placeholder="Search 200+ styles..." className="w-full bg-black border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:border-blue-500 outline-none" value={textQuery} onChange={e => setTextQuery(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-2">
            {filteredTextList.map((t: any) => (
              <button key={t.id} onClick={() => handleAddSample(ClipType.TEXT, { ...t.props, name: t.name })} className="w-full p-4 bg-[#121212] rounded-xl border border-gray-800 hover:border-blue-500 transition-all text-center flex flex-col items-center gap-2 group">
                <span style={{ fontFamily: t.props.fontFamily, color: t.props.color, fontWeight: t.props.fontWeight, textShadow: t.props.textShadow, fontSize: '18px' }}>STYLE</span>
                <span className="text-[8px] text-gray-500 font-mono uppercase tracking-tighter">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);

const ToolIcon = ({ icon: Icon, label, onClick, active, color }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center min-w-[65px] h-full gap-1 transition-all active:scale-90 ${active ? 'text-blue-500' : color || 'text-gray-400'}`}>
    <Icon size={18} className={active ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]' : ''} />
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const ControlRow = ({ label, value, min, max, step, onChange, suffix = '' }: any) => (
  <div className="group">
    <div className="flex justify-between text-[10px] mb-1.5 items-center font-bold">
      <span className="text-gray-500 uppercase tracking-tighter">{label}</span>
      <span className="text-blue-400 font-mono">{label === 'Opacity' || label === 'Volume' ? Math.round(value * 100) : Math.round(value)}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer hover:bg-gray-700 accent-blue-600" />
  </div>
);
