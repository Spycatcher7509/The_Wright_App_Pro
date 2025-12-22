
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DBService } from '../services/dbService';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STANDARD');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await DBService.getUsers();
    setUsers(data);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
    setRole('STANDARD');
    setAvatar('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setName(user.name || '');
    setRole(user.role);
    setAvatar(user.avatar || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const userToSave: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email}`,
      isFirstLogin: !editingUser // Mandatory password change for new users
    };

    try {
      await DBService.saveUser(userToSave);
      await loadUsers(); // Refresh state immediately
      setIsModalOpen(false);
    } catch (err) {
      alert("CRITICAL SYSTEM ERROR: Identity commit failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('SECURITY PROTOCOL: Revoke this identity? Access will be terminated immediately and all active sessions purged.')) {
      await DBService.deleteUser(id);
      await loadUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">Command Centre</h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Wright Engine Access Control & Identity Lifecycle</p>
        </div>
        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Identity Registry..."
              className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all text-xs font-black italic"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center gap-3 text-[10px] uppercase tracking-widest italic active:scale-95"
          >
            <span className="text-lg">⊕</span> Provision Identity
          </button>
        </div>
        <div className="absolute top-0 right-0 p-8 text-8xl font-black text-slate-50 pointer-events-none select-none italic">ROOT</div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <tr>
              <th className="px-10 py-8 italic">Forensic Identity</th>
              <th className="px-10 py-8">Security Group</th>
              <th className="px-10 py-8 text-right">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-10 py-24 text-center">
                  <div className="space-y-4 text-slate-200">
                    <span className="text-6xl">🔍</span>
                    <p className="font-black uppercase text-[10px] tracking-widest italic">No identities found in active registry.</p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img 
                        src={u.avatar} 
                        alt="" 
                        className={`w-16 h-16 rounded-[1.5rem] border-2 ${
                          u.role === 'SUPER_ADMIN' ? 'border-amber-500 shadow-amber-100' : 
                          u.role === 'LOCAL_ADMIN' ? 'border-indigo-500 shadow-indigo-100' : 
                          'border-slate-200'
                        } object-cover bg-slate-100 shadow-xl transition-transform group-hover:scale-110`}
                      />
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${u.role === 'SUPER_ADMIN' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg tracking-tight italic">{u.name || 'Unknown Entity'}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tight">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                    u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-700' : 
                    u.role === 'LOCAL_ADMIN' ? 'bg-indigo-100 text-indigo-700' : 
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={() => openEditModal(u)}
                      className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 hover:border-indigo-200 transition-all"
                    >
                      Modify
                    </button>
                    {u.role !== 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all shadow-rose-100 shadow-sm"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-xl w-full p-12 animate-in zoom-in duration-300 border border-white/20">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{editingUser ? 'Modify Identity' : 'Provision Identity'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Administrative Secure Tunnel</p>
              </div>
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 overflow-hidden border-2 border-slate-100 shadow-2xl group relative">
                <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email || 'seed'}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Registered Name</label>
                <input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none transition-all font-bold text-sm"
                  placeholder="e.g. Spike Wright"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Linked Forensic Email</label>
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none transition-all font-bold text-sm"
                  placeholder="user@wrightapp.pro"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Group</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none font-black text-[10px] uppercase tracking-widest italic"
                  >
                    <option value="STANDARD">Standard User</option>
                    <option value="LOCAL_ADMIN">Local Admin</option>
                    <option value="SUPER_ADMIN">SuperAdmin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avatar Seed</label>
                  <input 
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none text-xs font-bold"
                    placeholder="e.g. Spike"
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-10">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-3xl hover:bg-slate-50 transition-all"
                >
                  Abort Protocol
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all italic active:scale-95"
                >
                  {isSaving ? 'Committing...' : 'Commit Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
