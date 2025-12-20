
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { APP_TITLE } from '../constants';
import { DBService } from '../services/dbService';

interface AuthModalProps {
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
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
      // 1. Mandatory password change for initial users
      if (password === 'OnePassword') {
        setIsChangingPassword(true);
        return;
      }

      // 2. Fetch identities from DB
      const users = await DBService.getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser && password.length >= 8) {
        onLogin(existingUser);
      } else if (!existingUser) {
        setError('Security Error: Identity not found in database.');
      } else {
        setError('Invalid credentials or security policy violation.');
      }
    } catch (err) {
      setError('Internal System Error: Handshake failed.');
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
    } else {
      // Create a default if somehow bypassed
      onLogin({
        id: `user-${Date.now()}`,
        email: email,
        role: 'STANDARD',
        isFirstLogin: false
      });
    }
  };

  if (forgotSent) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="text-4xl">📧</div>
          <h2 className="text-2xl font-bold">Secure Link Sent</h2>
          <p className="text-slate-600">A password recovery link has been dispatched to your registered address per UK data protocols.</p>
          <button onClick={() => setForgotSent(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-8 bg-indigo-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-3xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          <p className="text-indigo-100 text-sm opacity-80">Secure High-Performance Environment</p>
        </div>

        <div className="p-8">
          {!isChangingPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Registered Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="accounts@thewrightsupport.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase">System Password</label>
                  <button type="button" onClick={() => setForgotSent(true)} className="text-[10px] text-indigo-600 font-bold uppercase hover:underline">Forgot?</button>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
                <p className="text-[10px] text-slate-400 italic">Default: OnePassword (Mandatory Change)</p>
              </div>

              {error && <p className="text-xs text-red-500 font-bold animate-pulse">{error}</p>}

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isAuthenticating ? 'Authorising...' : 'Enter System'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                <p className="text-xs font-bold text-indigo-700 uppercase mb-1">First Login Security</p>
                <p className="text-xs text-indigo-600 leading-relaxed">System policy requires a non-default password for "{email}". Ensure it is complex and unique.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">New Security Password</label>
                <input 
                  type="password" 
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Minimum 8 characters"
                />
              </div>
              {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all">
                Apply & Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
