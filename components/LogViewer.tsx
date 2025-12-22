
import React, { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { DBService } from '../services/dbService';

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');

  useEffect(() => {
    DBService.getLogs().then(setLogs);
  }, []);

  const handleVerify = async () => {
    if (!verifyInput) return;
    const isValid = await DBService.verifyChecksum(verifyInput);
    setVerifyResult(isValid ? 'VALID' : 'INVALID');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold">System Log Database</h3>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            value={verifyInput}
            onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult('IDLE'); }}
            placeholder="Verify Military Grade Checksum..."
            className="px-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
          />
          <button 
            onClick={handleVerify}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              verifyResult === 'VALID' ? 'bg-emerald-600 text-white' : 
              verifyResult === 'INVALID' ? 'bg-rose-600 text-white' : 
              'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {verifyResult === 'VALID' ? 'Verified ✓' : verifyResult === 'INVALID' ? 'Mismatch ✗' : 'Verify Bridge'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Date & Time (GBFormat)</th>
                <th className="px-6 py-4">Resource Title</th>
                <th className="px-6 py-4">Integrity Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No entries in SQLite Database.</td>
                </tr>
              ) : logs.slice().reverse().map(log => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 truncate max-w-[200px]">{log.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                      >
                        {expandedId === log.id ? 'Hide' : 'Expand Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-slate-50/50 border-l-4 border-l-indigo-500">
                      <td colSpan={4} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                          <div className="space-y-4">
                            <div>
                              <p className="font-bold text-slate-500 uppercase mb-1">Dual-Block Checksum (Military Grade)</p>
                              <p className="mono p-3 bg-white rounded-xl border border-slate-200 text-indigo-700 break-all shadow-inner max-h-32 overflow-y-auto custom-scrollbar">
                                {log.checksum}
                              </p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-500 uppercase mb-1">Absolute Storage Path</p>
                              <p className="mono p-3 bg-white rounded-xl border border-slate-200 text-slate-600 break-all">{log.absolutePath}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <p className="font-bold text-slate-500 uppercase mb-2">Metadata Summary</p>
                              <ul className="space-y-1 text-[10px] text-slate-500">
                                <li>• DB_ID: {log.id}</li>
                                <li>• SECURITY: Military_Grade_Cascade_V2</li>
                                <li>• MODALITY: {log.title.includes('YouTube') ? 'STREAM' : 'LOCAL_ASSET'}</li>
                                <li>• ENCODING: UTF-8</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
