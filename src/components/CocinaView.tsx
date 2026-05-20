import React, { useState } from 'react';
import { 
  Clock, Flame, CheckCircle2, ChevronRight, Filter, AlertCircle, 
  UtensilsCrossed, SquarePlay, CheckSquare, Sparkles 
} from 'lucide-react';
import { Order, MenuItem, ItemStatus } from '../types';

interface CocinaViewProps {
  orders: Order[];
  menu: MenuItem[];
  onUpdateItemStatus: (orderId: string, itemId: string, newStatus: ItemStatus) => void;
}

export default function CocinaView({
  orders,
  menu,
  onUpdateItemStatus
}: CocinaViewProps) {
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // Find all active orders (not paid or cancelled) that have kitchen items cooking/pending
  const activeOrders = orders.filter(
    o => o.status !== 'pagada' && o.status !== 'cancelada'
  );

  // Flatten items with their respective order context
  interface KitchenTask {
    orderId: string;
    customerName: string;
    tableId: string;
    orderCreatedAt: string;
    itemId: string;
    menuItemId: string;
    quantity: number;
    notes: string;
    status: ItemStatus;
    menuItemName: string;
    category: string;
    prepTimeMinutes: number;
  }

  const tasks: KitchenTask[] = [];

  activeOrders.forEach(order => {
    order.items.forEach(item => {
      // Chefs only need to see items that are 'pendiente' or 'preparando'
      // Once 'listo' or 'entregado', they disappear from the kitchen active board
      if (item.status === 'pendiente' || item.status === 'preparando') {
        const menuItem = menu.find(m => m.id === item.menuItemId);
        if (menuItem) {
          tasks.push({
            orderId: order.id,
            customerName: order.customerName,
            tableId: order.tableId,
            orderCreatedAt: order.createdAt,
            itemId: item.itemId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            status: item.status,
            menuItemName: menuItem.name,
            category: menuItem.category,
            prepTimeMinutes: menuItem.prepTimeMinutes
          });
        }
      }
    });
  });

  // Filter tasks by culinary station category
  const filteredTasks = tasks.filter(task => {
    if (selectedStation === 'all') return true;
    if (selectedStation === 'entradas') return task.category === 'entrada';
    if (selectedStation === 'platos_fuertes') return task.category === 'plato_fuerte';
    if (selectedStation === 'postres') return task.category === 'postre';
    if (selectedStation === 'bebidas') return task.category === 'bebida';
    return true;
  });

  // Sort: 'preparando' first (priority commitment), then 'pendiente' (queue-in), and then by oldest created tickets
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'preparando' && b.status === 'pendiente') return -1;
    if (a.status === 'pendiente' && b.status === 'preparando') return 1;
    return new Date(a.orderCreatedAt).getTime() - new Date(b.orderCreatedAt).getTime();
  });

  // Basic counters
  const totalPending = tasks.filter(t => t.status === 'pendiente').length;
  const totalPreparing = tasks.filter(t => t.status === 'preparando').length;

  const getElapsedTime = (createdAtString: string) => {
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(createdAtString).getTime()) / (60 * 1000)
    );
    // Safety guard for timezone shifts/simulations
    return elapsedMinutes < 0 ? 0 : elapsedMinutes;
  };

  const getTimePillColor = (elapsedMinutes: number, prepTime: number) => {
    if (elapsedMinutes >= prepTime + 5) {
      return 'bg-[#FDF3EE] text-[#AE593E] border-[#ECC8B8] animate-pulse font-bold';
    }
    if (elapsedMinutes >= prepTime) {
      return 'bg-[#FAF0DE] text-[#785C24] border-[#E8DCBF]';
    }
    return 'bg-[#FAF8F5] text-[#605850] border-[#E5E0D8]';
  };

  return (
    <div className="space-y-6">
      {/* Upper Widgets Card Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#2E4A3F] uppercase">Estación de Cocina</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono">{tasks.length}</h3>
            <p className="text-3xs text-[#605850]">Platillos cocinándose o en espera</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E5ECE9] text-[#2E4A3F] flex items-center justify-center">
            <Flame size={20} />
          </div>
        </div>

        <div className="bg-[#FAF0DE] p-4 rounded-2xl border border-[#E8DCBF] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#785C24] uppercase font-bold">En Preparación</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono">{totalPreparing}</h3>
            <p className="text-3xs text-[#605850]">Fuegos encendidos en estufa</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white text-[#785C24] flex items-center justify-center border border-[#E8DCBF]">
            <Flame size={20} className="animate-bounce" />
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#605850] uppercase">Esperando Turno</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono">{totalPending}</h3>
            <p className="text-3xs text-[#605850]">Tickets en fila de espera</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EFECE6] text-[#605850] flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Stations and Filter bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E5E0D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#605850]" />
          <span className="text-xs font-bold text-[#2E2A25] uppercase font-serif">Filtro de Estación:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Ver Toda la Cocina' },
            { id: 'entradas', label: '🥗 Entradas / Fríos' },
            { id: 'platos_fuertes', label: '🍔 Platos Fuertes / Plancha' },
            { id: 'postres', label: '🍰 Postres / Repostería' },
            { id: 'bebidas', label: '☕ Bebidas / Barra' },
          ].map(station => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station.id)}
              className={`px-3 py-1 text-xs rounded-full border transition font-medium cursor-pointer ${
                selectedStation === station.id
                  ? 'bg-[#2E4A3F] text-white border-[#2E4A3F] shadow-sm'
                  : 'bg-white text-[#605850] border-[#E5E0D8] hover:bg-[#FAF8F5]'
              }`}
            >
              {station.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Ticket Cooking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTasks.map(task => {
          const elapsed = getElapsedTime(task.orderCreatedAt);
          const isLate = elapsed >= task.prepTimeMinutes;

          return (
            <div 
              key={`${task.orderId}-${task.itemId}`}
              id={`kitchen-task-${task.itemId}`}
              className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all duration-150 relative overflow-hidden shadow-xs ${
                task.status === 'preparando' 
                  ? 'border-[#2E4A3F] border-2 bg-[#FAF8F5]' 
                  : 'border-[#E5E0D8]'
              }`}
            >
              {/* Overdue alert tab overlay */}
              {isLate && (
                <div className="absolute top-0 right-0 bg-[#AE593E] text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-bl font-serif">
                  Urgente • Demorado
                </div>
              )}

              {/* Title & Ticket Header */}
              <div>
                <div className="flex justify-between items-start mb-2 pr-10">
                  <div>
                    <span className="inline-flex text-[10px] font-bold text-[#2E4A3F] bg-[#E5ECE9] rounded px-1.5 py-0.5 mb-1 mr-1">
                      Mesa {task.tableId.replace('t-', '')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#605850] tracking-wide font-mono">
                      Ticket #{task.orderId.substring(4)}
                    </span>
                  </div>
                  <div className={`p-1 px-1.5 rounded-full border text-3xs font-mono flex items-center gap-1 ${getTimePillColor(elapsed, task.prepTimeMinutes)}`}>
                    <Clock size={10} />
                    <span>Hace {elapsed}m</span>
                  </div>
                </div>

                <div className="border-b border-[#E5E0D8] pb-3 mb-3">
                  <div className="flex items-start gap-1 justify-between">
                    <h4 className="text-base font-extrabold text-[#2E2A25] leading-tight font-serif">
                      {task.quantity}x {task.menuItemName}
                    </h4>
                  </div>
                  <span className="text-3xs uppercase font-semibold text-[#605850] bg-[#FAF8F5] px-1.5 py-0.5 rounded mt-1 inline-block capitalize border border-[#E5E0D8]">
                    Estación: {task.category.replace('_', ' ')} (Est. {task.prepTimeMinutes} min)
                  </span>
                </div>

                {/* Warning critical customized notes */}
                {task.notes && (
                  <div className="bg-[#FAF0DE] border border-[#E8DCBF] p-2 rounded-lg flex items-start gap-1.5 mb-3">
                    <AlertCircle className="text-[#785C24] shrink-0 mt-0.5" size={14} />
                    <div>
                      <span className="block text-[10px] font-extrabold text-[#785C24] uppercase tracking-wide">INDICACIÓN DE MESERO:</span>
                      <p className="text-xs font-semibold text-[#2E2A25] italic">"{task.notes}"</p>
                    </div>
                  </div>
                )}

                <div className="text-3xs text-[#605850] space-y-0.5">
                  <p>Cliente: <span className="font-bold text-[#2E2A25] font-sans">{task.customerName}</span></p>
                  <p>Inició: <span className="font-mono">{new Date(task.orderCreatedAt).toLocaleTimeString()}</span></p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#E5E0D8] mt-4 flex items-center justify-between">
                <div>
                  {task.status === 'pendiente' ? (
                    <span className="text-3xs font-extrabold text-[#605850] uppercase tracking-widest flex items-center gap-1">
                      <Clock size={12} /> EN FILA
                    </span>
                  ) : (
                    <span className="text-3xs font-extrabold text-[#2E4A3F] uppercase tracking-widest flex items-center gap-1 font-bold">
                      <Flame size={12} className="text-[#2E4A3F] animate-pulse" /> PREPARANDO...
                    </span>
                  )}
                </div>

                <div>
                  {task.status === 'pendiente' ? (
                    <button
                      onClick={() => onUpdateItemStatus(task.orderId, task.itemId, 'preparando')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#C97A53] hover:bg-[#B76741] rounded-lg transition cursor-pointer"
                    >
                      <SquarePlay size={12} /> Cocinar
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateItemStatus(task.orderId, task.itemId, 'listo')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#2E4A3F] hover:bg-[#1E2F25] rounded-lg transition shadow-xs hover:shadow-sm cursor-pointer"
                    >
                      <CheckSquare size={12} /> Marcar Listo
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sortedTasks.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-[#FAF8F5] rounded-2xl border-2 border-dashed border-[#CAD9D0] text-[#605850]">
            <UtensilsCrossed size={48} className="text-[#CAD9D0] mb-3" />
            <h3 className="text-base font-bold text-[#2E2A25] font-serif">Cocina limpia y al día</h3>
            <p className="text-xs text-[#605850] max-w-sm mt-1 leading-relaxed">No hay pedidos pendientes para preparar en esta estación en este instante. ¡Excelente trabajo!</p>
          </div>
        )}
      </div>
    </div>
  );
}
