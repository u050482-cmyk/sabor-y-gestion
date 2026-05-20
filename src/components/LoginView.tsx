import React, { useState } from 'react';
import { StaffMember, RestaurantTable } from '../types';
import { KeyRound, User, Utensils, AlertCircle, QrCode, Camera } from 'lucide-react';

interface LoginViewProps {
  staff: StaffMember[];
  tables: RestaurantTable[];
  onLoginSuccess: (user: StaffMember) => void;
}

export default function LoginView({ staff, tables, onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorLine, setErrorLine] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [simulatedScanningTable, setSimulatedScanningTable] = useState<string | null>(null);
  const [isStaffLoginVisible, setIsStaffLoginVisible] = useState(false);

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
    const chefAcc = staff.find(s => s.role === 'chef') || staff.find(s => s.username === 'chef1');
    const receptionistAcc = staff.find(s => s.role === 'receptionist');
    const customerAcc = staff.find(s => s.role === 'customer') || staff.find(s => s.username === 'cliente');
    
    const list = [adminAcc, waiterAcc];
    if (chefAcc) {
      list.push(chefAcc);
    }
    if (receptionistAcc) {
      list.push(receptionistAcc);
    }
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-[#2E4A3F] hover:bg-[#1E2F25] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E4A3F] shadow-sm transition active:scale-98 cursor-pointer font-sans"
            >
              Entrar al Sistema
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#E5E0D8]"></div>
              <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-extrabold uppercase font-sans tracking-widest">O ACCEDE COMO COMENSAL</span>
              <div className="flex-grow border-t border-[#E5E0D8]"></div>
            </div>

            <button
              id="btn-login-qr-scanner"
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-dashed border-[#CAD9D0] bg-[#FAF8F5] text-[#2E4A3F] font-bold rounded-xl text-xs hover:bg-[#EFECE6] transition cursor-pointer font-sans"
            >
              <QrCode size={16} />
              📲 Escanear Código QR de Mesa
            </button>
          </form>

          {/* QR SCANNER VIEWPORT MODAL SIMULATION */}
          {isQrScannerOpen && (
            <div className="fixed inset-0 bg-[#121B15]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-5 animate-scaleUp">
                
                {/* Header info */}
                <div className="flex justify-between items-center pb-2 border-b border-[#E5E0D8]">
                  <div className="flex items-center gap-1.5 text-[#2E4A3F]">
                    <Camera size={18} className="animate-pulse" />
                    <h3 className="font-serif font-bold text-[#2E2A25] text-base">Escáner QR Integrado</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsQrScannerOpen(false);
                      setSimulatedScanningTable(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 rounded-full p-1 bg-gray-100 hover:bg-gray-200 cursor-pointer text-xs"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                {simulatedScanningTable ? (
                  <div className="py-8 text-center space-y-4 animate-pulse">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#E5ECE9] flex items-center justify-center text-3xl">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#2E2A25]">Escaneando Código de Mesa...</h4>
                      <p className="text-3xs text-[#605850] mt-1 uppercase tracking-widest font-mono">ID Detectado: MESA-{simulatedScanningTable}</p>
                    </div>
                    <div className="w-1/2 mx-auto bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2E4A3F] h-full animate-progress animate-infinite duration-1000" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-[#605850] leading-relaxed text-center">
                      Simula el escaneo con la cámara del celular. Selecciona la Mesa correspondiente al código QR impreso en el acrílico físico:
                    </p>

                    {/* Camera simulation viewport with crosshair lines */}
                    <div className="relative w-full h-44 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-4 border-slate-950">
                      
                      {/* Scanning crosshair line overlay animation */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-bounce" style={{ animationDuration: '3s' }}></div>
                      
                      {/* Virtual brackets framing the screen */}
                      <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-[#7bf59e] rounded-tl"></div>
                      <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-[#7bf59e] rounded-tr"></div>
                      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-[#7bf59e] rounded-bl"></div>
                      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-[#7bf59e] rounded-br"></div>
                      
                      <div className="text-center space-y-2 opacity-50 z-10 text-white select-none">
                        <QrCode size={48} className="mx-auto" />
                        <span className="block text-4xs font-mono tracking-widest">ALINEAR CÓDIGO QR MESA</span>
                      </div>
                    </div>

                    {/* Interactive table grid to scan */}
                    <div className="space-y-2">
                      <span className="block text-3xs font-black uppercase text-[#605850] tracking-wider mb-1 text-center">Toca una mesa para simular el escaneo:</span>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {tables.map(table => {
                          let labelColor = 'border-[#CAD9D0] bg-[#EBF2EE] text-[#2F483A]';
                          if (table.status === 'ocupada') {
                            labelColor = 'border-amber-200 bg-[#FAF0DE] text-[#785C24]';
                          } else if (table.status === 'cuenta_pedida') {
                            labelColor = 'border-red-200 bg-[#FDF3EE] text-[#AE593E]';
                          }

                          return (
                            <button
                              key={table.id}
                              type="button"
                              onClick={() => {
                                setSimulatedScanningTable(table.id);
                                setTimeout(() => {
                                  // Locate or define comensal account
                                  const customerAccount = staff.find(s => s.role === 'customer') || {
                                    id: 'st-8',
                                    name: 'Mesa Cliente (Demo)',
                                    role: 'customer',
                                    status: 'active',
                                    avatarColor: 'bg-pink-500',
                                    username: 'cliente',
                                    password: '123'
                                  };
                                  localStorage.setItem('resto_cliente_table_id', table.id);
                                  onLoginSuccess(customerAccount);
                                }, 1300);
                              }}
                              className={`p-2.5 rounded-xl border text-center transition hover:scale-102 flex flex-col justify-center items-center shadow-xs cursor-pointer ${labelColor}`}
                            >
                              <span className="text-xs font-black font-serif text-slate-800">#{table.number}</span>
                              <span className="text-[7px] block font-mono font-bold mt-0.5 opacity-80 uppercase">{table.status === 'disponible' ? 'Libre' : 'Uso'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-[9px] text-[#AE593E] italic mt-2 text-center font-semibold">
                      💡 El escaneo te otorgará acceso directo al Menú Digital y te asociará a la mesa seleccionada.
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

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
                          : account.role === 'chef'
                            ? '🧑‍🍳 Chef Cocinero'
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
