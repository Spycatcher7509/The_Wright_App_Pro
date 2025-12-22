
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
    <div className="space-y-8 animate-in fade-in duration-500">
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
            <p className="text-[9px] text-slate-400 italic text-center px-4">
              Tip: Use a proxy like "cors-anywhere" for local testing. In production, use a Netlify Function.
            </p>
          </div>
        </section>

        {/* API Integration */}
        <section className="lg:col-span-2 bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl space-y-10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-4 max-w-xl">
              <h3 className="text-3xl font-black text-white italic tracking-tighter">Resend.com Integrity Handshake</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Perform a bitwise security diagnostic of the outbound email gateway. This test ensures your API key is correctly mapped and the relay tunnel is established.
              </p>
              <button 
                onClick={runEmailTest}
                disabled={testStatus === 'LOADING'}
                className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  testStatus === 'SUCCESS' ? 'bg-emerald-500 text-white' : 
                  testStatus === 'ERROR' ? 'bg-rose-600 text-white' :
                  testStatus === 'LOADING' ? 'bg-slate-700 text-slate-400 animate-pulse' :
                  'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {testStatus === 'LOADING' ? 'Handshaking...' : testStatus === 'SUCCESS' ? 'Protocol Verified' : testStatus === 'ERROR' ? 'Handshake Failed' : 'Execute Diagnostic'}
              </button>
            </div>
            
            <div className="flex-1 bg-black/40 rounded-[2rem] p-8 border border-white/5 font-mono text-[10px] text-indigo-300 space-y-2">
              <p className="text-slate-500"># System Outbound Manifest</p>
              <p>GATEWAY: api.resend.com</p>
              <p>RELAY: {corsProxy || 'DIRECT_LINK'}</p>
              <p>STATUS: {testStatus}</p>
              {errorMessage && <p className="text-rose-400 mt-4">ERROR_TRACE: {errorMessage}</p>}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-12 text-9xl font-black text-white/5 pointer-events-none italic">API</div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
