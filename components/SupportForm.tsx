
import React, { useState } from 'react';
import { User } from '../types';
import { DBService } from '../services/dbService';
import { DispatchService, DispatchStatus } from '../services/dispatchService';

const SupportForm: React.FC<{ user: User }> = ({ user }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>({ step: 'IDLE', message: '' });
  const [success, setSuccess] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  
  // Honeypot state
  const [trap, setTrap] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 0. Honeypot Check (Bot detection)
    if (trap) {
      console.warn("SPAM_DETECTED: Bot-fill identified on honeypot.");
      setSuccess(true); 
      return;
    }

    setSuccess(false);
    setErrorDetails('');
    
    try {
      // Create ticket with user email for future replies
      const ticket = await DBService.createTicket(subject, message, user.email);
      
      const result = await DispatchService.sendEmail(
        user.email,
        message,
        ticket.id,
        undefined, // Defaults to support vault
        (status) => setDispatchStatus(status)
      );

      if (!result.success) {
        throw new Error(result.error || 'SendGrid Gateway Handshake Failed');
      }

      setSuccess(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorDetails(errorMsg);
      setDispatchStatus({ step: 'ERROR', message: 'DISPATCH_FAILED' });
    }
  };

  if (success) {
    return (
      <div className="bg-white border-4 border-slate-50 p-16 rounded-[4rem] text-center space-y-10 shadow-2xl animate-in zoom-in duration-500 max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto text-5xl shadow-xl shadow-emerald-100">✓</div>
        <div className="space-y-3">
          <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">Dispatch Success</h3>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Payload Synced via SendGrid Gateway</p>
        </div>
        <button 
          onClick={() => { setSuccess(false); setSubject(''); setMessage(''); setDispatchStatus({ step: 'IDLE', message: '' }); }}
          className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl hover:bg-black transition-all uppercase tracking-widest text-xs italic"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-200 p-16 max-w-3xl mx-auto space-y-12 relative overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">Support Hub</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Bot-Filtered Dispatch Protocol</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="hidden" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
          <input type="text" name="_trap" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-4">Asset Subject</label>
          <input 
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none transition-all font-bold italic"
            placeholder="e.g. Identity Sync Anomaly"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-4">Payload Message</label>
          <textarea 
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none resize-none transition-all font-bold"
            placeholder="Detailed forensic description..."
          />
        </div>

        {errorDetails && (
          <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
            <h6 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Dispatch Protocol Interrupted</h6>
            <p className="text-xs text-rose-800 font-medium leading-relaxed">{errorDetails}</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={dispatchStatus.step !== 'IDLE' && dispatchStatus.step !== 'ERROR'}
          className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {dispatchStatus.step === 'IDLE' || dispatchStatus.step === 'ERROR' ? 'Execute SendGrid Handshake' : dispatchStatus.message}
        </button>
      </form>
    </div>
  );
};

export default SupportForm;
