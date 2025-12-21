
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  hasApiKey?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, hasApiKey }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Identity', icon: '👤' },
    { id: 'transcribe', label: 'Transcription Hub', icon: '🎙️' },
    { id: 'voice', label: 'Voice Lab', icon: '🗣️' },
    { id: 'intercom', label: 'Secure Intercom', icon: '📡' },
    { id: 'guide', label: 'User Guide', icon: '📚' },
    { id: 'logs', label: 'View Logs', icon: '📜' },
    { id: 'tickets', label: 'View Tickets', icon: '🎫' },
    { id: 'support', label: 'Support Hub', icon: '📩' },
    { id: 'diagnostics', label: 'Diagnostics Lab', icon: '🧬' },
    { id: 'admin', label: 'Command Centre', icon: '🛠️', roleRequired: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'settings', label: 'System Configuration', icon: '⚙️', roleRequired: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!item.roleRequired) return true;
    if (Array.isArray(item.roleRequired)) {
      return item.roleRequired.includes(user.role);
    }
    return item.roleRequired === user.role;
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">W</div>
          <span className="font-bold text-white tracking-tight italic">Wright_App_pro</span>
        </div>
        
        <nav className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1" style={{maxHeight: 'calc(100vh - 380px)'}}>
          {filteredMenu.map((item) => (
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

      <div className="mt-auto p-6 border-t border-slate-800 space-y-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Vault Link Status</p>
          <div className={`flex items-center gap-2 text-xs font-bold ${hasApiKey ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            {hasApiKey ? 'TUNNEL_ENCRYPTED' : 'KEY_NOT_SELECTED'}
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Intercom Status</p>
          <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            GATEWAY_OPEN
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
