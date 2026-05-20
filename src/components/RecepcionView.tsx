import React, { useState } from 'react';
import { 
  Calendar, Users, Clock, Plus, Search, BookmarkCheck, CheckCircle2, 
  XSquare, BookOpen, UserPlus, Table, HelpCircle, Utensils, Sparkles, RefreshCw
} from 'lucide-react';
import { RestaurantTable, StaffMember } from '../types';

interface Reservation {
  id: string;
  customerName: string;
  guestsCount: number;
  dateTime: string;
  tableId?: string; // Optative preference or assignment
  status: 'confirmada' | 'pendiente' | 'comensal_llego' | 'cancelada';
  notes?: string;
}

interface RecepcionViewProps {
  tables: RestaurantTable[];
  staff: StaffMember[];
  onUpdateTable: (tableId: string, fields: Partial<RestaurantTable>) => void;
  currentUser: StaffMember;
}

export default function RecepcionView({ tables, staff, onUpdateTable, currentUser }: RecepcionViewProps) {
  // Persistence of Reservations
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('resto_reservations_v2');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'res-1', customerName: 'Familia Ortega', guestsCount: 4, dateTime: '2026-05-20T21:00', tableId: 't-3', status: 'confirmada', notes: 'Prefieren mesa en rincón tranquilo. Festejo de cumpleaños.' },
      { id: 'res-2', customerName: 'Dra. Elena Ramos', guestsCount: 2, dateTime: '2026-05-20T22:30', tableId: 't-1', status: 'pendiente', notes: 'Requiere accesibilidad para silla de ruedas.' },
      { id: 'res-3', customerName: 'Lic. Javier Solís', guestsCount: 6, dateTime: '2026-05-21T18:00', tableId: 't-4', status: 'confirmada', notes: 'Reunión de negocios.' },
      { id: 'res-4', customerName: 'Sofía Castro', guestsCount: 3, dateTime: '2026-05-20T19:30', tableId: 't-7', status: 'comensal_llego', notes: 'Asignada a Terraza.' }
    ];
  });

  const saveReservations = (newRes: Reservation[]) => {
    setReservations(newRes);
    localStorage.setItem('resto_reservations_v2', JSON.stringify(newRes));
  };

  // Form states
  const [newCustName, setNewCustName] = useState('');
  const [newGuests, setNewGuests] = useState(2);
  const [newTime, setNewTime] = useState('20:00');
  const [newDate, setNewDate] = useState('2026-05-20');
  const [newTableId, setNewTableId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Stats
  const totalReservations = reservations.length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmada').length;
  const pendingCount = reservations.filter(r => r.status === 'pendiente').length;

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      customerName: newCustName,
      guestsCount: Number(newGuests),
      dateTime: `${newDate}T${newTime}`,
      tableId: newTableId || undefined,
      status: 'confirmada',
      notes: newNotes
    };

    saveReservations([...reservations, newRes]);
    
    // Clear fields
    setNewCustName('');
    setNewGuests(2);
    setNewTableId('');
    setNewNotes('');
    setIsFormOpen(false);
  };

  const handleStatusChange = (id: string, status: Reservation['status']) => {
    const updated = reservations.map(r => {
      if (r.id !== id) return r;
      
      // If client arrived, optionally occupy the associated table if defined
      if (status === 'comensal_llego' && r.tableId) {
        onUpdateTable(r.tableId, { status: 'ocupada' });
      }
      return { ...r, status };
    });
    saveReservations(updated);
  };

  // Assign physical Table to a reservation or walk-in client
  const handleAssignTableToReservation = (reservationId: string, tableId: string) => {
    const updated = reservations.map(r => {
      if (r.id === reservationId) {
        // Mark table as occupied
        onUpdateTable(tableId, { status: 'ocupada' });
        return { ...r, tableId, status: 'comensal_llego' as const };
      }
      return r;
    });
    saveReservations(updated);
  };

  const filteredReservations = reservations.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#2E4A3F] text-white">
              <Plus size={16} />
            </span>
            <h2 className="text-xl font-serif font-black text-[#2E2A25]">Estación de Recepción y Reservaciones</h2>
          </div>
          <p className="text-xs text-[#605850]">Visualiza el estado de las mesas, gestiona las reservas, asigna mesas a comensales y entrega menús de inmediato.</p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Calendar size={14} /> {isFormOpen ? 'Ver Reservaciones' : 'Nueva Reservación'}
        </button>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EBF2EE] flex items-center justify-center text-[#2E4A3F]">
            <Calendar size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Total Reservas</span>
            <span className="text-lg font-bold text-[#2E2A25]">{totalReservations}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <BookmarkCheck size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Confirmadas</span>
            <span className="text-lg font-bold text-emerald-700">{confirmedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <Clock size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Pendientes</span>
            <span className="text-lg font-bold text-amber-700">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FDF3EE] flex items-center justify-center text-[#AE593E]">
            <Table size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Libres p/ Asignar</span>
            <span className="text-lg font-bold text-[#AE593E]">
              {tables.filter(t => t.status === 'disponible').length} / {tables.length}
            </span>
          </div>
        </div>
      </div>

      {isFormOpen ? (
        /* CREATE RESERVATION FORM */
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="border-b border-[#E5E0D8] pb-3">
            <h3 className="font-serif font-black text-[#2E2A25] text-base">Registrar Nueva Reservación</h3>
            <p className="text-[11px] text-[#605850]">Asigna mesas preferentes y anota necesidades del cliente.</p>
          </div>

          <form onSubmit={handleAddReservation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Nombre Completo del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Carlos Salinas"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Número de Comensales</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newGuests}
                  onChange={(e) => setNewGuests(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Fecha de Selección</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Hora Programada</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Sugerir Mesa (Opcional)</label>
                <select
                  value={newTableId}
                  onChange={(e) => setNewTableId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F]"
                >
                  <option value="">-- Sin mesa preferida --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Mesa #{t.number} ({t.capacity} personas - {t.section})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Anotaciones / Preferencias (Alergias, Ubicación, etc.)</label>
              <textarea
                placeholder="Escribe aquí notas adicionales..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F] h-20 resize-none"
              ></textarea>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-[#E5E0D8] hover:bg-[#FAF8F5] text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ✓ Guardar Reservación
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TWO-COLUMN LAYOUT: TABLES DISPOSITION & RESERVATIONS LIST */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT PANEL (7 Cols): Table overview, Assigning and delivering menu */}
          <div className="xl:col-span-7 bg-white p-5 rounded-2xl border border-[#E5E0D8] space-y-4">
            <div className="border-b border-[#E5E0D8] pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-[#2E2A25] flex items-center gap-1.5 font-serif">
                  <Table className="text-[#2E4A3F]" size={16} /> Distribución Física y Entrega de Menús
                </h3>
                <p className="text-[11px] text-[#605850]">Asigna mesas libres a clientes al instante y marca la entrega del Menú Digital o Físico.</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-250 text-[#2E4A3F] text-[9px] font-mono rounded font-bold">
                Módulos de Servicios
              </span>
            </div>

            {/* Micro grid of active tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tables.map(table => {
                const isOccupied = table.status === 'ocupada';
                const isWaitingBill = table.status === 'cuenta_pedida';
                const menuDelivered = !!table.menuDelivered;

                let borderStyle = 'border-[#EBF2EE] bg-[#FAF8F5]';
                let statusLabel = 'Disponible / Libre';
                let tagColor = 'bg-[#EBF2EE] text-[#2E4A3F]';

                if (isOccupied) {
                  borderStyle = 'border-amber-250 bg-amber-50/20';
                  statusLabel = 'Ocupada / Consumo';
                  tagColor = 'bg-amber-100 text-amber-800';
                } else if (isWaitingBill) {
                  borderStyle = 'border-rose-250 bg-rose-50/20';
                  statusLabel = 'Pidiendo Cuenta';
                  tagColor = 'bg-rose-100 text-rose-800';
                }

                return (
                  <div key={table.id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition group relative ${borderStyle}`}>
                    
                    {/* Badge of Menu Delivered indicator */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {menuDelivered ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-serif text-[7px] font-black flex items-center gap-0.5" title="¡Menú entregado!">
                          📖 Menú Entregado
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-serif text-[7px] font-bold" title="Menú pendiente de entregar">
                          📖 Sin Menú
                        </span>
                      )}
                    </div>

                    <div>
                      {/* Section tag */}
                      <span className="text-[8px] uppercase tracking-widest text-[#605850] font-black">{table.section}</span>
                      <h4 className="text-lg font-serif font-black text-[#1E2F25] mt-0.5">Mesa #{table.number}</h4>
                      <p className="text-[10px] text-[#605850] font-mono mt-0.5">Capacidad: {table.capacity} comensales</p>
                    </div>

                    {/* Quick controls status */}
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-[#E5E0D8]">
                      <span className={`inline-block px-2 py-0.5 font-mono font-bold text-[9px] uppercase rounded ${tagColor}`}>
                        {statusLabel}
                      </span>

                      {/* Interactive menu delivery toggle button */}
                      <button
                        onClick={() => {
                          onUpdateTable(table.id, { menuDelivered: !menuDelivered });
                        }}
                        className={`w-full py-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer ${
                          menuDelivered 
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300' 
                            : 'bg-[#2E4A3F] hover:bg-[#1E2F25] text-white'
                        }`}
                      >
                        <BookOpen size={10} />
                        {menuDelivered ? '✓ Quitar Menú' : '📖 Entregar Menú'}
                      </button>

                      {/* Direct state assignments */}
                      <div className="flex gap-1">
                        {!isOccupied ? (
                          <button
                            onClick={() => onUpdateTable(table.id, { status: 'ocupada' })}
                            className="flex-1 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[8px] text-center transition cursor-pointer"
                          >
                            🛎️ Ocupar
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateTable(table.id, { status: 'disponible', menuDelivered: false })}
                            className="flex-1 py-1 bg-[#FAF8F5] border border-[#E5E0D8] hover:bg-[#EFECE6] text-[#2E2A25] font-semibold rounded text-[8px] text-center transition cursor-pointer"
                          >
                            🔓 Liberar Mesa
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Quick action details info */}
            <div className="bg-[#FAF8F5] border border-[#CAD9D0] p-4 rounded-xl flex items-start gap-2.5">
              <span className="text-lg">🛎️</span>
              <div className="text-[11px] text-[#605850] leading-relaxed">
                <span className="font-bold text-[#2E4A3F]">Rol del Recepcionista:</span> Al llegar un cliente nuevo, asígnale una mesa disponible de inmediato y presiona <strong>"Entregar Menú"</strong>. Esto activará el acrílico digital de mesa para que el cliente pueda escanear de la carta digital de forma inmediata.
              </div>
            </div>

          </div>

          {/* RIGHT PANEL (5 Cols): Reservations listing, searching, arriving triggers */}
          <div className="xl:col-span-5 bg-white p-5 rounded-2xl border border-[#E5E0D8] space-y-4">
            
            <div className="border-b border-[#E5E0D8] pb-3">
              <h3 className="text-sm font-extrabold text-[#2E2A25] flex items-center gap-1.5 font-serif">
                <Calendar className="text-[#2E4A3F]" size={16} /> Agenda de Reservaciones
              </h3>
              <p className="text-[11px] text-[#605850]">Listado sistemático y búsqueda de reservaciones activas.</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Search size={12} />
              </span>
              <input
                type="text"
                placeholder="Buscar reservación por apellido o nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs p-2 pl-8 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-slate-800 focus:outline-[#2E4A3F]"
              />
            </div>

            {/* Reservation items list */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredReservations.map(res => {
                const assignedTable = tables.find(t => t.id === res.tableId);
                
                let badgeColor = 'bg-amber-100 text-amber-800 border-amber-250';
                let label = 'Pendiente por confirmar';
                if (res.status === 'confirmada') {
                  badgeColor = 'bg-emerald-100 text-[#2E4A3F] border-emerald-250';
                  label = 'Confirmada';
                } else if (res.status === 'comensal_llego') {
                  badgeColor = 'bg-purple-100 text-purple-800 border-purple-250';
                  label = 'Llegó / Sentado';
                } else if (res.status === 'cancelada') {
                  badgeColor = 'bg-rose-100 text-rose-800 border-rose-250';
                  label = 'Cancelada';
                }

                const resDate = new Date(res.dateTime);
                const isToday = resDate.toDateString() === new Date().toDateString();

                return (
                  <div key={res.id} className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8]/80 rounded-xl space-y-2.5 hover:bg-[#FAF8F5]/50 transition">
                    
                    {/* Header line of item */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-black text-xs text-[#2E2A25]">{res.customerName}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[8px] uppercase border ${badgeColor}`}>
                            {label}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 rounded font-bold text-[8px] uppercase">
                              Hoy 📅
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] font-mono text-[#AE593E] font-bold">
                          🕒 {resDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="block text-[8px] font-mono text-[#605850]">
                          {resDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Guests and Table preferences info line */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded-lg border border-[#E5E0D8]/40">
                      <div className="flex items-center gap-1 text-[#605850]">
                        <Users size={12} className="text-[#2E4A3F]" />
                        <span>Comensales: <strong>{res.guestsCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-[#605850]">
                        <Table size={12} className="text-[#2E4A3F]" />
                        <span>Preferencia: {assignedTable ? <strong>#{assignedTable.number}</strong> : <span className="italic">N/A</span>}</span>
                      </div>
                    </div>

                    {res.notes && (
                      <p className="text-[10px] text-[#2E4A3F] italic bg-[#EBF2EE] p-2 rounded border border-[#E5ECE9]">
                        💡 "{res.notes}"
                      </p>
                    )}

                    {/* Actions box */}
                    <div className="flex gap-1.5 justify-end pt-1 border-t border-dashed border-[#E5E0D8]/80">
                      
                      {res.status !== 'comensal_llego' && res.status !== 'cancelada' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(res.id, 'cancelada')}
                            className="px-2 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[9px] font-semibold hover:bg-rose-100 transition cursor-pointer"
                          >
                            ✕ Cancelar
                          </button>

                          {res.status === 'pendiente' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(res.id, 'confirmada')}
                              className="px-2 py-1 bg-emerald-50 text-[#2E4A3F] border border-emerald-250 rounded text-[9px] font-bold hover:bg-emerald-100 transition cursor-pointer animate-pulse"
                            >
                              ✓ Confirmar
                            </button>
                          )}

                          {/* Trigger seating / client arrival */}
                          <div className="relative inline-block">
                            {res.tableId ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(res.id, 'comensal_llego')}
                                className="px-2.5 py-1 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white rounded text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              >
                                🛎️ Sentar en #{assignedTable?.number}
                              </button>
                            ) : (
                              /* Seater chooser dropdown simulation if no table is preassigned */
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignTableToReservation(res.id, e.target.value);
                                  }
                                }}
                                className="text-[9px] p-1 font-bold bg-[#A3E635] text-slate-900 border border-emerald-500 rounded focus:outline-none cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>🛎️ Sentar en...</option>
                                {tables.filter(t => t.status === 'disponible').map(t => (
                                  <option key={t.id} value={t.id}>Mesa #{t.number} ({t.capacity}p)</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </>
                      )}

                      {res.status === 'comensal_llego' && (
                        <span className="text-[9px] text-[#2E4A3F] font-bold flex items-center gap-1 bg-[#EBF2EE] px-2 py-0.5 rounded border border-[#E5ECE9]">
                          <CheckCircle2 size={10} className="text-emerald-600" /> Sentado y atendido
                        </span>
                      )}

                      {res.status === 'cancelada' && (
                        <span className="text-[9px] text-rose-800 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-150">
                          <XSquare size={10} className="text-rose-600" /> Reservación Cancelada
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

              {filteredReservations.length === 0 && (
                <p className="text-xs text-[#605850] italic text-center py-10 bg-[#FAF8F5] rounded-xl border border-dashed border-[#E5E0D8]">
                  No se encontraron reservaciones que coincidan con la búsqueda.
                </p>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
