
import React, { useState } from 'react';
import { User } from '../types';
import { DBService } from '../services/dbService';
import { ResendService, DispatchStatus } from '../services/resendService';

const SupportForm: React.FC<{ user: User }> = ({ user }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>({ step: 'IDLE', message: '' });
  const [success, setSuccess] = useState(false);
  const [lastTicket, setLastTicket] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setErrorDetails('');
    
    try {
      // 1. Create ticket in local database for user reference
      const ticket = await DBService.createTicket(subject, message);
      setLastTicket(ticket.id);
      
      // 2. Submit to Netlify Forms (Parallel - Dashboard tracking)
      const netlifyFormData = new URLSearchParams();
      netlifyFormData.append('form-name', 'contact');
      netlifyFormData.append('name', user.name || 'Authorised Identity');
      netlifyFormData.append('email', user.email);
      netlifyFormData.append('subject', `[${ticket.id}] ${subject}`);
      netlifyFormData.append('message', message);

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: netlifyFormData.toString(),
      }).catch(err => console.error("Netlify Audit Trace Failed", err));

      // 3. Dispatch via Resend.com for actual Outbound Email Delivery
      const resendResult = await ResendService.sendSupportEmail(
        user.email,
        message,
        ticket.id,
        (status) => setDispatchStatus(status)
      );

      if (!resendResult.success) {
        throw new Error(resendResult.error || 'Resend Gateway Handshake Failed');
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
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Ticket {lastTicket} Synced via Resend/Netlify Gateway</p>
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
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Professional Dispatch Protocol</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 border-indigo-100 bg-indigo-50 text-indigo-600">
             Relay: Resend API
           </div>
           <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 border-emerald-100 bg-emerald-50 text-emerald-600">
             Audit: Netlify Forms
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
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
          <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] space-y-4 animate-in fade-in slide-in-from-top-4">
            <h6 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Dispatch Protocol Interrupted</h6>
            <p className="text-xs text-rose-800 font-medium leading-relaxed">{errorDetails}</p>
            {errorDetails.includes('CORS') && (
              <p className="text-[10px] text-indigo-600 font-bold uppercase italic">Suggestion: Visit 'Settings' to enable a CORS Relay Gateway.</p>
            )}
          </div>
        )}

        <button 
          type="submit"
          disabled={dispatchStatus.step !== 'IDLE' && dispatchStatus.step !== 'ERROR'}
          className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {dispatchStatus.step === 'IDLE' || dispatchStatus.step === 'ERROR' ? 'Execute Dual-Dispatch Handshake' : dispatchStatus.message}
        </button>
      </form>
      
      <div className="absolute top-0 right-0 p-16 text-9xl font-black text-slate-50 pointer-events-none select-none italic">HUB</div>
    </div>
  );
};

export default SupportForm;