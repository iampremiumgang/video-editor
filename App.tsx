
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { Timeline } from './components/Timeline';
import { EditorProvider, useEditor } from './store/editorContext';
import { AspectRatio, ExportSettings } from './types';
import { Download, Undo, Redo, Plus, Check, X, Play } from 'lucide-react';

const LogoLP = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className} logo-shine`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradL" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF" />
        <stop offset="50%" stopColor="#2979FF" />
        <stop offset="100%" stopColor="#AA00FF" />
      </linearGradient>
      <linearGradient id="gradP" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD600" />
        <stop offset="100%" stopColor="#FF6D00" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Stylized L */}
    <path d="M20 20 V80 H60" stroke="url(#gradL)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    {/* Stylized P with Play circle */}
    <path d="M50 35 C75 35 85 45 85 60 C85 75 75 85 50 85 H50 V35" stroke="url(#gradP)" strokeWidth="10" strokeLinecap="round" />
    <path d="M50 60 H65" stroke="url(#gradP)" strokeWidth="10" strokeLinecap="round" />
    {/* Center Play Icon */}
    <path d="M68 55 L78 60 L68 65 Z" fill="white" />
    {/* Rays */}
    <g stroke="white" strokeWidth="0.5" opacity="0.6" filter="url(#glow)">
      <line x1="45" y1="50" x2="30" y2="30" />
      <line x1="45" y1="50" x2="60" y2="30" />
      <line x1="45" y1="50" x2="30" y2="70" />
    </g>
  </svg>
);

const Header = ({ setShowExport }: { setShowExport: (v: boolean) => void }) => {
  const { undo, redo, project } = useEditor();
  return (
    <header className="h-12 md:h-14 bg-[#18181a] border-b border-gray-800 flex items-center justify-between px-4 z-50 flex-shrink-0">
      <div className="flex items-center gap-3 md:gap-4">
        <LogoLP className="w-7 h-7 md:w-9 md:h-9" />
        <div className="flex flex-col">
            <h1 className="font-bold text-sm md:text-base tracking-tight text-white">Lumina <span className="text-blue-400">Pro</span></h1>
            <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">{project.name || "Untitled"}</span>
        </div>
        
        <div className="h-6 w-px bg-gray-700 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-1 text-gray-400">
          <button onClick={undo} className="p-1.5 hover:bg-gray-800 rounded transition-colors" title="Undo"><Undo size={14} /></button>
          <button onClick={redo} className="p-1.5 hover:bg-gray-800 rounded transition-colors" title="Redo"><Redo size={14} /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs md:text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
          onClick={() => setShowExport(true)}
        >
          <Download size={14} />
          <span className="hidden md:inline">Export</span>
        </button>
      </div>
    </header>
  );
};

const StartupModal = () => {
  const { project, initProject } = useEditor();
  const [name, setName] = useState('New Project');
  const [ratio, setRatio] = useState<AspectRatio>('9:16'); // Default to vertical for mobile

  if (project.isInitialized) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md px-4">
       <div className="bg-[#151517] border border-gray-800 p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"></div>
          <div className="flex flex-col items-center mb-8">
             <LogoLP className="w-20 h-20 mb-4 drop-shadow-[0_0_15px_rgba(41,121,255,0.4)]" />
             <h2 className="text-2xl font-black text-center text-white tracking-tighter">LUMINA <span className="text-blue-500">PRO</span></h2>
             <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Premium Video Suite</p>
          </div>
          
          <div className="space-y-5">
             <div>
               <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Project Name</label>
               <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-3.5 text-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
                  placeholder="My Masterpiece"
               />
             </div>

             <div>
               <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Format & Aspect Ratio</label>
               <div className="grid grid-cols-3 gap-2">
                  {['9:16', '16:9', '1:1', '4:5', '21:9'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRatio(r as AspectRatio)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${ratio === r ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {r}
                    </button>
                  ))}
               </div>
             </div>

             <button 
                onClick={() => initProject(name, ratio)}
                className="w-full py-4 bg-white text-black font-black rounded-xl mt-4 hover:bg-gray-200 transition-all transform active:scale-95 duration-200 uppercase tracking-widest text-sm shadow-xl"
             >
               Create Project
             </button>
          </div>
       </div>
    </div>
  );
};

const ExportModal = ({ onClose }: { onClose: () => void }) => {
    const { project } = useEditor();
    const [settings, setSettings] = useState<ExportSettings>({
        resolution: '1080p',
        fps: 30,
        format: 'mp4'
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = () => {
        setIsExporting(true);
        // Simulate export process
        setTimeout(() => {
            setIsExporting(false);
            alert(`Lumina Pro: Project exported successfully!\nResolution: ${settings.resolution}\nFPS: ${settings.fps}\nSaved to Gallery.`);
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm px-4">
            <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#252525]">
                    <div className="flex items-center gap-2">
                        <LogoLP className="w-5 h-5" />
                        <h3 className="font-bold text-white text-sm">Export Media</h3>
                    </div>
                    <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">RESOLUTION</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['720p', '1080p', '2k', '4k'].map(res => (
                                <button 
                                    key={res}
                                    onClick={() => setSettings(s => ({...s, resolution: res as any}))}
                                    className={`py-2 px-4 rounded text-sm border ${settings.resolution === res ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black border-gray-700 text-gray-400'}`}
                                >
                                    {res.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">FRAME RATE</label>
                        <div className="flex gap-2">
                            {[30, 60].map(fps => (
                                <button 
                                    key={fps}
                                    onClick={() => setSettings(s => ({...s, fps: fps as any}))}
                                    className={`flex-1 py-2 px-4 rounded text-sm border ${settings.fps === fps ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black border-gray-700 text-gray-400'}`}
                                >
                                    {fps} FPS
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                    >
                        {isExporting ? 'Processing Rendering...' : 'Render Video'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const EditorLayout = () => {
  const [showExport, setShowExport] = useState(false);
  
  return (
    <div className="flex flex-col h-full text-gray-300 bg-black font-sans absolute inset-0 overflow-hidden">
      <StartupModal />
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      <Header setShowExport={setShowExport} />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <div className="h-[45vh] md:h-[60%] flex-shrink-0 bg-[#0a0a0a] flex items-center justify-center border-b border-gray-800 relative z-0">
             <Player />
          </div>

          <div className="flex-1 min-h-0 bg-[#1e1e1e] relative z-0 border-t border-gray-800">
            <Timeline />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
