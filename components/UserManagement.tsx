import React, { useState, useEffect } from 'react';
import * as authService from '../services/authService';
import type { User } from '../types';
import { TrashIcon } from './icons/TrashIcon';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Include user form states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Admin password states
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  const loadUsers = async (forceSync = false) => {
    setLoading(true);
    if (forceSync) {
      await authService.syncUsersFromFirestore();
    }
    setUsers(authService.getAllUsers());
    setLoading(false);
  };

  useEffect(() => {
    // Force sync on mount to pull freshest users from Firestore
    loadUsers(true);

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'taxi_app_users') {
            loadUsers(false);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleIncludeUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedEmail = newEmail.trim().toLowerCase();
    const trimmedPassword = newPassword;

    if (!trimmedEmail) {
      setFormError('O e-mail/usuário é obrigatório.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      setFormError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register(trimmedEmail, trimmedPassword, newRole);
      if (result.success) {
        setFormSuccess(`Usuário "${trimmedEmail}" cadastrado com sucesso!`);
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        await loadUsers(true);
      } else {
        setFormError(result.message);
      }
    } catch (err) {
      setFormError('Erro de conexão ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
        setLoading(true);
        const success = await authService.deleteUser(email);
        setLoading(false);
        if (success) {
            await loadUsers(true);
            alert('Usuário excluído com sucesso.');
        } else {
            alert('Erro ao excluir usuário.');
        }
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    const trimmedPassword = adminPassword;

    if (!trimmedPassword || trimmedPassword.length < 4) {
      setAdminError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.updateAdminPassword(trimmedPassword);
      if (result.success) {
        setAdminSuccess('Senha do Administrador (Admin) alterada com sucesso!');
        setAdminPassword('');
        await loadUsers(true);
      } else {
        setAdminError(result.message);
      }
    } catch (err) {
      setAdminError('Erro de conexão ao atualizar a senha do Admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* CARD DE INCLUSÃO DE NOVO USUÁRIO */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-2.5 h-8 bg-blue-600 rounded-full"></div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Incluir Novo Usuário</h2>
        </div>

        <form onSubmit={handleIncludeUser} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail ou Usuário</label>
            <input
              type="text"
              placeholder="exemplo@coopervip.com.br"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-5 py-4 text-base bg-gray-50 border border-gray-200 focus:bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              required
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha de Acesso</label>
            <input
              type="password"
              placeholder="Mínimo 4 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-5 py-4 text-base bg-gray-50 border border-gray-200 focus:bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nível de Acesso</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
              className="w-full px-5 py-4 text-base bg-gray-50 border border-gray-200 focus:bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold cursor-pointer"
            >
              <option value="user">USER (Usuário)</option>
              <option value="admin">ADMIN (Administrador)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-50 h-[56px]"
            >
              CADASTRAR
            </button>
          </div>
        </form>

        {formError && (
          <p className="mt-4 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 border border-red-100 p-3 rounded-xl max-w-max">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="mt-4 text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-50 border border-green-100 p-3 rounded-xl max-w-max">
            {formSuccess}
          </p>
        )}
      </div>

      {/* CARD DE ALTERAÇÃO DE SENHA DO ADMIN */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-2.5 h-8 bg-red-600 rounded-full"></div>
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Alterar Senha do Admin</h2>
        </div>

        <form onSubmit={handleUpdateAdminPassword} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Usuário</label>
            <input
              type="text"
              value="Admin"
              disabled
              className="w-full px-5 py-4 text-base bg-gray-100 border border-gray-200 rounded-2xl text-gray-400 font-bold focus:outline-none"
            />
          </div>

          <div className="md:col-span-6">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nova Senha de Acesso</label>
            <input
              type="password"
              placeholder="Digite a nova senha do administrador (mínimo 4 caracteres)"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-5 py-4 text-base bg-gray-50 border border-gray-200 focus:bg-white rounded-2xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-lg shadow-red-500/10 disabled:opacity-50 h-[56px]"
            >
              SALVAR SENHA
            </button>
          </div>
        </form>

        {adminError && (
          <p className="mt-4 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 border border-red-100 p-3 rounded-xl max-w-max">
            {adminError}
          </p>
        )}
        {adminSuccess && (
          <p className="mt-4 text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-50 border border-green-100 p-3 rounded-xl max-w-max">
            {adminSuccess}
          </p>
        )}
      </div>

      {/* GERENCIAMENTO DE USUÁRIOS EXISTENTES */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-8 bg-yellow-400 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Usuários Cadastrados</h2>
          </div>
          <span className="bg-yellow-100 text-yellow-800 font-black px-4 py-1.5 rounded-full text-xs uppercase">
            {users.length} cadastrado(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="hidden md:table-header-group bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">E-mail / Usuário</th>
                <th scope="col" className="px-6 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Nível de Acesso</th>
                <th scope="col" className="px-6 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-transparent md:bg-white md:divide-y md:divide-gray-100">
              {users.length > 0 ? users.map((user) => (
                <tr key={user.email} className="block md:table-row mb-8 md:mb-0 bg-white rounded-xl shadow-md md:shadow-none md:hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 md:px-6 md:py-6 whitespace-nowrap block md:table-cell border-b md:border-b-0">
                      <div className="flex justify-between items-center md:block">
                          <span className="font-bold text-gray-700 md:hidden text-lg">Usuário</span>
                          <span className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tight">{user.email}</span>
                      </div>
                  </td>
                  <td className="p-5 md:px-6 md:py-6 whitespace-nowrap block md:table-cell border-b md:border-b-0">
                      <div className="flex justify-between items-center md:block">
                          <span className="font-bold text-gray-700 md:hidden text-lg">Nível de Acesso</span>
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                      </div>
                  </td>
                  <td className="p-5 md:px-6 md:py-6 whitespace-nowrap block md:table-cell text-right">
                      <div className="flex justify-end items-center md:block mt-2 md:mt-0">
                          <button 
                              onClick={() => handleDeleteUser(user.email)} 
                              className="p-3 bg-red-100 rounded-xl text-red-600 hover:bg-red-200 transition-colors border border-transparent hover:border-red-100" 
                              title="Excluir Usuário"
                          >
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                  </td>
                </tr>
              )) : (
                  <tr className="block md:table-row">
                      <td colSpan={3} className="text-center py-16 text-gray-400 block text-lg font-black uppercase tracking-widest opacity-40">
                          Nenhum usuário cadastrado ainda.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
