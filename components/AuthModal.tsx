
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { APP_TITLE } from '../constants';
import { DBService } from '../services/dbService';

interface AuthModalProps {
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      const users = await DBService.getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!existingUser) {
        setError('Security Error: Identity not found in database.');
        setIsAuthenticating(false);
        return;
      }

      // Mandatory password change for first-time users or default password
      if (password === 'OnePassword' && existingUser.isFirstLogin) {
        setIsChangingPassword(true);
        setIsAuthenticating(false);
        return;
      }

      if (password.length >= 8) {
        onLogin(existingUser);
      } else {
        setError('Invalid credentials or security policy violation.');
      }
    } catch (err) {
      setError('Internal System Error: Handshake failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters for security compliance.');
      setIsAuthenticating(false);
      return;
    }

    try {
      const users = await DBService.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('Identity already exists. Please use the login gateway.');
        setIsAuthenticating(false);
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        name: name,
        role: 'STANDARD',
        isFirstLogin: false,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || email}`
      };

      await DBService.saveUser(newUser);
      onLogin(newUser);
    } catch (err) {
      setError('Identity Provisioning Failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    
    const users = await DBService.getUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      const updatedUser = { ...existingUser, isFirstLogin: false };
      await DBService.saveUser(updatedUser);
      onLogin(updatedUser);
    }
  };

  if (forgotSent) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white p-10 rounded-[3rem] max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-4xl">📧</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic tracking-tighter">Secure Link Sent</h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">A password recovery link has been dispatched to your registered address per UK data protocols.</p>
          </div>
          <button onClick={() => setForgotSent(false)} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-black transition-all">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-10 bg-indigo-600 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-8xl font-black text-white/5 pointer-events-none italic">WRIGHT</div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 shadow-xl">
            <span className="text-3xl font-black italic">W</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter">{APP_TITLE}</h1>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Secure High-Performance Environment</p>
        </div>

        <div className="p-10">
          {!isChangingPassword ? (
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
              {isRegistering && (
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold"
                    placeholder="e.g. Spike Wright"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold"
                  placeholder="accounts@thewrightsupport.com"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Password</label>
                  {!isRegistering && (
                    <button type="button" onClick={() => setForgotSent(true)} className="text-[9px] text-indigo-600 font-black uppercase hover:underline tracking-tighter">Request Recovery</button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-tight text-center">{error}</p>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <button 
                  type="submit" 
                  disabled={isAuthenticating}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 uppercase tracking-widest text-xs italic"
                >
                  {isAuthenticating ? 'Initialising Handshake...' : isRegistering ? 'Provision Identity' : 'Authorise Entry'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                  className="w-full text-slate-400 hover:text-indigo-600 font-black uppercase text-[9px] tracking-[0.2em] transition-colors"
                >
                  {isRegistering ? '← Back to Login Gateway' : 'Register New Forensic Identity'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-6 animate-in zoom-in duration-300">
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-6">
                <h6 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">Security Compliance Requirement</h6>
                <p className="text-[11px] text-indigo-600 leading-relaxed font-medium">System policy requires a non-default password for "{email}". Ensure it meets pro-level complexity standards.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Security Password</label>
                <input 
                  type="password" 
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold"
                  placeholder="Minimum 8 characters"
                />
              </div>
              {error && <p className="text-[10px] text-rose-500 font-black uppercase text-center">{error}</p>}
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs">
                Commit & Authorise
              </button>
            </form>
          )}
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Identity Protocol 1.0.8-UK_PRO</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
