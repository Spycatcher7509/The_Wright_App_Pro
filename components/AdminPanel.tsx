
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DBService } from '../services/dbService';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
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
      email,
      name,
      role,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email}`,
      isFirstLogin: false
    };

    try {
      await DBService.saveUser(userToSave);
      await loadUsers();
      setIsModalOpen(false);
    } catch (err) {
      alert("System Error: Failed to commit user to storage.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to revoke this identity? Access will be terminated immediately.')) {
      await DBService.deleteUser(id);
      await loadUsers();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Command Centre</h2>
          <p className="text-slate-500 text-sm">Manage Wright Engine access and user protocols.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
        >
          ➕ Provision New User
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Group Status</th>
              <th className="px-6 py-4 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={u.avatar} 
                      alt={u.name} 
                      className={`w-12 h-12 rounded-2xl border-2 ${u.role === 'SUPER_ADMIN' ? 'border-amber-500 shadow-lg shadow-amber-500/20' : u.role === 'ADMIN' ? 'border-indigo-500' : 'border-slate-200'} object-cover bg-slate-100 transition-transform group-hover:scale-105`}
                    />
                    <div>
                      <p className="font-bold text-slate-900">{u.name || 'Anonymous User'}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-700' : u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(u)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                    >
                      Modify
                    </button>
                    {u.role !== 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100"
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold">{editingUser ? 'Modify User Profile' : 'Provision New System User'}</h3>
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email || 'placeholder'}`} className="w-full h-full object-cover" />
              </div>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                <input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">System Email</label>
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="user@wrightapp.pro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Security Group</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="STANDARD">Standard Group</option>
                    <option value="ADMIN">Admin Group</option>
                    <option value="SUPER_ADMIN">Super Admin Group</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Avatar (URL or Seed)</label>
                  <input 
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    placeholder="e.g. Spike"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:bg-indigo-400"
                >
                  {isSaving ? 'Committing...' : 'Commit Profile'}
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
