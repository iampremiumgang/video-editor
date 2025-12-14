import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { Timeline } from './components/Timeline';
import { EditorProvider, useEditor } from './store/editorContext';
import { AspectRatio, ExportSettings } from './types';
import { Download, MonitorPlay, Undo, Redo, Plus, Check, X } from 'lucide-react';

const Header = ({ setShowExport }: { setShowExport: (v: boolean) => void }) => {
  const { undo, redo, project } = useEditor();
  return (
    <header className="h-12 md:h-14 bg-[#18181a] border-b border-gray-800 flex items-center justify-between px-4 z-50 flex-shrink-0">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
          <MonitorPlay size={16} className="text-white" />
        </div>
        <div className="flex flex-col">
            <h1 className="font-bold text-xs md:text-sm tracking-tight text-gray-100">Lumina <span className="text-gray-500 font-normal hidden md:inline">Editor</span></h1>
            <span className="text-[9px] md:text-[10px] text-gray-500">{project.name || "Untitled"} ({project.ratio})</span>
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
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-md px-4">
       <div className="bg-[#1e1e1e] border border-gray-700 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-sm animate-fade-in">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-blue-500/20">
                <Plus size={32} className="text-white" />
              </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 text-white">Create Project</h2>
          
          <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 mb-1">PROJECT NAME</label>
               <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none transition-all"
                  placeholder="My Awesome Video"
               />
             </div>

             <div>
               <label className="block text-xs font-bold text-gray-400 mb-2">ASPECT RATIO</label>
               <div className="grid grid-cols-3 gap-2">
                  {['9:16', '16:9', '1:1', '4:5', '21:9'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRatio(r as AspectRatio)}
                      className={`p-2 rounded border text-sm transition-all ${ratio === r ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {r}
                    </button>
                  ))}
               </div>
             </div>

             <button 
                onClick={() => initProject(name, ratio)}
                className="w-full py-3 bg-white text-black font-bold rounded mt-4 hover:bg-gray-200 transition-colors transform active:scale-95 duration-200"
             >
               Start Editing
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
            alert(`Project exported successfully!\nResolution: ${settings.resolution}\nFPS: ${settings.fps}\nRatio: ${project.ratio}\nSaved to Gallery.`);
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm px-4">
            <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#252525]">
                    <h3 className="font-bold text-white">Export Video</h3>
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
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">ASPECT RATIO (LOCKED)</label>
                        <div className="py-2 px-4 rounded bg-black border border-gray-700 text-gray-400 text-sm flex justify-between items-center">
                            <span>{project.ratio}</span>
                            <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded">Project Setting</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all"
                    >
                        {isExporting ? 'Rendering...' : 'Export Video'}
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
        {/* Sidebar - Desktop Only (Hidden on Mobile) */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Top Half: Player (Preview Screen) - Adjusted for Mobile/Desktop Split */}
          <div className="h-[45vh] md:h-[60%] flex-shrink-0 bg-[#0a0a0a] flex items-center justify-center border-b border-gray-800 relative z-0">
             <Player />
          </div>

          {/* Bottom Half: Timeline (Flexible height) */}
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