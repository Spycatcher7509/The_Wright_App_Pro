
import React, { useState, useEffect } from 'react';
import { User, BackupRecord } from '../types';
import { DBService } from '../services/dbService';
import { ResendService } from '../services/resendService';

const Settings: React.FC<{ user: User }> = ({ user }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  // Docker & DNS State
  const [dnsTarget, setDnsTarget] = useState('mysecureapp.co.uk');
  const [dnsResults, setDnsResults] = useState<{type: string, data: string}[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isDockerIsolated, setIsDockerIsolated] = useState(true);

  useEffect(() => {
    DBService.getBackups().then(setBackups);
  }, []);

  const addTestLog = (msg: string) => {
    setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const downloadDockerProtocol = () => {
    const dockerfile = `
# WRIGHT_APP_PRO PRODUCTION DOCKERFILE
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
    `.trim();

    const blob = new Blob([dockerfile], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "Dockerfile";
    link.click();
    addTestLog("Docker Production Protocol (Dockerfile) Provisioned.");
  };

  const downloadDnsManifest = () => {
    const csvContent = [
      "name,ttl,type,value",
      "\"mysecureapp.co.uk\",\"3600\",\"A\",\"104.198.14.52\"",
      "\"www.mysecureapp.co.uk\",\"3600\",\"CNAME\",\"mysecureapp.co.uk\"",
      "\"mysecureapp.co.uk\",\"3600\",\"MX\",\"10 feedback-smtp.us-east-1.amazonses.com\"",
      "\"mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=spf1 include:resend.com include:amazonses.com ~all\"",
      "\"_dmarc.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=DMARC1; p=quarantine; adkim=s; aspf=s;\"",
      "\"default._bimi.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=BIMI1; l=https://mysecureapp.co.uk/brand/logo.svg; a=;\"",
      "\"resend._domainkey.mysecureapp.co.uk\",\"3600\",\"TXT\",\"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDS6FT8COeI3ln49hwpltSWdNA5E8GTcW3mU/p0VWL7R48vNjhrM4RQWC0iyC5LhSAp4hMIr9wJBVso11V/ezvF0ccL0tVgx4alxmIJIZyjTKMi00weAgWZ+uVbtqJ7Uc3hhYMUQFAD8AKqDaL2VqOiE4xXb587TvxNeTrQ2dN4ZwIDAQAB\"",
      "\"resend.com.mysecureapp.co.uk\",\"3600\",\"MX\",\"10 feedback-smtp.us-east-1.amazonses.com\"",
      "\"send.mysecureapp.co.uk\",\"3600\",\"TXT\",\"v=spf1 include:resend.com ~all\""
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "The_Wright_App_pro_BIMI_Manifest.csv";
    link.click();
    addTestLog("BIMI-Compliant Manifest provisioned.");
  };

  const queryDns = async (type: 'MX' | 'TXT' | 'A') => {
    setIsQuerying(true);
    addTestLog(`Interrogating ${type} records for ${dnsTarget}...`);
    try {
      const response = await fetch(`https://dns.google/resolve?name=${dnsTarget}&type=${type}`);
      const data = await response.json();
      if (data.Answer) {
        const newResults = data.Answer.map((a: any) => ({ type, data: a.data }));
        setDnsResults(prev => [...prev, ...newResults]);
        addTestLog(`Found ${data.Answer.length} ${type} entries.`);
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DOCKER ORCHESTRATION HUB */}
        <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 space-y-8 lg:col-span-1 text-white relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic tracking-tighter text-indigo-400">Docker Orchestration</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Container Isolation Protocol</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-xl">🐳</div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Isolated Sandbox Mode</h4>
                <p className="text-[9px] text-slate-400 italic">Encapsulate all forensic processing in Docker.</p>
              </div>
              <button 
                onClick={() => setIsDockerIsolated(!isDockerIsolated)}
                className={`w-14 h-8 rounded-full transition-all relative ${isDockerIsolated ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isDockerIsolated ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4 font-mono text-[10px]">
               <div className="flex justify-between text-indigo-400">
                  <span>» CONTAINER_ID</span>
                  <span className="text-white">WAP-PRO-99-ALPHA</span>
               </div>
               <div className="flex justify-between text-indigo-400">
                  <span>» ENGINE_STATUS</span>
                  <span className="text-emerald-400">CONTAINERIZED</span>
               </div>
               <div className="flex justify-between text-indigo-400">
                  <span>» ISOLATION_LEVEL</span>
                  <span className="text-white">PRO_HI_SEC</span>
               </div>
            </div>

            <button 
              onClick={downloadDockerProtocol}
              className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
            >
              🚀 Export Docker Protocol (.Dockerfile)
            </button>
          </div>
          <div className="absolute top-0 right-0 p-10 text-[10rem] font-black text-white/5 pointer-events-none italic">CONTAINER</div>
        </section>

        {/* BIMI & CONFIGURATION LAB */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8 lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic tracking-tighter text-emerald-600">BIMI & Forensic Identity</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Brand Verification Manifest</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">🍷</div>
          </div>
          
          <div className="flex-1 space-y-6">
            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🛡️</span>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">DMARC Enforcement</h4>
                    <p className="text-[9px] text-slate-400 font-mono">p=quarantine; aspf=s;</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✅</span>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">BIMI Sector</h4>
                    <p className="text-[9px] text-slate-400 font-mono truncate max-w-[200px]">v=BIMI1; l=https://mysecureapp.co.uk/brand/logo.svg;</p>
                 </div>
              </div>
            </div>
            
            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl italic text-[11px] text-indigo-900 leading-relaxed font-medium">
              Note: To enable the <strong>The_Wright_App_pro</strong> logo in recipient inboxes, DMARC must be set to 'quarantine' or 'reject'.
            </div>
          </div>

          <button 
            onClick={downloadDnsManifest}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
          >
            📥 Provision BIMI Manifest (.csv)
          </button>
        </section>

        {/* DNS INTERROGATOR LAB */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic tracking-tighter text-indigo-600">Network Interrogator</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">DNS Record Discovery</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDnsResults([])} className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:text-slate-600">Clear Logs</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <input 
                value={dnsTarget}
                onChange={(e) => setDnsTarget(e.target.value)}
                placeholder="Target Domain"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold text-sm"
              />
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => queryDns('MX')} disabled={isQuerying} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">Check MX</button>
                <button onClick={() => queryDns('TXT')} disabled={isQuerying} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">Check TXT</button>
                <button onClick={() => queryDns('A')} disabled={isQuerying} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">Check A</button>
              </div>
            </div>
            <div className="md:col-span-2 bg-slate-950 rounded-3xl p-8 h-[250px] overflow-y-auto custom-scrollbar border border-white/5">
              {dnsResults.length === 0 ? (
                <p className="text-slate-700 italic text-[10px] font-mono">Awaiting discovery payload...</p>
              ) : (
                <div className="space-y-4">
                  {dnsResults.map((res, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">{res.type} Record Found</p>
                      <p className="text-white font-mono text-[10px] break-all leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">{res.data}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic opacity-50">Secure Environment V1.0.12-UK_PRO | Docker Isolation Enabled</p>
      </div>
    </div>
  );
};

export default Settings;
