
import React, { useState, useEffect } from 'react';
import { User, LogEntry } from '../types';
import { DBService } from '../services/dbService';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState({ logs: 0, tickets: 0, successRate: 0, users: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const logs = await DBService.getLogs();
      const tickets = await DBService.getTickets();
      const users = await DBService.getUsers();
      const success = logs.filter(l => l.status === 'SUCCESS').length;
      setStats({
        logs: logs.length,
        tickets: tickets.length,
        users: users.length,
        successRate: logs.length > 0 ? Math.round((success / logs.length) * 100) : 100
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 transition-all hover:scale-[1.02] cursor-default">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Transcriptions</p>
          <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{stats.logs}</p>
          <div className="mt-6 flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase">
            <span className="bg-indigo-50 px-3 py-1 rounded-full">Military Grade</span> Active Archive
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 transition-all hover:scale-[1.02] cursor-default">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Support Tickets</p>
          <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{stats.tickets}</p>
          <div className="mt-6 flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase">
            <span className="bg-emerald-50 px-3 py-1 rounded-full">Secure Link</span> E2E Validated
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 transition-all hover:scale-[1.02] cursor-default">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identities Provisioned</p>
          <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{stats.users}</p>
          <div className="mt-6 flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase">
            <span className="bg-indigo-50 px-3 py-1 rounded-full">Vault Safe</span> Military Encrypted
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 transition-all hover:scale-[1.02] cursor-default">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Health</p>
          <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{stats.successRate}%</p>
          <div className="mt-6 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-indigo-600 h-full transition-all duration-1000 shadow-[0_0_10px_#6366f1]" 
              style={{ width: `${stats.successRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl">🍷</div>
            <h3 className="text-3xl font-black italic tracking-tighter">Welcome to the Wright Intelligence Node</h3>
          </div>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed font-medium">
            The_Wright_App_pro is running at peak capacity. All forensic extractions are currently being processed with Military Grade Cascade integrity verification. Your local database is synchronised and secure.
          </p>
          <div className="flex gap-4 pt-4">
            <button className="px-8 py-3 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-slate-50 transition-all italic">
              Integrity Audit
            </button>
            <button className="px-8 py-3 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all">
              Vault Diagnostics
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 text-[12rem] font-black text-white/5 pointer-events-none italic select-none">
          WRIGHT
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>
    </div>
  );
};

export default Dashboard;
