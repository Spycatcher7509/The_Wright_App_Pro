
import React, { useState, useEffect } from 'react';
import { User, BackupRecord } from '../types';
import { DBService } from '../services/dbService';
import { ResendService } from '../services/resendService';

const Settings: React.FC<{ user: User }> = ({ user }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCorsBlocked, setIsCorsBlocked] = useState(false);
  const [corsProxy, setCorsProxy] = useState(localStorage.getItem('wright_cors_proxy') || '');

  useEffect(() => {
    DBService.getBackups().then(setBackups);
  }, []);

  const handleManualBackup = async () => {
    const path = `/Users/SpikeWright/Backups/Vault_${Date.now()}.sql`;
    await DBService.recordBackup("Manual Backup", path, 'BACKUP');
    DBService.getBackups().then(setBackups);
    alert(`Snapshot Created: ${path}`);
  };

  const saveCorsProxy = () => {
    localStorage.setItem('wright_cors_proxy', corsProxy);
    alert("Relay Gateway Configured.");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple visual feedback could be added here
  };

  const runEmailTest = async () => {
    setTestStatus('LOADING');
    setErrorMessage('');
    setIsCorsBlocked(false);
    
    try {
      const result = await ResendService.testEmail();
      
      await DBService.addLog({
        title: "Resend.com API Integrity Test",
        checksum: result.success ? "AUTH_VERIFIED" : "AUTH_PENDING",
        absolutePath: "/system/api/resend/test.log",
        status: result.success ? 'SUCCESS' : 'FAILURE',
        errorMessage: result.error
      });

      if (result.success) {
        setTestStatus('SUCCESS');
      } else {
        setTestStatus('ERROR');
        setErrorMessage(result.error || "Validation error");
        if (result.isCorsError) setIsCorsBlocked(true);
      }
    } catch (err) {
      setTestStatus('ERROR');
      setErrorMessage(String(err));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Integrity */}
        <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black italic tracking-tighter">Data Integrity</h3>
            <button onClick={handleManualBackup} className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 italic">Run Snapshot</button>
          </div>
          <div className="space-y-4">
             {backups.slice(-2).map(b => (
               <div key={b.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                 <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-slate-900 truncate">{b.path}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{b.timestamp}</p>
                 </div>
                 <span className="text-[9px] font-black uppercase bg-white px-3 py-1 rounded-full border border-slate-200">OK</span>
               </div>
             ))}
          </div>
        </section>

        {/* CORS Relay Gateway */}
        <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tighter">CORS Relay Gateway</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Circumvent Browser Restrictions</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Proxy Agent URL</label>
              <input 
                value={corsProxy}
                onChange={(e) => setCorsProxy(e.target.value)}
                placeholder="https://cors-anywhere.herokuapp.com/"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all text-xs font-mono"
              />
            </div>
            <button 
              onClick={saveCorsProxy}
              className="w-full py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl"
            >
              Update Relay Configuration
            </button>
          </div>
        </section>

        {/* SMTP Protocol Section */}
        <section className="bg-slate-950 p-10 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-8 lg:col-span-1">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-white">SMTP Configuration</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Resend Outbound Protocol Reference</p>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Host', value: 'smtp.resend.com' },
              { label: 'Port', value: '465 (SSL) / 587 (TLS)' },
              { label: 'User', value: 'resend' },
              { label: 'Password', value: '••••••••••••••••' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{item.label}</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-indigo-300">
                    {item.value}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(item.value)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                    title="Copy to Clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <p className="text-[10px] text-indigo-300 leading-relaxed italic">
              Note: This browser-based suite uses the <strong>REST API</strong> for dispatch. SMTP is provided here for your backend integration reference.
            </p>
          </div>
        </section>

        {/* API Integration Diagnostics */}
        <section className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl space-y-10 lg:col-span-1">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white italic tracking-tighter">REST Gateway Lab</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Verify the active API handshake status. This ensures your RESEND_API_KEY is authorised for the current domain.
            </p>
            <div className="flex-1 bg-black/20 rounded-2xl p-6 font-mono text-[10px] text-indigo-200 space-y-1">
              <p>PROTOCOL: HTTPS / REST</p>
              <p>ENDPOINT: api.resend.com/emails</p>
              <p>STATUS: <span className={testStatus === 'SUCCESS' ? 'text-emerald-300' : 'text-indigo-100'}>{testStatus}</span></p>
              {errorMessage && <p className="text-rose-300 mt-2 truncate">ERR: {errorMessage}</p>}
            </div>
            <button 
              onClick={runEmailTest}
              disabled={testStatus === 'LOADING'}
              className="w-full py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50"
            >
              {testStatus === 'LOADING' ? 'Handshaking...' : 'Execute API Handshake'}
            </button>
          </div>
        </section>
      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic opacity-50">Secure Environment V1.0.8-UK_PRO</p>
      </div>
    </div>
  );
};

export default Settings;
