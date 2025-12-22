
import React, { useState, useEffect } from 'react';
import { User, BackupRecord } from '../types';
import { DBService } from '../services/dbService';
import { ResendService } from '../services/resendService';

const Settings: React.FC<{ user: User }> = ({ user }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // DNS Interrogator State
  const [dnsTarget, setDnsTarget] = useState('mysecureapp.co.uk');
  const [dnsResults, setDnsResults] = useState<{type: string, data: string}[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    DBService.getBackups().then(setBackups);
  }, []);

  const addTestLog = (msg: string) => {
    setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleManualBackup = async () => {
    const path = `/Users/SpikeWright/Backups/Vault_${Date.now()}.sql`;
    await DBService.recordBackup("Manual Backup", path, 'BACKUP');
    DBService.getBackups().then(setBackups);
    alert(`Snapshot Created: ${path}`);
  };

  const downloadDnsManifest = () => {
    // CORRECTED RECORDS - Fixing typos and standardizing regions
    const csvContent = [
      "name,ttl,type,value",
      "\"mysecureapp.co.uk\",\"3600\",\"A\",\"104.198.14.52\"",
      "\"www.mysecureapp.co.uk\",\"3600\",\"CNAME\",\"mysecureapp.co.uk\"",
      "\"mysecureapp.co.uk\",\"3600\",\"MX\",\"10 feedback-smtp.us-east-1.amazonses.com\"",
      "\"mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=spf1 include:resend.com include:amazonses.com ~all\"",
      "\"_dmarc.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=DMARC1; p=none;\"",
      "\"resend._domainkey.mysecureapp.co.uk\",\"3600\",\"TXT\",\"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDS6FT8COeI3ln49hwpltSWdNA5E8GTcW3mU/p0VWL7R48vNjhrM4RQWC0iyC5LhSAp4hMIr9wJBVso11V/ezvF0ccL0tVgx4alxmIJIZyjTKMi00weAgWZ+uVbtqJ7Uc3hhYMUQFAD8AKqDaL2VqOiE4xXb587TvxNeTrQ2dN4ZwIDAQAB\"",
      "\"resend.com.mysecureapp.co.uk\",\"3600\",\"MX\",\"10 feedback-smtp.us-east-1.amazonses.com\"",
      "\"send.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=spf1 include:resend.com ~all\""
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "The_Wright_App_pro_DNS_Corrected.csv";
    link.click();
    URL.revokeObjectURL(url);
    addTestLog("Corrected CSV Manifest provisioned for mysecureapp.co.uk");
  };

  const queryDns = async (type: 'MX' | 'TXT' | 'A') => {
    setIsQuerying(true);
    addTestLog(`Interrogating ${type} records for ${dnsTarget}...`);
    try {
      const response = await fetch(`https://dns.google/resolve?name=${dnsTarget}&type=${type}`);
      const data = await response.json();
      
      if (data.Answer) {
        const newResults = data.Answer.map((a: any) => ({
          type: type,
          data: a.data
        }));
        setDnsResults(prev => [...prev, ...newResults]);
        addTestLog(`Found ${data.Answer.length} ${type} entries.`);
      } else {
        addTestLog(`No ${type} entries found for ${dnsTarget}.`);
      }
    } catch (err) {
      addTestLog(`Interrogation Failed: ${String(err)}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const clearDns = () => {
    setDnsResults([]);
    addTestLog("DNS Interrogator Cache Cleared.");
  };

  const runEmailTest = async () => {
    setTestStatus('LOADING');
    setTestLogs([]);
    setErrorMessage('');
    addTestLog("Initialising E2E Dispatch Probe...");
    try {
      const result = await ResendService.testEmail((status) => addTestLog(status.message));
      if (result.success) {
        setTestStatus('SUCCESS');
        addTestLog("Handshake complete. Domain verified.");
      } else {
        setTestStatus('ERROR');
        setErrorMessage(result.error || "Gateway Rejection");
      }
    } catch (err) {
      setTestStatus('ERROR');
      addTestLog(`Protocol Error: ${String(err)}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DNS INTERROGATOR LAB */}
        <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-8 lg:col-span-1">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-indigo-600">DNS Interrogator</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Real-time MX/TXT Discovery</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-2">
              <input 
                value={dnsTarget}
                onChange={(e) => setDnsTarget(e.target.value)}
                placeholder="Domain (e.g. netlify.com)"
                className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold"
              />
              <button 
                onClick={clearDns}
                className="px-6 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => queryDns('MX')} disabled={isQuerying} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">Check MX</button>
              <button onClick={() => queryDns('TXT')} disabled={isQuerying} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">Check TXT</button>
              <button onClick={() => queryDns('A')} disabled={isQuerying} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">Check A</button>
            </div>

            <div className="bg-slate-950 rounded-2xl p-6 h-64 overflow-y-auto custom-scrollbar border border-white/5">
              {dnsResults.length === 0 ? (
                <p className="text-slate-600 italic text-[10px]">Awaiting interrogation payload...</p>
              ) : (
                <div className="space-y-4">
                  {dnsResults.map((res, i) => (
                    <div key={i} className="space-y-1 group">
                      <p className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">{res.type} Record</p>
                      <p className="text-white font-mono text-[10px] break-all leading-relaxed bg-white/5 p-2 rounded-lg border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                        {res.data}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DNS FIX & MANIFEST */}
        <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-8 lg:col-span-1 flex flex-col">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-emerald-600">Configuration Lab</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Resend Correction Manifest</p>
          </div>
          
          <div className="flex-1 space-y-6">
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] space-y-4">
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Audit Fixes applied:</h4>
              <ul className="text-[11px] text-emerald-900 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-[8px] font-black">✓</span>
                  Fixed typo: <strong>eedback</strong> → <strong>feedback</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-[8px] font-black">✓</span>
                  Converted deprecated <strong>SPF</strong> records to <strong>TXT</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-[8px] font-black">✓</span>
                  Aligned all regions to <strong>us-east-1</strong>
                </li>
              </ul>
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl italic text-[11px] text-slate-500">
              Note: Download this CSV and import it into your domain provider (e.g. GoDaddy, Namecheap) to resolve Resend validation errors.
            </div>
          </div>

          <button 
            onClick={downloadDnsManifest}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
          >
            📥 Download Corrected CSV Manifest
          </button>
        </section>

        {/* LOGS & DIAGNOSTICS */}
        <section className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl space-y-10 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white italic tracking-tighter">System Diagnostic Feed</h3>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">REST Gateway Protocol Log</p>
            </div>
            <button 
              onClick={runEmailTest}
              disabled={testStatus === 'LOADING'}
              className="px-8 py-3 bg-white text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all"
            >
              {testStatus === 'LOADING' ? 'Probing...' : 'Execute Protocol Probe'}
            </button>
          </div>
          
          <div className="bg-black/20 rounded-3xl p-8 font-mono text-[11px] text-indigo-100 space-y-1 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
            {testLogs.length === 0 ? (
              <p className="opacity-50 italic">Awaiting diagnostic sequence...</p>
            ) : testLogs.map((log, i) => (
              <p key={i} className="border-l border-indigo-500/30 pl-4 py-0.5">
                <span className="text-indigo-400 opacity-50 mr-2">»</span>
                {log}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
             {backups.slice(-2).map(b => (
               <div key={b.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                 <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-white truncate">{b.path}</p>
                    <p className="text-[9px] text-indigo-300 font-mono opacity-60">{b.timestamp}</p>
                 </div>
                 <span className="text-[9px] font-black uppercase bg-indigo-500 text-white px-3 py-1 rounded-full shadow-lg">SNAPSHOT</span>
               </div>
             ))}
          </div>
        </section>

      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic opacity-50">Secure Environment V1.0.10-UK_PRO | The_Wright_App_pro</p>
      </div>
    </div>
  );
};

export default Settings;
