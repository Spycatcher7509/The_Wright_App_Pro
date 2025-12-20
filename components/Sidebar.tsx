
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transcribe', label: 'Transcription Hub', icon: '🎙️' },
    { id: 'logs', label: 'View Logs', icon: '📜' },
    { id: 'tickets', label: 'View Tickets', icon: '🎫' },
    { id: 'support', label: 'Support Hub', icon: '📩' },
    { id: 'diagnostics', label: 'Diagnostics Lab', icon: '🧬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">W</div>
          <span className="font-bold text-white tracking-tight">Wright Engine</span>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/50">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Backup Readiness</p>
          <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            SYNCED
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
