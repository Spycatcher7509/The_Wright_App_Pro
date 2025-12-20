
import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { DBService } from '../services/dbService';

const TicketViewer: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    DBService.getTickets().then(setTickets);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Support Ticket Database</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.length === 0 ? (
          <div className="col-span-2 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 font-medium">No active support tickets found.</p>
          </div>
        ) : tickets.map(ticket => (
          <div key={ticket.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                  {ticket.id}
                </span>
                <h4 className="font-bold text-slate-900 mt-1">{ticket.subject}</h4>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                ticket.status === 'OPEN' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>{ticket.timestamp}</span>
              <button className="text-indigo-600 hover:text-indigo-800">Reply to User</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketViewer;
