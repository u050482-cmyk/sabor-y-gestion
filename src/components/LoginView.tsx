import React, { useState } from 'react';
import { StaffMember } from '../types';
import { KeyRound, User, Utensils, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  staff: StaffMember[];
  onLoginSuccess: (user: StaffMember) => void;
}

export default function LoginView({ staff, onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorLine, setErrorLine] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLine('');

    if (!username.trim() || !password.trim()) {
      setErrorLine('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    const matchedUser = staff.find(
      s => s.username?.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matchedUser) {
      setErrorLine('El usuario ingresado no existe en la plantilla.');
      return;
    }

    if (matchedUser.password !== password) {
      setErrorLine('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }

    // Success login!
    onLoginSuccess(matchedUser);
  };

  // Get representative accounts for demonstration
  const getDemoAccounts = () => {
    const adminAcc = staff.find(s => s.role === 'manager') || staff[0];
    const waiterAcc = staff.find(s => s.role === 'waiter') || staff[1];
    const customerAcc = staff.find(s => s.role === 'customer') || staff.find(s => s.username === 'cliente');
    
    const list = [adminAcc, waiterAcc];
    if (customerAcc) {
      list.push(customerAcc);
    } else {
      list.push({ id: 'st-customer-fallback', name: 'Mesa Cliente (Demo)', role: 'customer', status: 'active', avatarColor: 'bg-pink-500', username: 'cliente', password: '123' });
    }
    return list;
  };

  const testAccounts = getDemoAccounts();

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Elegant top icon banner */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1E2F25] flex items-center justify-center text-[#FAFAFA] shadow-md border border-[#2E4A3F] mb-4">
          <Utensils size={24} className="animate-pulse" />
        </div>
        <h2 className="text-3xl font-serif italic text-[#1E2F25] tracking-wide">
          Sabor & Gestión
        </h2>
        <p className="mt-1 text-xs text-[#605850] uppercase tracking-widest font-extrabold">
          Terminal de Control de Restaurante
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E5E0D8] shadow-lg space-y-6">
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#2E2A25]">Inicio de Sesión Requerido</h3>
            <p className="text-3xs text-[#605850] mt-0.5">Introduce tus credenciales operativas asignadas por el Administrador.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorLine && (
              <div className="bg-[#FDF3EE] border border-[#ECC8B8] text-[#AE593E] p-3 rounded-xl flex items-start gap-2 h-auto text-xs animate-fadeIn font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorLine}</span>
              </div>
            )}

            <div>
              <label htmlFor="username-input" className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">
                Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#CAD9D0]">
                  <User size={16} />
                </div>
                <input
                  id="username-input"
                  type="text"
                  placeholder="P. ej. admin, sofia"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-xl pl-9 pr-3 py-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-2 focus:ring-[#2E4A3F]/20 focus:border-[#2E4A3F]"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#CAD9D0]">
                  <KeyRound size={16} />
                </div>
                <input
                  id="password-input"
                  type="password"
                  placeholder="Contraseña (p. ej. 123)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-xl pl-9 pr-3 py-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-2 focus:ring-[#2E4A3F]/20 focus:border-[#2E4A3F]"
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-[#2E4A3F] hover:bg-[#1E2F25] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E4A3F] shadow-sm transition active:scale-98 cursor-pointer"
            >
              Entrar al Sistema
            </button>
          </form>

          {/* Quick Helper checklist for Test accounts */}
          <div className="border-t border-[#E5E0D8] pt-5 mt-5 space-y-3">
            <h4 className="text-3xs uppercase font-extrabold text-[#605850] tracking-widest text-center">
              Cuentas demo para probar el sistema:
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {testAccounts.map(account => (
                <div
                  key={account.id}
                  onClick={() => {
                    setUsername(account.username || '');
                    setPassword(account.password || '123');
                  }}
                  className="bg-[#FAF8F5] md:hover:bg-[#EFECE6] border border-[#E5E0D8] rounded-xl p-2.5 flex items-center justify-between text-left cursor-pointer transition"
                  title="Haz clic para autocompletar credenciales"
                >
                  <div>
                    <span className="block text-2xs font-extrabold text-[#2E2A25]">
                      {account.name}
                    </span>
                    <span className="inline-block text-3xs font-extrabold px-1.5 py-0.5 rounded-sm bg-slate-100 text-[#605850]">
                      {account.role === 'manager' 
                        ? '🔑 Administrador' 
                        : account.role === 'customer' 
                          ? '🍽️ Comensal / Cliente' 
                          : '🏃‍♂️ Mesero / Waiter'}
                    </span>
                  </div>
                  <div className="text-right text-3xs font-mono">
                    <div className="text-[#2E4A3F]">user: <strong className="font-extrabold">{account.username}</strong></div>
                    <div className="text-[#AE593E]">pass: <strong className="font-extrabold">{account.password || '123'}</strong></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#605850] text-center italic mt-2">
              💡 Puedes agregar más meseros con usuario/contraseña personalizados desde la pestaña "Personal de Turno" logueado como Administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
