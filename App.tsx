
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
import UserGuide from './components/UserGuide';
import UserProfile from './components/UserProfile';
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
  const [atomTime, setAtomTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
  // Gate States
  const [gateChoice, setGateChoice] = useState<'NONE' | 'ACCEPT' | 'DECLINE'>('NONE');
  const [isTicked, setIsTicked] = useState<boolean>(false);

  useEffect(() => {
    const storedAgreement = localStorage.getItem('wright_agreed');
    if (storedAgreement === 'true') setAgreed(true);
    
    // Check for API Key Bridge availability
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAtomTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = () => {
    if (!isTicked) return;
    if (gateChoice === 'ACCEPT') {
      localStorage.setItem('wright_agreed', 'true');
      setAgreed(true);
    } else if (gateChoice === 'DECLINE') {
      setIsExiting(true);
      setTimeout(() => {
        window.location.href = "about:blank";
      }, 3000);
    }
  };

  const handleKeyBridge = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Proceed to app after trigger
    }
  };

  if (isExiting) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white font-serif">
        <div className="text-center space-y-6 animate-pulse">
          <h1 className="text-4xl font-black italic tracking-tighter">See you next time?</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em]">Connection Terminated by Client</p>
        </div>
      </div>
    );
  }

  // Mandatory Key Selection for Pro Features
  if (agreed && !hasApiKey && window.aistudio) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-12 text-center space-y-8 border border-slate-200">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto shadow-xl">🍷</div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Secure Vault Handshake</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              To utilise Gemini 3 Pro and Native Voice engines, you must select an authorised API key from a paid GCP project.
            </p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-indigo-600 font-black uppercase hover:underline">View Billing Documentation</a>
          </div>
          <button 
            onClick={handleKeyBridge}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl"
          >
            Connect Secure Vault
          </button>
        </div>
      </div>
    );
  }

  if (!agreed) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-12 overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-indigo-200">🍷</div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">The_Wright_App_pro</h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Forensic Entry Protocol V2 | Military Grade Encryption</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-8 pr-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-700 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 font-mono italic custom-scrollbar">
            {INDEMNITY_STATEMENT}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
               <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${gateChoice === 'ACCEPT' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                  <input 
                    type="radio" 
                    name="gate" 
                    className="w-5 h-5 text-indigo-600 focus:ring-0" 
                    checked={gateChoice === 'ACCEPT'}
                    onChange={() => setGateChoice('ACCEPT')}
                  />
                  <span className="font-bold text-slate-900 text-sm">I Accept & Indemnify Spike Wright</span>
               </label>
               <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${gateChoice === 'DECLINE' ? 'bg-rose-50 border-rose-600' : 'bg-white border-slate-100 hover:border-rose-100'}`}>
                  <input 
                    type="radio" 
                    name="gate" 
                    className="w-5 h-5 text-rose-600 focus:ring-0" 
                    checked={gateChoice === 'DECLINE'}
                    onChange={() => setGateChoice('DECLINE')}
                  />
                  <span className="font-bold text-slate-900 text-sm">I Do Not Accept (System Termination)</span>
               </label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-100/50 rounded-2xl border border-slate-100">
              <input 
                type="checkbox" 
                id="tickbox"
                className="mt-1 w-4 h-4 rounded text-indigo-600 cursor-pointer" 
                checked={isTicked}
                onChange={(e) => setIsTicked(e.target.checked)}
              />
              <label htmlFor="tickbox" className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-normal cursor-pointer">
                I acknowledge that this agreement is binding under UK Law and that I am entering a secure forensic environment protected by Military Grade Cascade encryption.
              </label>
            </div>

            <button 
              onClick={handleAction}
              disabled={gateChoice === 'NONE' || !isTicked}
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-[0.98] ${
                !isTicked || gateChoice === 'NONE'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : gateChoice === 'ACCEPT'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100'
              }`}
            >
              {gateChoice === 'DECLINE' ? 'Execute Programme Termination' : 'Authorise Entry'}
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
      case 'profile': return <UserProfile user={user} onUpdate={setUser} />;
      case 'transcribe': return <TranscriptionHub user={user} />;
      case 'voice': return <VoiceHub user={user} />;
      case 'intercom': return <GlobalIntercom user={user} />;
      case 'guide': return <UserGuide user={user} />;
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
        hasApiKey={hasApiKey}
      />
      <main className="flex-1 overflow-y-auto p-12 relative">
        <header className="flex flex-col items-center mb-16 text-center">
          <div className="space-y-3">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none drop-shadow-sm">
              {APP_TITLE}
            </h1>
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-3 px-6 py-2.5 bg-white rounded-full border border-slate-200 shadow-sm shadow-indigo-100/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                <p className="text-[10px] font-mono font-black text-slate-900 tracking-[0.25em] uppercase">
                  Atom Time: <span className="text-indigo-600">{atomTime}</span>
                </p>
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
