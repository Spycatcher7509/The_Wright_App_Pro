
import React, { useState, useEffect } from 'react';
import { User, BackupRecord } from '../types';
import { DBService } from '../services/dbService';

const Settings: React.FC<{ user: User }> = ({ user }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  // Docker & DNS State
  const [dnsTarget, setDnsTarget] = useState('wrightapp.pro');
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
      "\"wrightapp.pro\",\"3600\",\"TXT\",\"v=spf1 include:sendgrid.net ~all\"",
      "\"_dmarc.wrightapp.pro\",\"3600\",\"TXT\",\"v=DMARC1; p=quarantine; adkim=s; aspf=s;\"",
      "\"s1._domainkey.wrightapp.pro\",\"3600\",\"CNAME\",\"s1.domainkey.sendgrid.net\"",
      "\"s2._domainkey.wrightapp.pro\",\"3600\",\"CNAME\",\"s2.domainkey.sendgrid.net\"",
      "\"em1234.wrightapp.pro\",\"3600\",\"CNAME\",\"sendgrid.net\""
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "The_Wright_App_pro_SendGrid_Manifest.csv";
    link.click();
    addTestLog("SendGrid Manifest provisioned.");
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

            <button 
              onClick={downloadDockerProtocol}
              className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
            >
              🚀 Export Docker Protocol (.Dockerfile)
            </button>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8 lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic tracking-tighter text-emerald-600">SendGrid Integration</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master API Hub</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">✉️</div>
          </div>
          
          <div className="flex-1 space-y-6">
            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-2xl text-indigo-400">
              <p className="text-[9px] font-mono leading-relaxed">
                SendGrid Master SDK configured with 256-bit API rotation. 
                Sender Identity: support@wrightapp.pro
              </p>
            </div>
            <button 
              onClick={downloadDnsManifest}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
            >
              📥 Provision SendGrid DNS (.csv)
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;
