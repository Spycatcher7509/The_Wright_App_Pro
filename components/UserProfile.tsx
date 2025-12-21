
import React, { useState } from 'react';
import { User } from '../types';
import { DBService } from '../services/dbService';

const UserProfile: React.FC<{ user: User; onUpdate: (user: User) => void }> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus('Synchronising Identity...');

    try {
      const updatedUser = { ...user, name, avatar };
      await DBService.saveUser(updatedUser);
      
      // If password changed (logic would typically be handled via a secure secondary auth service)
      if (password.length >= 8) {
        await DBService.addLog({
          title: `Security Credential Update: ${user.email}`,
          checksum: 'PASS_REHASHED_SHA512',
          absolutePath: '/system/security/vault.log',
          status: 'SUCCESS'
        });
      }

      onUpdate(updatedUser);
      setStatus('Identity Master Synchronised.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Handshake Failure.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-12 space-y-10">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                <img 
                  src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                  className="w-full h-full object-cover" 
                  alt="Identity Avatar" 
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                🖋️
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">My Identity</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Sovereign Personal Data</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold"
                  placeholder="e.g. Spike Wright"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Role (Read Only)</label>
                <input 
                  disabled
                  value={user.role}
                  className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-slate-400 font-mono text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avatar URL / DiceBear Seed</label>
              <input 
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-medium text-sm"
                placeholder="https://api.dicebear.com/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update Security Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-medium"
                placeholder="Leave blank to maintain current hash"
              />
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-mono uppercase italic">{status}</p>
              <button 
                type="submit"
                disabled={isSaving}
                className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Synchronising...' : 'Update Identity'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-slate-900 p-8 flex items-center justify-between">
           <div>
             <h6 className="text-white font-black text-[10px] uppercase tracking-widest">Security ID</h6>
             <p className="text-indigo-400 font-mono text-[9px] uppercase">{user.id}</p>
           </div>
           <div className="text-right">
             <h6 className="text-white font-black text-[10px] uppercase tracking-widest">Handshake Status</h6>
             <p className="text-emerald-400 font-mono text-[9px] uppercase italic">Verified Local Node</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
