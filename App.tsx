
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { APP_TITLE, INDEMNITY_STATEMENT } from './constants';
import { DBService } from './services/dbService';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TranscriptionHub from './components/TranscriptionHub';
import VoiceHub from './components/VoiceHub';
import GlobalIntercom from './components/GlobalIntercom';
import LogViewer from './components/LogViewer';
import TicketViewer from './components/TicketViewer';
import SupportForm from './components/SupportForm';
import Settings from './components/Settings';
import AuthModal from './components/AuthModal';
import DiagnosticLab from './components/DiagnosticLab';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [agreed, setAgreed] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    const storedAgreement = localStorage.getItem('wright_agreed');
    if (storedAgreement === 'true') setAgreed(true);
  }, []);

  const handleAgree = () => {
    localStorage.setItem('wright_agreed', 'true');
    setAgreed(true);
  };

  const handleDisagree = () => {
    setIsExiting(true);
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 2000);
  };

  if (isExiting) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Programme Terminated</h1>
          <p className="text-slate-400">Exiting system per user disagreement with UK Indemnity terms...</p>
        </div>
      </div>
    );
  }

  if (!agreed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">W</div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight italic">The_Wright_App_pro</h1>
          </div>
          <div className="flex-1 overflow-y-auto mb-8 pr-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 font-medium italic">
            {INDEMNITY_STATEMENT}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleDisagree}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Disagree & Exit
            </button>
            <button 
              onClick={handleAgree}
              className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-100"
            >
              I Agree & Enter System
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onLogin={setUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'transcribe': return <TranscriptionHub user={user} />;
      case 'voice': return <VoiceHub user={user} />;
      case 'intercom': return <GlobalIntercom user={user} />;
      case 'logs': return <LogViewer />;
      case 'tickets': return <TicketViewer />;
      case 'support': return <SupportForm user={user} />;
      case 'diagnostics': return <DiagnosticLab />;
      case 'admin': return <AdminPanel />;
      case 'settings': return <Settings user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={() => setUser(null)}
      />
      <main className="flex-1 overflow-y-auto p-12 relative">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">{activeTab}</h2>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{user.name || user.email}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-lg">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-indigo-600 font-black overflow-hidden">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.email[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
