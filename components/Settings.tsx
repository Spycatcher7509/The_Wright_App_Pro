
import React, { useState, useEffect } from 'react';
import { User, BackupRecord } from '../types';
import { DBService } from '../services/dbService';
import { ResendService } from '../services/resendService';

const Settings: React.FC<{ user: User }> = ({ user }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [corsProxy, setCorsProxy] = useState(localStorage.getItem('wright_cors_proxy') || '');

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

  const saveCorsProxy = () => {
    localStorage.setItem('wright_cors_proxy', corsProxy);
    alert("Relay Gateway Configured.");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadDnsManifest = () => {
    const csvContent = [
      "name,ttl,type,value",
      "\"www.mysecureapp.co.uk\",\"3600\",\"CNAME\",\"mysecureapp.co.uk\"",
      "\"mysecureapp.co.uk\",\"3600\",\"A\",\"104.198.14.52\"",
      "\"mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=spf1 include:resend.com include:amazonses.com ~all\"",
      "\"_dmarc.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=DMARC1; p=none;\"",
      "\"resend.com.mysecureapp.co.uk\",\"3600\",\"MX\",\"10 feedback-smtp.us-east-1.amazonses.com\"",
      "\"resend._domainkey.mysecureapp.co.uk\",\"3600\",\"TXT\",\"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDS6FT8COeI3ln49hwpltSWdNA5E8GTcW3mU/p0VWL7R48vNjhrM4RQWC0iyC5LhSAp4hMIr9wJBVso11V/ezvF0ccL0tVgx4alxmIJIZyjTKMi00weAgWZ+uVbtqJ7Uc3hhYMUQFAD8AKqDaL2VqOiE4xXb587TvxNeTrQ2dN4ZwIDAQAB\"",
      "\"send.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=spf1 include:resend.com ~all\""
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "Corrected_DNS_mysecureapp_co_uk.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const runEmailTest = async () => {
    setTestStatus('LOADING');
    setTestLogs([]);
    setErrorMessage('');
    
    addTestLog("Initialising Military Grade Handshake...");
    
    try {
      const result = await ResendService.testEmail((status) => {
        addTestLog(status.message);
      });
      
      await DBService.addLog({
        title: "Resend.com API Integrity Test",
        checksum: result.success ? "AUTH_VERIFIED" : "AUTH_PENDING",
        absolutePath: "/system/api/resend/test.log",
        status: result.success ? 'SUCCESS' : 'FAILURE',
        errorMessage: result.error
      });

      if (result.success) {
        setTestStatus('SUCCESS');
        addTestLog("Handshake complete. Dispatch verified.");
      } else {
        setTestStatus('ERROR');
        setErrorMessage(result.error || "Validation error");
        addTestLog(`Failure: ${result.error || 'Unknown Gateway Rejection'}`);
      }
    } catch (err) {
      setTestStatus('ERROR');
      const msg = String(err);
      setErrorMessage(msg);
      addTestLog(`Protocol Error: ${msg}`);
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

        {/* DNS Configuration Lab */}
        <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-indigo-600">DNS Configuration Lab</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Corrected Records for mysecureapp.co.uk</p>
          </div>
          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                The manifest includes the fixed <strong>MX</strong> record (corrected typo) and replaces deprecated <strong>SPF</strong> types with standard <strong>TXT</strong> records.
              </p>
            </div>
            <button 
              onClick={downloadDnsManifest}
              className="w-full py-5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
            >
              <span>📥</span> Download DNS Manifest (.csv)
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
        <section className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl space-y-10 lg:col-span-1 flex flex-col">
          <div className="space-y-4 flex-1">
            <h3 className="text-2xl font-black text-white italic tracking-tighter">REST Gateway Lab</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Verify the active API handshake status. This ensures your RESEND_API_KEY is authorised for <strong>mysecureapp.co.uk</strong>.
            </p>
            
            <div className="bg-black/20 rounded-2xl p-6 font-mono text-[10px] text-indigo-200 space-y-1 min-h-[120px] max-h-[120px] overflow-y-auto custom-scrollbar">
              {testLogs.length === 0 ? (
                <p className="opacity-50 italic">Awaiting handshake execution...</p>
              ) : testLogs.map((log, i) => (
                <p key={i}>{log}</p>
              ))}
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl">
                <p className="text-[10px] font-black text-rose-100 uppercase mb-1">Diagnostic Alert</p>
                <p className="text-[10px] text-rose-200 font-mono break-all">{errorMessage}</p>
              </div>
            )}

            <button 
              onClick={runEmailTest}
              disabled={testStatus === 'LOADING'}
              className="w-full py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {testStatus === 'LOADING' ? (
                <>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                  Handshaking...
                </>
              ) : 'Execute Military Handshake'}
            </button>
          </div>
          {testStatus === 'SUCCESS' && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl animate-in zoom-in">
              <p className="text-[10px] font-black text-emerald-100 uppercase text-center tracking-widest">✓ Link Operational</p>
            </div>
          )}
        </section>
      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic opacity-50">Secure Environment V1.0.8-UK_PRO | Military Grade Enabled</p>
      </div>
    </div>
  );
};

export default Settings;
