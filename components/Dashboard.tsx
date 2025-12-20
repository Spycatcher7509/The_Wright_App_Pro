
import React, { useState, useEffect } from 'react';
import { User, LogEntry } from '../types';
import { DBService } from '../services/dbService';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState({ logs: 0, tickets: 0, successRate: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const logs = await DBService.getLogs();
      const tickets = await DBService.getTickets();
      const success = logs.filter(l => l.status === 'SUCCESS').length;
      setStats({
        logs: logs.length,
        tickets: tickets.length,
        successRate: logs.length > 0 ? Math.round((success / logs.length) * 100) : 100
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Transcriptions</p>
          <p className="text-4xl font-extrabold text-slate-900">{stats.logs}</p>
          <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold">
            <span className="bg-green-100 px-2 py-0.5 rounded">↑ 12%</span> vs last week
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Tickets</p>
          <p className="text-4xl font-extrabold text-slate-900">{stats.tickets}</p>
          <div className="mt-4 flex items-center gap-2 text-indigo-600 text-xs font-bold">
            <span className="bg-indigo-100 px-2 py-0.5 rounded">Stable</span> No critical issues
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">System Success Rate</p>
          <p className="text-4xl font-extrabold text-slate-900">{stats.successRate}%</p>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-1000" 
              style={{ width: `${stats.successRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Welcome back to Wright Engine</h3>
          <p className="text-indigo-200 max-w-lg mb-6">
            The high-performance transcription suite optimised for professional use. 
            All processes are checksum-verified and locally logged in your DB.
          </p>
          <button className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl shadow-xl hover:bg-indigo-50 transition-colors">
            Review System Integrity
          </button>
        </div>
        <div className="absolute top-0 right-0 p-8 text-9xl font-black text-white/5 pointer-events-none">
          WRIGHT
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
