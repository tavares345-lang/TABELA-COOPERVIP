import React, { useState } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const result = authService.login(email, password);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setError(result.message);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat bg-slate-950"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.85)), url('/login_bg.png')`,
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md dark:bg-gray-900/95 rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/20">
        <div className="text-center mb-8 sm:mb-10 flex flex-col items-center">
          <div className="w-48 sm:w-56 mb-4 filter drop-shadow-[0_4px_25px_rgba(202,138,4,0.15)] transition-transform hover:scale-105 duration-300">
            <img 
              src="/pvs_logo.png" 
              alt="PVS Transporte Executivo Logo" 
              className="w-full h-auto rounded-3xl select-none"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight uppercase mt-2">
            PVS <span className="text-yellow-600">TRANSPORTE</span>
          </h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black mt-1">
            Painel de Acesso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Usuário ou E-mail</label>
            <input
                type="text"
                placeholder="Ex: Admin ou seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 text-base bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all font-medium shadow-sm"
                required
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha de Acesso</label>
            <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 text-base bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all font-medium shadow-sm"
                required
            />
          </div>

          {error && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>}
          {success && <p className="text-green-500 text-[10px] text-center font-black uppercase tracking-widest bg-green-50 border border-green-100 p-3 rounded-xl">{success}</p>}

          <button
            type="submit"
            className="w-full bg-yellow-500 text-gray-950 font-black py-5 px-8 rounded-2xl hover:bg-yellow-600 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-yellow-500/20 text-base uppercase tracking-widest mt-2"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="text-center mt-10 sm:mt-12 bg-gray-50/50 dark:bg-gray-800/50 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-6 border-t border-gray-100 dark:border-gray-800 rounded-b-[2.5rem]">
          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
            Para obter acesso, solicite o cadastro ao Administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
