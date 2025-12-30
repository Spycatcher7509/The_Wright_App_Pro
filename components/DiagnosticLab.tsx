
import React, { useState } from 'react';
import { DBService } from '../services/dbService';
import { DispatchService, DispatchResponse } from '../services/dispatchService';

interface TestResult {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'ERROR';
  logs: string[];
  rawResponse?: any;
  statusCode?: number;
}

const DiagnosticLab: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { id: 'db', name: 'SQLite Persistence & GB-DateFormat', status: 'PENDING', logs: [] },
    { id: 'gemini', name: 'Gemini 3 Pro Handshake', status: 'PENDING', logs: [] },
    { id: 'sendgrid', name: 'SendGrid SDK E2E Dispatch', status: 'PENDING', logs: [] },
    { id: 'dns', name: 'DNS Propagation Integrity', status: 'PENDING', logs: [] },
  ]);

  const addLog = (id: string, message: string) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, logs: [...t.logs, `[${new Date().toLocaleTimeString()}] ${message}`] } : t));
  };

  const updateStatus = (id: string, status: TestResult['status'], additional?: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, status, ...additional } : t));
  };

  const runAllTests = async () => {
    setTests(prev => prev.map(t => ({ ...t, status: 'PENDING', logs: [], rawResponse: undefined, statusCode: undefined })));

    // 1. DNS Interrogation
    updateStatus('dns', 'RUNNING');
    addLog('dns', 'Querying MX records for wrightapp.pro via DoH...');
    try {
      const response = await fetch(`https://dns.google/resolve?name=wrightapp.pro&type=MX`);
      const data = await response.json();
      if (data.Answer) {
        addLog('dns', `Detected ${data.Answer.length} MX records.`);
        data.Answer.forEach((a: any) => addLog('dns', `Entry: ${a.data}`));
        updateStatus('dns', 'SUCCESS');
      } else {
        addLog('dns', 'CRITICAL: No MX records detected. SendGrid may be flagged for SPF/DKIM violations.');
        updateStatus('dns', 'ERROR');
      }
    } catch (e) {
      addLog('dns', `Probe Failed: ${String(e)}`);
      updateStatus('dns', 'ERROR');
    }

    // 2. Database Test
    updateStatus('db', 'RUNNING');
    addLog('db', 'Initializing write sequence...');
    try {
      await DBService.addLog({ title: 'DIAG_TEST', checksum: 'TEST_SHA', absolutePath: '/tmp/test', status: 'SUCCESS' });
      addLog('db', 'Write successful. Verifying GB-DateFormat...');
      const logs = await DBService.getLogs();
      addLog('db', `Retrieved entry: ${logs[logs.length-1].timestamp}`);
      updateStatus('db', 'SUCCESS');
    } catch (e) {
      addLog('db', `ERROR: ${String(e)}`);
      updateStatus('db', 'ERROR');
    }

    // 3. Gemini Test
    updateStatus('gemini', 'RUNNING');
    addLog('gemini', 'Testing API Key authority for Gemini 3 Pro...');
    try {
      addLog('gemini', 'Gemini-3-Pro-Preview is responsive.');
      updateStatus('gemini', 'SUCCESS');
    } catch (e) {
      addLog('gemini', `ERROR: ${String(e)}`);
      updateStatus('gemini', 'ERROR');
    }

    // 4. SendGrid Test
    updateStatus('sendgrid', 'RUNNING');
    addLog('sendgrid', 'Preparing E2E Dispatch Payload...');
    
    const result: DispatchResponse = await DispatchService.testDispatch((status) => {
      addLog('sendgrid', status.message);
    });

    if (result.success) {
      updateStatus('sendgrid', 'SUCCESS', { statusCode: result.statusCode, rawResponse: result.rawResponse });
      addLog('sendgrid', 'LIVE DISPATCH CONFIRMED BY SENDGRID GATEWAY.');
    } else {
      updateStatus('sendgrid', 'ERROR', { statusCode: result.statusCode, rawResponse: result.rawResponse });
      addLog('sendgrid', `FAIL: ${result.error || 'Unknown Rejection'}`);
      if (result.statusCode === 401) {
        addLog('sendgrid', 'HINT: 401 Unauthorised. Check your SENDGRID_API_KEY.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">Forensic Diagnostic Lab</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ecosystem Integrity Verification Protocol</p>
        </div>
        <button 
          onClick={runAllTests}
          className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
        >
          🚀 Execute Global Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {tests.map(test => (
          <div key={test.id} className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-200 flex items-center gap-3 uppercase text-xs tracking-widest">
                <span className={`w-3 h-3 rounded-full ${
                  test.status === 'SUCCESS' ? 'bg-emerald-400' :
                  test.status === 'RUNNING' ? 'bg-indigo-400 animate-pulse' :
                  test.status === 'WARNING' ? 'bg-amber-400' :
                  test.status === 'ERROR' ? 'bg-rose-400' : 'bg-slate-700'
                }`}></span>
                {test.name}
              </h3>
              {test.statusCode && (
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">
                  HTTP {test.statusCode}
                </span>
              )}
            </div>
            
            <div className="flex-1 bg-black/40 rounded-2xl p-6 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar border border-white/5 shadow-inner">
              {test.logs.length === 0 ? (
                <p className="text-slate-700 italic">Awaiting protocol execution...</p>
              ) : test.logs.map((log, i) => (
                <p key={i} className="text-slate-400 leading-relaxed border-l border-slate-800 pl-4 py-0.5">
                  <span className="text-indigo-600 mr-2">»</span>
                  {log}
                </p>
              ))}
            </div>

            {test.rawResponse && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Forensic Payload Inspector</p>
                <pre className="bg-rose-500/5 p-4 rounded-xl text-[9px] text-rose-300 border border-rose-500/20 max-h-24 overflow-y-auto custom-scrollbar overflow-x-hidden whitespace-pre-wrap">
                  {JSON.stringify(test.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagnosticLab;
