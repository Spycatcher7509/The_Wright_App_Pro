
import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { DBService } from '../services/dbService';
import { DispatchService } from '../services/dispatchService';

const TicketViewer: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => DBService.getTickets().then(setTickets);

  const handleReply = async (ticket: Ticket) => {
    if (!replyText) return;
    setIsSending(true);
    setStatusMsg('Dispatching Reply...');

    try {
      const userEmail = ticket.userEmail || "accounts@thewrightsupport.com"; 

      const result = await DispatchService.sendEmail(
        "support@wrightapp.pro",
        replyText,
        ticket.id,
        userEmail
      );

      if (result.success) {
        setStatusMsg('Reply Dispatched Successfully.');
        setReplyText('');
        setTimeout(() => {
          setReplyId(null);
          setStatusMsg('');
        }, 2000);
      } else {
        setStatusMsg(`Failure: ${result.error}`);
      }
    } catch (e) {
      setStatusMsg('Internal Link Error.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Support Ticket Database</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.length === 0 ? (
          <div className="col-span-2 py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Registry Empty: No Active Tickets</p>
          </div>
        ) : tickets.slice().reverse().map(ticket => (
          <div key={ticket.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-4 transition-all hover:border-indigo-100">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {ticket.id}
                </span>
                <h4 className="font-black text-slate-900 mt-2 text-lg tracking-tight">{ticket.subject}</h4>
                <p className="text-[9px] text-slate-400 font-mono mt-1">{ticket.userEmail}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
                ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {ticket.status}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {ticket.description}
            </p>

            {replyId === ticket.id ? (
              <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Enter forensic reply payload..."
                  className="w-full p-4 bg-slate-900 text-indigo-300 font-mono text-xs rounded-2xl border-2 border-indigo-900/50 focus:border-indigo-500 outline-none h-32"
                />
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-indigo-500 uppercase animate-pulse">{statusMsg}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setReplyId(null)}
                      className="px-4 py-2 text-slate-400 font-black uppercase text-[9px] hover:text-slate-600"
                    >
                      Abort
                    </button>
                    <button 
                      disabled={isSending || !replyText}
                      onClick={() => handleReply(ticket)}
                      className="px-6 py-2 bg-indigo-600 text-white font-black uppercase text-[9px] rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      Dispatch Reply
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                <span>{ticket.timestamp}</span>
                <button 
                  onClick={() => setReplyId(ticket.id)}
                  className="text-indigo-600 hover:text-indigo-800 font-black underline decoration-indigo-200 underline-offset-4"
                >
                  Reply to User
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketViewer;
