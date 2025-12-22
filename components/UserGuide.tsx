
import React, { useState } from 'react';
import { User } from '../types';

const UserGuide: React.FC<{ user: User }> = ({ user }) => {
  // Fix: UserRole does not contain 'ADMIN', it uses 'LOCAL_ADMIN' or 'SUPER_ADMIN'
  const isAdmin = user.role === 'LOCAL_ADMIN' || user.role === 'SUPER_ADMIN';
  const [activeSection, setActiveSection] = useState('overview');

  const standardSections = [
    { id: 'overview', title: 'System Overview', icon: '🌐' },
    { id: 'transcription', title: 'Transcription Protocols', icon: '🎙️' },
    { id: 'voice', title: 'Voice Lab Operations', icon: '🗣️' },
    { id: 'intercom', title: 'Intercom Etiquette', icon: '📡' },
    { id: 'export', title: 'Asset Provisioning', icon: '📦' },
  ];

  const adminSections = [
    { id: 'identities', title: 'Identity Provisioning', icon: '🛠️' },
    { id: 'forensics', title: 'Log Database & Integrity', icon: '📜' },
    { id: 'diagnostics', title: 'System Diagnostics', icon: '🧬' },
    { id: 'compliance', title: 'UK Legal Compliance', icon: '⚖️' },
  ];

  const sections = isAdmin ? [...standardSections, ...adminSections] : standardSections;

  return (
    <div className="flex gap-8 h-[calc(100vh-250px)] animate-in fade-in duration-500">
      {/* Table of Contents */}
      <div className="w-72 flex flex-col gap-4">
        <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-xl h-full flex flex-col">
          <h4 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-6 border-b border-slate-800 pb-4">User Guide Manual</h4>
          <nav className="space-y-1 flex-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeSection === s.id 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{s.icon}</span>
                {s.title}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-800 mt-auto">
            <p className="text-[9px] text-slate-600 font-mono uppercase">Version 1.0.8-GB</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-10 overflow-y-auto custom-scrollbar">
          {activeSection === 'overview' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">The_Wright_App_pro: User Guide</h3>
                <p className="text-slate-500 font-medium">Authorised Operational Intelligence for the Wright Engine Ecosystem.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h5 className="font-black text-indigo-600 text-[10px] uppercase tracking-widest mb-3">Core Mission</h5>
                  <p className="text-sm text-slate-700 leading-relaxed font-serif">Providing high-performance, verbatim forensic analysis and secure real-time vocal links for professionals requiring absolute data integrity.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h5 className="font-black text-emerald-600 text-[10px] uppercase tracking-widest mb-3">Data Sovereignty</h5>
                  <p className="text-sm text-slate-700 leading-relaxed font-serif">All transcriptions are checksum-verified (SHA-512) and logged locally. The Developer (Spike Wright) ensures local-first compliance with UK law.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'transcription' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">🎙️ Transcription Protocols</h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">The Transcription Hub is the engine's primary verbatim extraction site. It supports YouTube streams, local audio files, and video assets.</p>
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 my-6 rounded-r-2xl">
                  <h6 className="text-indigo-900 font-black text-[10px] uppercase tracking-widest mb-2">Operational Tip</h6>
                  <p className="text-sm text-indigo-800 italic">For 100% accuracy, ensure the "Forensic Handshake" completes before attempting to provision assets. The engine requires a full analysis of the audio buffer for word-for-word fidelity.</p>
                </div>
                <ul className="space-y-4 text-sm text-slate-700 font-medium">
                  <li className="flex gap-4">
                    <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black">1</span>
                    <span>Input the YouTube URL or upload a local master file (.wav/.mp3/.mp4).</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black">2</span>
                    <span>Wait for the <strong>Verbatim Stream</strong> to populate the analysis window.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black">3</span>
                    <span>Utilise the <strong>SHA-512 Secure Vault</strong> to ask forensic questions about the data.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'voice' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">🗣️ Voice Lab Operations</h3>
              <p className="text-slate-600 leading-relaxed">The Voice Lab utilises the Gemini 2.5 Native Audio (Live API) to provide low-latency, vocal interaction with the Wright Engine.</p>
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h6 className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4">Establishing a Link</h6>
                <div className="space-y-4 text-sm font-medium opacity-90">
                  <p>1. Ensure your microphone is authorised in system settings.</p>
                  <p>2. Click <strong>Establish Secure Link</strong> to begin the WebSocket handshake.</p>
                  <p>3. Monitor the <strong>Vocal Pulse Visualiser</strong> to confirm audio ingestion.</p>
                </div>
                <div className="absolute top-0 right-0 p-8 text-7xl font-black text-white/5">NATIVE</div>
              </div>
              <p className="text-[11px] text-slate-400 italic mt-6">Note: The Voice Lab strictly enforces British English (GB) spelling in its responses to maintain professional standardisation.</p>
            </div>
          )}

          {activeSection === 'intercom' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">📡 Secure Intercom Etiquette</h3>
              <p className="text-slate-600 leading-relaxed">All interpersonal communication within the Intercom is encrypted using a SHA-512 cipher. This link is for the dispatch of forensic assets and high-priority logistics.</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-6 p-6 border-2 border-slate-50 rounded-3xl">
                  <span className="text-3xl">📁</span>
                  <div>
                    <h6 className="font-bold text-slate-900">Asset Dispatch</h6>
                    <p className="text-xs text-slate-500">Use the paperclip icon to transmit binary data or transcriptions to other authorised identities.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 border-2 border-slate-50 rounded-3xl">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h6 className="font-bold text-slate-900">Link Integrity</h6>
                    <p className="text-xs text-slate-500">The integrity percentage reflects the health of the encrypted tunnel. If it drops below 90%, terminate the link immediately.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'export' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">📦 Asset Provisioning</h3>
              <p className="text-slate-600 leading-relaxed">Once a verbatim stream is captured, you may provision the following signed assets:</p>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-6 bg-indigo-600 text-white rounded-3xl">
                  <h6 className="font-black text-[10px] uppercase mb-2">Forensic PDF</h6>
                  <p className="text-xs opacity-80">Wrapped with SHA-512 signatures and GB-Date timestamps.</p>
                </div>
                <div className="p-6 bg-slate-800 text-white rounded-3xl">
                  <h6 className="font-black text-[10px] uppercase mb-2">JSON Stream</h6>
                  <p className="text-xs opacity-80">Optimised for machine-readable ingestion into external databases.</p>
                </div>
                <div className="p-6 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl">
                  <h6 className="font-black text-[10px] uppercase mb-2 text-indigo-600">Markdown</h6>
                  <p className="text-xs text-slate-500">Professional documentation format for technical wikis.</p>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SECTIONS */}
          {activeSection === 'identities' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">🛠️ Administrator: Identity Provisioning</h3>
              <p className="text-slate-600 leading-relaxed">As an Administrator, you are responsible for the lifecycle of system identities in the **Command Centre**.</p>
              <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                <p className="text-sm text-slate-700 font-bold">Standard Procedures:</p>
                <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li><strong>New User:</strong> Identities are provisioned with the "OnePassword" default. Users MUST change this upon first handshake.</li>
                  <li><strong>Security Groups:</strong> Ensure users are assigned to the correct group (Standard, Admin, Super Admin) to prevent privilege escalation.</li>
                  <li><strong>Identity Revocation:</strong> Revoked identities are purged from the local SQLite database instantly.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'forensics' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">📜 Log Database & Integrity</h3>
              <p className="text-slate-600 leading-relaxed">The **View Logs** module allows for the verification of every transcription ever performed by the Wright Engine.</p>
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl">
                <h6 className="text-amber-900 font-black text-[10px] uppercase tracking-widest mb-2">Forensic Verification Protocol</h6>
                <p className="text-sm text-amber-800">To verify an asset, copy its SHA-256 checksum and input it into the "Verify Checksum" field. The system will cross-reference the local storage to confirm the asset's integrity has not been tampered with post-extraction.</p>
              </div>
            </div>
          )}

          {activeSection === 'diagnostics' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">🧬 Diagnostic Execution</h3>
              <p className="text-slate-600 leading-relaxed">The **Diagnostics Lab** should be run after every system update or if the "Resend Support Gateway" reports a CORS intercept.</p>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] font-mono text-xs text-indigo-300">
                <p># WRIGHT_ENGINE_DIAG_SEQ</p>
                <p># Checking SQLite Persistence... OK</p>
                <p># Validating API Key Authority... OK</p>
                <p className="text-amber-400"># Warning: CORS Policy Detected (Browser Security Model)</p>
              </div>
            </div>
          )}

          {activeSection === 'compliance' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">⚖️ UK Legal Compliance</h3>
              <p className="text-slate-600 leading-relaxed">The_Wright_App_pro is built with specific adherence to United Kingdom statutes:</p>
              <div className="grid grid-cols-2 gap-8 text-xs font-medium text-slate-500">
                <div className="space-y-2">
                  <p className="text-slate-900 font-black uppercase">Unfair Contract Terms Act 1977</p>
                  <p>Our Indemnity Statement is structured to protect Spike Wright (Developer) while maintaining user consumer rights under English Law.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-900 font-black uppercase">Data Protection Act 2018</p>
                  <p>Local-first storage ensures that sensitive forensic data does not reside in cloud-based persistent logs outside of the authorised Gemini context.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
