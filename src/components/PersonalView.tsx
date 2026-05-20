import React, { useState } from 'react';
import { 
  UserPlus, UserMinus, Shield, HelpCircle, UtensilsCrossed, 
  Smile, UserCheck, Phone, Mail, Award, Check 
} from 'lucide-react';
import { StaffMember, StaffRole, StaffStatus } from '../types';

interface PersonalViewProps {
  staff: StaffMember[];
  onAddStaffMember: (member: Omit<StaffMember, 'id' | 'avatarColor'>) => void;
  onUpdateStaffMember: (id: string, updated: Partial<StaffMember>) => void;
  onDeleteStaffMember: (id: string) => void;
}

export default function PersonalView({
  staff,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember
}: PersonalViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('waiter');
  const [status, setStatus] = useState<StaffStatus>('active');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Normalizar y remover acentos para autogenerar un usuario limpio si se requiere
    const cleanName = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const generatedUsername = username.trim() || cleanName.replace(/[^a-z0-9]/g, '');
    const generatedPassword = password.trim() || '123';

    onAddStaffMember({
      name: name.trim(),
      role,
      status,
      username: generatedUsername,
      password: generatedPassword
    });

    // Reset Form
    setName('');
    setRole('waiter');
    setStatus('active');
    setUsername('');
    setPassword('');
    setIsFormOpen(false);
  };

  const getRoleTheme = (staffRole: StaffRole) => {
    switch (staffRole) {
      case 'manager':
        return { label: 'Gerente / Administrador', color: 'bg-[#EFECE6] text-[#2E2A25] border-[#E5E0D8]', icon: '🔑' };
      case 'chef':
        return { label: 'Chef / Cocinero', color: 'bg-[#FAF0DE] text-[#785C24] border-[#E8DCBF]', icon: '🍳' };
      case 'waiter':
        return { label: 'Mesero / Servicio de Salon', color: 'bg-[#E5ECE9] text-[#2E4A3F] border-[#CAD9D0]', icon: '🏃‍♂️' };
      case 'cashier':
        return { label: 'Cajero / Facturación', color: 'bg-[#FDF3EE] text-[#AE593E] border-[#ECC8B8]', icon: '💳' };
      case 'customer':
        return { label: 'Comensal / Cliente (Portal)', color: 'bg-[#FDF2F5] text-[#9D275A] border-[#ECC6D2]', icon: '🍽️' };
    }
  };

  const getStatusBadge = (staffStatus: StaffStatus) => {
    switch (staffStatus) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-[#E5ECE9] text-[#2E4A3F] border border-[#CAD9D0]">🟢 Activo</span>;
      case 'break':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-[#FAF0DE] text-[#785C24] border border-[#E8DCBF]">🟡 En Descanso</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-[#FDF3EE] text-[#AE593E] border border-[#ECC8B8]">🔴 Inactivo</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner and triggers */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2E2A25] tracking-tight font-serif">Plantilla de Personal</h2>
          <p className="text-xs text-[#605850]">Administra turnos, roles de trabajo (Chefs, Meseros, Cajeros) y registra nuevas contrataciones.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          id="btn-nuevo-personal-toggle"
          className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#2E4A3F] rounded-xl hover:bg-[#1E2F25] transition cursor-pointer"
        >
          <UserPlus size={16} className="mr-2" />
          {isFormOpen ? 'Cerrar registro' : 'Registrar Nuevo Empleado'}
        </button>
      </div>

      {/* Roster Hire Form drawer */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 border border-[#E5E0D8] shadow-xs max-w-xl animate-fadeIn">
          <h3 className="text-sm font-extrabold text-[#2E2A25] mb-4 flex items-center font-serif">
            <UserPlus className="text-[#2E4A3F] mr-2" size={18} /> Registrar Nueva Contratación o Alta
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Nombre Completo del Empleado</label>
                <input
                  type="text"
                  placeholder="P. ej. Luis Fernando Ruiz"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Puesto / Rol Operativo</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as StaffRole)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                >
                  <option value="waiter">🏃‍♂️ Mesero / Servicio de Salon</option>
                  <option value="chef">🍳 Chef / Cocina caliente</option>
                  <option value="cashier">💳 Cajero / Receptor de Pagos</option>
                  <option value="manager">🔑 Administrador / Gerente</option>
                  <option value="customer">🍽️ Comensal / Cliente (Portal)</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Nombre de Usuario (Para Login)</label>
                <input
                  type="text"
                  placeholder="P. ej. luisr o meseroluis"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Contraseña de Acceso</label>
                <input
                  type="text"
                  placeholder="Contraseña (p. ej. 1234)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Estado del Turno Inicial</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as StaffStatus)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                >
                  <option value="active">🟢 Activo / Listo para Turno</option>
                  <option value="break">🟡 En Descanso / Pausa</option>
                  <option value="inactive">🔴 Inactivo / Fuera de servicio</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-xs font-bold text-[#605850] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-guardar-personal"
                className="px-4 py-2 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Dar de Alta Empleado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roster display - Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {staff.map(member => {
          const roleInfo = getRoleTheme(member.role);
          const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div 
              key={member.id}
              className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex flex-col justify-between hover:shadow-md transition-all duration-150"
            >
              {/* Profile card upper snippet */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  
                  {/* Decorative Profile Initial Circle Avatar */}
                  <div className={`w-11 h-11 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-inner`}>
                    {initials}
                  </div>

                  {/* Actions Trash */}
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de registrar la baja médica o retiro de "${member.name}"?`)) {
                        onDeleteStaffMember(member.id);
                      }
                    }}
                    className="text-[#CAD9D0] hover:text-[#AE593E] p-1 rounded-lg border border-transparent hover:border-[#ECC8B8] hover:bg-[#FDF3EE] transition cursor-pointer"
                    title="Dar de Baja"
                    id={`btn-baja-personal-${member.id}`}
                  >
                    <UserMinus size={15} />
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-[#2E2A25] leading-tight truncate font-serif">{member.name}</h4>
                  <span className="text-3xs uppercase font-extrabold text-[#605850] block tracking-wider mt-0.5">ID: {member.id}</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className={`px-2 py-1 rounded-md text-3xs font-extrabold border flex items-center justify-center gap-1 text-center ${roleInfo?.color}`}>
                    <span>{roleInfo?.icon}</span>
                    <span>{roleInfo?.label}</span>
                  </div>

                  {/* Acceso para los meseros y demás personal */}
                  <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-2.5 space-y-1.5 text-3xs shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-[#605850] font-bold">Usuario:</span>
                      <span className="font-mono bg-[#EFECE6] text-[#2E4A3F] px-1.5 py-0.5 rounded font-black tracking-normal">
                        {member.username || 'sin_usuario'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#605850] font-bold">Contraseña:</span>
                      <span className="font-mono bg-[#EFECE6] text-[#AE593E] px-1.5 py-0.5 rounded font-black">
                        {member.password || '123'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-dashed border-[#E5E0D8]">
                    <span className="text-[#605850] font-extrabold text-3xs uppercase">Estado:</span>
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              </div>

              {/* Lower dynamic buttons to toggle state easily */}
              <div className="mt-5 pt-3 border-t border-[#E5E0D8] space-y-1.5">
                <span className="block text-[10px] text-center font-bold text-[#605850] uppercase tracking-wider mb-2">Modificar estado de turno:</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['active', 'break', 'inactive'] as StaffStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateStaffMember(member.id, { status: st })}
                      className={`py-1 text-3xs font-extrabold rounded-lg border transition cursor-pointer ${
                        member.status === st 
                          ? 'bg-[#2E4A3F] border-[#2E4A3F] text-white font-bold' 
                          : 'bg-white text-[#605850] border-[#E5E0D8] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {st === 'active' ? 'Turno' : st === 'break' ? 'Breik' : 'Off'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
