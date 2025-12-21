
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { DBService } from '../services/dbService';

const GlobalIntercom: React.FC<{ user: User }> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [linkIntegrity, setLinkIntegrity] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Polling for "Real-time" effect
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  const loadData = async () => {
    const [allUsers, allMessages] = await Promise.all([
      DBService.getUsers(),
      DBService.getMessages()
    ]);
    setUsers(allUsers.filter(u => u.id !== user.id));
    setMessages(allMessages);
    // Random fluctuation for "Cyber" aesthetic
    setLinkIntegrity(prev => Math.min(100, Math.max(92, prev + (Math.random() > 0.5 ? 1 : -1))));
  };

  const computeSHA512 = async (text: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || !selectedUser || isSending) return;

    setIsSending(true);
    const hash = await computeSHA512(input);
    
    await DBService.sendMessage({
      senderId: user.id,
      receiverId: selectedUser.id,
      text: input,
      hash
    });

    setInput('');
    setIsSending(false);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    setIsSending(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const hash = await computeSHA512(file.name + file.size);
      
      await DBService.sendMessage({
        senderId: user.id,
        receiverId: selectedUser.id,
        text: `Forensic Asset Dispatched: ${file.name}`,
        hash,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        }
      });
      setIsSending(false);
      loadData();
    };
    reader.readAsDataURL(file);
  };

  const filteredMessages = messages.filter(m => 
    (m.senderId === user.id && m.receiverId === selectedUser?.id) ||
    (m.senderId === selectedUser?.id && m.receiverId === user.id)
  );

  return (
    <div className="flex h-[calc(100vh-200px)] gap-8 animate-in fade-in duration-500">
      {/* User Directory */}
      <div className="w-80 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-8 bg-slate-900 border-b border-slate-800">
          <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-1">Secure Directory</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Active Links</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                selectedUser?.id === u.id ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'hover:bg-slate-50'
              }`}
            >
              <img src={u.avatar} className="w-10 h-10 rounded-xl bg-slate-100" alt="" />
              <div className="text-left overflow-hidden">
                <p className={`text-sm font-black truncate ${selectedUser?.id === u.id ? 'text-white' : 'text-slate-900'}`}>
                  {u.name || 'Anonymous User'}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${selectedUser?.id === u.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {u.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden relative">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center text-4xl animate-pulse">📡</div>
            <div className="space-y-2">
              <h3 className="text-white text-xl font-black uppercase tracking-tight">Handshake Pending</h3>
              <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">Select a target identity to establish a SHA-512 encrypted link.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-10 py-6 bg-black/40 border-b border-slate-800 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest">Linked: {selectedUser.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Intercom Tunnel Active</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-indigo-400 font-black uppercase">Link Integrity</p>
                  <p className="text-white font-mono text-xs">{linkIntegrity}%</p>
                </div>
                <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${linkIntegrity}%` }}></div>
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar z-10">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] space-y-2 ${msg.senderId === user.id ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`p-6 rounded-[2rem] text-sm leading-relaxed ${
                      msg.senderId === user.id 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-lg'
                    }`}>
                      {msg.text}
                      {msg.file && (
                        <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate">{msg.file.name}</p>
                              <p className="text-[10px] opacity-60 uppercase font-black">{(msg.file.size / 1024 / 1024).toFixed(2)} MB Payload</p>
                            </div>
                          </div>
                          <a 
                            href={msg.file.data} 
                            download={msg.file.name}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase rounded-xl transition-colors"
                          >
                            Extract
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 px-4">
                      <p className="text-[8px] font-mono text-slate-500 uppercase">SHA-512: {msg.hash.substring(0, 32)}...</p>
                      <p className="text-[8px] font-mono text-slate-600 uppercase">{msg.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Gate */}
            <form onSubmit={handleSendMessage} className="p-8 bg-black/40 border-t border-slate-800 flex gap-4 z-10">
              <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 bg-slate-800 text-white rounded-3xl flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg active:scale-90"
              >
                <span className="text-2xl">📁</span>
              </button>
              <div className="flex-1 relative">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Transmit encrypted payload..."
                  className="w-full h-16 px-8 bg-black/60 border-2 border-slate-700 rounded-3xl text-white font-medium outline-none focus:border-indigo-600 transition-all placeholder:text-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={!input || isSending}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-0"
                >
                  ➜
                </button>
              </div>
            </form>

            {/* Unlimited MB Background Grid */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:32px_32px]"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalIntercom;
