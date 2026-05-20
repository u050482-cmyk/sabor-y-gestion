import React, { useState } from 'react';
import { 
  RestaurantTable, MenuItem, StaffMember, Order, OrderItem, ItemStatus 
} from '../types';
import { 
  Utensils, BookOpen, Receipt, ChefHat, LayoutGrid, CheckCircle, Clock, 
  MapPin, Sparkles, CreditCard, DollarSign, MessageSquare, AlertCircle, 
  RefreshCw, ShoppingBag, Plus, Minus, Send, Trash2, ChevronRight 
} from 'lucide-react';

interface ClientePortalViewProps {
  tables: RestaurantTable[];
  menu: MenuItem[];
  orders: Order[];
  staff: StaffMember[];
  onUpdateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  onCloseOrder: (orderId: string, paymentMethod: 'efectivo' | 'tarjeta', tipPercentage: number, receivedAmount?: number, changeAmount?: number) => void;
  onOpenOrder: (tableId: string, customerName: string, waiterId: string, cartItems: { menuItemId: string; quantity: number; notes: string }[]) => void;
  onAddItemsToOrder: (orderId: string, itemsToAdd: { menuItemId: string; quantity: number; notes: string }[]) => void;
  currentUser: StaffMember;
}

type ModePanel = 'mesa' | 'menu' | 'pago' | 'chefs';

export default function ClientePortalView({
  tables,
  menu,
  orders,
  staff,
  onUpdateTableStatus,
  onCloseOrder,
  onOpenOrder,
  onAddItemsToOrder,
  currentUser
}: ClientePortalViewProps) {
  const [activePanel, setActivePanel] = useState<ModePanel>('mesa');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart for self-service ordering: record of menuItemId -> { quantity, notes }
  const [cart, setCart] = useState<Record<string, { quantity: number; notes: string }>>({});

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };
  
  // Table selected by user. Saved in localStorage to persist across navigation
  const [sessionTableId, setSessionTableId] = useState<string>(() => {
    const saved = localStorage.getItem('resto_cliente_table_id');
    return saved || 't-2'; // Default to table 2 for a ready active order
  });

  const selectSessionTable = (id: string) => {
    setSessionTableId(id);
    localStorage.setItem('resto_cliente_table_id', id);
    // Clear cart upon switching tables to prevent confusion
    setCart({});
    showToast(`📍 Te has ubicado virtualmente en la Mesa #${tables.find(t => t.id === id)?.number || '?'}`);
  };

  // Helper selectors
  const activeTable = tables.find(t => t.id === sessionTableId);
  
  // Find current order running on active table
  const currentOrder = orders.find(o => o.tableId === sessionTableId && o.status !== 'pagada' && o.status !== 'cancelada');

  // Filter food categories
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'entrada' | 'plato_fuerte' | 'postre' | 'bebida'>('todos');
  const [searchWord, setSearchWord] = useState('');

  // Payment simulated preferences
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'movil'>('tarjeta');
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [cashGiven, setCashGiven] = useState<string>('600');
  const [paymentDone, setPaymentDone] = useState(false);
  const [lastClosedOrder, setLastClosedOrder] = useState<{
    id: string;
    tableNumber: number;
    customerName: string;
    items: { name: string; quantity: number; price: number; notes?: string }[];
    subtotal: number;
    tipAmount: number;
    total: number;
    paymentMethod: 'efectivo' | 'tarjeta';
    receivedAmount?: number;
    changeAmount?: number;
    date: string;
    waiterName: string;
  } | null>(null);

  // Filtered menu
  const filteredMenuItems = menu.filter(item => {
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchWord.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchWord.toLowerCase());
    return item.available && matchesCategory && matchesSearch;
  });

  // Active cooks/chefs list
  const chefs = staff.filter(s => s.role === 'chef');

  // Currently preparing menu items list (to show customers what the kitchen is busy with)
  const cookingItems = orders
    .filter(o => o.status !== 'pagada' && o.status !== 'cancelada')
    .flatMap(o => o.items.map(i => ({ ...i, customerName: o.customerName, tableNum: tables.find(t => t.id === o.tableId)?.number || 0 })))
    .filter(i => i.status === 'preparando' || i.status === 'pendiente');

  // Status badge of item
  const getItemStatusElement = (status: ItemStatus) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-4xs font-extrabold bg-[#EFECE6] text-[#605850] border border-[#E5E0D8]">
            <Clock size={8} /> Recibido
          </span>
        );
      case 'preparando':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-4xs font-extrabold bg-[#FAF0DE] text-[#785C24] border border-[#E8DCBF] animate-pulse">
            <RefreshCw size={8} className="animate-spin" /> En Parrilla
          </span>
        );
      case 'listo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-4xs font-extrabold bg-[#EBF2EE] text-[#2F483A] border border-[#CAD9D0]">
            <CheckCircle size={8} /> ¡Listo, en camino!
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-4xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            🍽️ Entregado
          </span>
        );
    }
  };

  const getSubtotal = () => currentOrder ? currentOrder.total : 0;
  const getTipAmount = () => Math.round(getSubtotal() * (tipPercentage / 100));
  const getTotalToPay = () => getSubtotal() + getTipAmount();

  const handleRequestBillSimulate = () => {
    if (!currentOrder) return;
    onUpdateTableStatus(sessionTableId, 'cuenta_pedida');
    showToast('🛎️ ¡Mesero notificado! El personal de servicio traerá la cuenta impresa a la brevedad a tu Mesa ' + activeTable?.number + '.');
  };

  const handleSelfPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;

    const sub = getSubtotal();
    const tip = getTipAmount();
    const tot = getTotalToPay();
    const cash = parseFloat(cashGiven) || tot;
    const change = Math.max(0, cash - tot);

    const assignedWaiter = staff.find(s => s.id === currentOrder.waiterId) || staff[1];

    const snapshotItems = currentOrder.items.map(it => {
      const dish = menu.find(m => m.id === it.menuItemId);
      return {
        name: dish ? dish.name : 'Platillo',
        quantity: it.quantity,
        price: dish ? dish.price : 0,
        notes: it.notes
      };
    });

    const finalBackendMethod = (paymentMethod === 'movil' || paymentMethod === 'tarjeta') ? 'tarjeta' : 'efectivo';

    setLastClosedOrder({
      id: currentOrder.id,
      tableNumber: activeTable?.number || 0,
      customerName: currentOrder.customerName,
      items: snapshotItems,
      subtotal: sub,
      tipAmount: tip,
      total: tot,
      paymentMethod: finalBackendMethod,
      receivedAmount: finalBackendMethod === 'efectivo' ? cash : undefined,
      changeAmount: finalBackendMethod === 'efectivo' ? change : undefined,
      date: new Date().toISOString(),
      waiterName: assignedWaiter ? assignedWaiter.name : 'Mesero General'
    });

    onCloseOrder(
      currentOrder.id,
      finalBackendMethod,
      tipPercentage,
      finalBackendMethod === 'efectivo' ? cash : undefined,
      finalBackendMethod === 'efectivo' ? change : undefined
    );

    setPaymentDone(true);
    showToast('🎉 ¡Mesa liquidada con éxito! Muchísimas gracias por visitarnos.');
  };

  // CART LOGIC HELPER CODES
  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const existing = prev[itemId];
      const count = existing ? existing.quantity + delta : delta;
      
      const next = { ...prev };
      if (count <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = {
          quantity: count,
          notes: existing?.notes || ''
        };
      }
      return next;
    });
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          notes: notes
        }
      };
    });
  };

  // Calculate cart subtotal
  const getCartTotal = () => {
    return Object.keys(cart).reduce((sum, itemId) => {
      const data = cart[itemId];
      const dish = menu.find(m => m.id === itemId);
      return sum + (dish ? dish.price * data.quantity : 0);
    }, 0);
  };

  const handleSendCartOrder = () => {
    const cartItems = Object.keys(cart).map(itemId => {
      const data = cart[itemId];
      return {
        menuItemId: itemId,
        quantity: data.quantity,
        notes: data.notes
      };
    });

    if (cartItems.length === 0) return;

    if (currentOrder) {
      // Add items to existing active order!
      onAddItemsToOrder(currentOrder.id, cartItems);
      showToast(`🔥 ¡Adiciones enviadas! Tus platillos ya están en la fila de los Chefs.`);
    } else {
      // This is a brand new order for the table! Find first active waiter in staff list dynamically
      const activeWaiterMatch = staff.find(s => s.role === 'waiter' && s.status === 'active') || 
                                staff.find(s => s.role === 'waiter') || 
                                staff[1];
      const targetWaiterId = activeWaiterMatch ? activeWaiterMatch.id : 'st-2';

      onOpenOrder(sessionTableId, `${currentUser.name} (Auto)`, targetWaiterId, cartItems);
      showToast(`✨ ¡Comanda Iniciada! Hemos abierto tu orden en la Mesa #${activeTable?.number}.`);
    }

    // Clear cart
    setCart({});
    // Go to table tab
    setActivePanel('mesa');
  };

  return (
    <div className="space-y-6 relative font-sans antialiased">
      
      {/* Floating Interactive Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#1E2F25] text-white border border-[#3E6153] rounded-2xl p-4 shadow-xl flex items-start gap-3 animate-fadeIn">
          <div className="w-5 h-5 rounded-full bg-[#2E4A3F] flex items-center justify-center text-[10px] text-[#D1A153] font-bold shrink-0">
            🛎️
          </div>
          <div className="space-y-0.5">
            <span className="block text-4xs uppercase tracking-widest text-[#A2B8AA] font-extrabold">Portal de Servicio</span>
            <p className="text-xs text-gray-100 font-medium">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-gray-400 hover:text-white text-3xs font-bold font-mono">×</button>
        </div>
      )}
      
      {/* 1. UPPER COVER INFORMATION HEADER & TABLE CHOOSER */}
      <div className="bg-[#1E2F25] text-white rounded-3xl p-6 md:p-8 border border-[#132018] shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#2D453A] rounded-full opacity-35 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E4A3F] border border-[#3E6153] text-[10px] font-extrabold uppercase tracking-widest text-[#B2C6BA]">
              <Sparkles size={11} className="text-[#D1A153]" /> Portal Interactivo del Comensal
            </div>
            <h1 className="text-2xl md:text-3xl font-serif italic font-light tracking-wide">
              ¡Te damos la bienvenida, {currentUser.name}! 🥂
            </h1>
            <p className="text-xs text-[#A2B8AA] max-w-xl">
              Consulta en vivo el mapa de mesas del salón, explora la carta con tiempos de cocción, manda tu comanda directo a cocina y simula tu pago desde tu celular.
            </p>
          </div>

          <div className="shrink-0 bg-[#132018] border border-[#2F4839] p-4 rounded-2xl flex flex-col items-center gap-3">
            <span className="text-3xs uppercase font-extrabold text-[#A2B8AA] tracking-wider block">Mesa seleccionada:</span>
            <div className="flex gap-2">
              <select
                value={sessionTableId}
                onChange={e => selectSessionTable(e.target.value)}
                className="text-xs border border-[#2F4839] rounded-lg bg-[#24352A] p-2 text-[#EBF2EE] font-bold focus:outline-none focus:ring-1 focus:ring-[#406354]"
              >
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    Mesa #{t.number} ({t.section?.toUpperCase()} • {t.capacity} pax)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-[10px] text-[#A2B8AA] text-center italic mt-1 bg-[#1A2C21] px-2.5 py-1 rounded border border-[#2F4839] w-full">
              {activeTable?.status === 'disponible' ? '🟢 Mesa Disponible' : activeTable?.status === 'cuenta_pedida' ? '🛎️ Cuenta Solicitada' : '🔴 Mesa con Orden Activa'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHROME TAB SELECTOR */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-2 shadow-xs max-w-2xl mx-auto flex gap-1 justify-between">
        <button
          onClick={() => setActivePanel('mesa')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activePanel === 'mesa' ? 'bg-[#2E4A3F] text-white shadow-sm' : 'text-[#605850] hover:bg-[#FAF8F5]'
          }`}
          id="tab-client-mesa"
        >
          <LayoutGrid size={15} />
          <span>Distribución y Mesas</span>
        </button>

        <button
          onClick={() => setActivePanel('menu')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer relative ${
            activePanel === 'menu' ? 'bg-[#2E4A3F] text-white shadow-sm' : 'text-[#605850] hover:bg-[#FAF8F5]'
          }`}
          id="tab-client-menu"
        >
          <BookOpen size={15} />
          <span>La Carta {Object.keys(cart).length > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-[#C97A53] text-[#FAF8F5] text-4xs font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
              {Object.keys(cart).reduce((s, id) => s + cart[id].quantity, 0)}
            </span>
          )}</span>
        </button>

        <button
          onClick={() => setActivePanel('pago')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer relative ${
            activePanel === 'pago' ? 'bg-[#2E4A3F] text-white shadow-sm' : 'text-[#605850] hover:bg-[#FAF8F5]'
          }`}
          id="tab-client-pago"
        >
          <Receipt size={15} />
          <span>Mi Cuenta & Pago</span>
          {currentOrder && (
            <span className="absolute top-1 right-2 inline-block w-2.5 h-2.5 bg-[#AE593E] outline outline-2 outline-white rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setActivePanel('chefs')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activePanel === 'chefs' ? 'bg-[#2E4A3F] text-white shadow-sm' : 'text-[#605850] hover:bg-[#FAF8F5]'
          }`}
          id="tab-client-chefs"
        >
          <ChefHat size={15} />
          <span>Pase del Chef</span>
        </button>
      </div>

      {/* 3. DYNAMIC WORKVIEW CHASSIS */}
      <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm min-h-[350px]">
        
        {/* TAB 1: DISTRIBUCIÓN Y MAPA DE MESAS */}
        {activePanel === 'mesa' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#E5E0D8] pb-4">
              <h2 className="text-xl font-serif italic text-[#2E2A25]">Mapa de Mesas en Salon</h2>
              <p className="text-xs text-[#605850]">Visualiza la disponibilidad de mesas. Puedes elegir tu mesa favorita tocándola directamente en el plano arquitectónico.</p>
            </div>

            {/* TWO COLUMN GRID: FLOOR MAP LEFT + SELECTION DETAIL RIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* FLOOR MAP (7 COLS) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-4xs uppercase tracking-widest font-extrabold text-[#605850]">
                  <span>Pisos de Servicio del Restaurante</span>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1">🟢 Libre</span>
                    <span className="flex items-center gap-1">🔴 Ocupada</span>
                    <span className="flex items-center gap-1">🛎️ Cuenta Pedida</span>
                  </div>
                </div>

                <div className="relative w-full h-[320px] bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-inner select-none">
                  
                  {/* Decorative divisions matching design */}
                  <div className="absolute top-[4%] left-[4%] w-[52%] h-[68%] border border-dashed border-[#CAD9D0]/50 rounded-lg p-2.5">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-[#B2AA9C]">🍽️ Salón Principal</span>
                  </div>

                  <div className="absolute bottom-[4%] left-[4%] w-[52%] h-[20%] border border-dashed border-[#CAD9D0]/50 rounded-lg bg-white flex items-center justify-between px-3 text-[#7A7167]">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-[#7A7167]">🍷 Barra</span>
                  </div>

                  <div className="absolute top-[4%] right-[4%] w-[36%] h-[32%] border border-dashed border-[#E8D1A7] bg-white rounded-lg p-2 flex flex-col justify-between">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-[#9A7028] flex items-center gap-1">🛋️ VIP Lounge</span>
                  </div>

                  <div className="absolute bottom-[4%] right-[4%] w-[36%] h-[56%] border border-dashed border-[#CAD9D0]/80 bg-[#EBF2EE]/20 rounded-lg p-2.5 flex flex-col justify-between">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-[#2E4A3F]">🌿 Terraza</span>
                  </div>

                  {/* Absolute rendered tables clickable */}
                  {tables.map(table => {
                    const isSelected = sessionTableId === table.id;
                    const coordX = table.posX !== undefined ? table.posX : 10;
                    const coordY = table.posY !== undefined ? table.posY : 10;
                    const isRound = table.capacity <= 4;

                    // Compute background color based on status
                    let statusBgClass = 'bg-[#EBF2EE] border-[#CAD9D0] text-[#2F483A]'; // Disponible
                    if (table.status === 'ocupada') {
                      statusBgClass = 'bg-[#FEECEB] border-[#ECC6C3] text-[#AE5C54]';
                    } else if (table.status === 'cuenta_pedida') {
                      statusBgClass = 'bg-[#FDF3EE] border-[#ECC8B8] text-[#AE593E] animate-pulse';
                    }

                    return (
                      <button
                        key={table.id}
                        onClick={() => selectSessionTable(table.id)}
                        className={`absolute flex flex-col items-center justify-center border-2 transition-all shadow-xs cursor-pointer ${statusBgClass} ${
                          isSelected ? 'ring-4 ring-[#2E4A3F] scale-105 z-20' : 'hover:scale-102'
                        } ${isRound ? 'w-14 h-14 rounded-full' : 'w-16 h-12 rounded-xl'}`}
                        style={{ left: `${coordX}%`, top: `${coordY}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <span className="text-2xs font-extrabold font-serif">#{table.number}</span>
                        <span className="text-[8px] font-bold opacity-85">{table.capacity}pax</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE TABLE DETAIL RIGHT CARD (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-[#E5E0D8] pb-3">
                    <div>
                      <h3 className="text-base font-serif italic text-[#2E2A25]">Mesa Seleccionada {activeTable?.number}</h3>
                      <p className="text-[10px] text-[#605850] uppercase font-bold tracking-wider">{activeTable?.section} • Máximo {activeTable?.capacity} personas</p>
                    </div>
                    <div>
                      {activeTable?.status === 'disponible' ? (
                        <span className="px-2.5 py-1 text-4xs font-extrabold uppercase bg-[#EBF2EE] text-[#2F483A] rounded border border-[#CAD9D0]">🟢 Disponible</span>
                      ) : activeTable?.status === 'cuenta_pedida' ? (
                        <span className="px-2.5 py-1 text-4xs font-extrabold uppercase bg-[#FDF3EE] text-[#AE593E] rounded border border-[#ECC8B8]">🛎️ Cuenta Pedida</span>
                      ) : (
                        <span className="px-2.5 py-1 text-4xs font-extrabold uppercase bg-orange-100 text-orange-850 rounded border border-orange-200">🔴 Ocupada</span>
                      )}
                    </div>
                  </div>

                  {currentOrder ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-3xs font-mono font-extrabold text-[#605850]">
                          <span>ESTATUS COMANDA</span>
                          <span>CÓDIGO: {currentOrder.id}</span>
                        </div>
                        <p className="text-xs font-bold text-[#2E2A25]">Comensal a nombre: <span className="text-[#2E4A3F] font-extrabold">{currentOrder.customerName}</span></p>
                      </div>

                      {/* Items status monitor */}
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {currentOrder.items.map((it, idx) => {
                          const dish = menu.find(m => m.id === it.menuItemId);
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-[#E5E0D8]/60">
                              <span className="font-medium text-[#2E2A25]">{it.quantity}x {dish?.name}</span>
                              {getItemStatusElement(it.status)}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-dashed border-[#E5E0D8] flex justify-between items-center">
                        <span className="text-xs font-bold text-[#605850]">Consumo acumulado:</span>
                        <span className="text-base font-serif font-bold text-[#2E4A3F]">${currentOrder.total.toLocaleString()} MXN</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActivePanel('menu')}
                          className="flex-1 py-1.5 text-xs font-bold border border-[#E5E0D8] hover:bg-[#FAF8F5] rounded-xl text-[#2E2A25] transition cursor-pointer"
                        >
                          ➕ Agregar platillos
                        </button>
                        <button
                          onClick={() => setActivePanel('pago')}
                          className="flex-1 py-1.5 text-xs font-bold bg-[#2E4A3F] hover:bg-[#1E2F25] text-white rounded-xl transition cursor-pointer"
                        >
                          💸 Pagar cuenta
                        </button>
                      </div>

                      <button
                        onClick={handleRequestBillSimulate}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        🛎️ Llamar al Mesero (Pedir la Cuenta)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-6 text-[#2E2A25]">
                      <p className="text-xs text-[#605850]">La Mesa #{activeTable?.number} no tiene compras activas.</p>
                      
                      <div className="border-t border-dashed border-[#E5E0D8] pt-4 space-y-2.5">
                        <p className="text-3xs text-stone-500">¿Quieres probar la experiencia completa de autoservicio abriendo un pedido ahora mismo?</p>
                        <button
                          onClick={() => setActivePanel('menu')}
                          className="w-full py-2.5 bg-[#C97A53] hover:bg-[#AE593E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ShoppingBag size={14} /> ¡Ver la Carta y Ordenar!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: EXPLORAR LA CARTA + CARRITO */}
        {activePanel === 'menu' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#E5E0D8] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif italic text-[#2E2A25]">La Carta de Sabor & Gestión</h2>
                <p className="text-xs text-[#605850]">Elige los mejores platillos preparados al instante por nuestros chefs de turno.</p>
              </div>

              {/* Keyword Search */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar receta de platillo..."
                  value={searchWord}
                  onChange={e => setSearchWord(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-xl px-3 py-2 bg-[#FAF8F5] text-[#2E2A25] placeholder-[#a19a93] focus:ring-1 focus:ring-[#2E4A3F] focus:outline-none"
                />
              </div>
            </div>

            {/* TWO COLUMN GRID: MENU LEFT + CART PREVIEW RIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* FOOD ITEM LIST (2 COLS) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Categorías */}
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-dashed border-[#FAF8F5]">
                  {(['todos', 'entrada', 'plato_fuerte', 'postre', 'bebida'] as const).map(cat => {
                    const labelMap = {
                      todos: '📖 Todas',
                      entrada: '🍲 Entradas',
                      plato_fuerte: '🥩 Especialidades',
                      postre: '🍰 Postres',
                      bebida: '🍹 Bebidas'
                    };
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-3xs font-extrabold uppercase shrink-0 transition cursor-pointer border ${
                          selectedCategory === cat 
                            ? 'bg-[#1E2F25] text-white border-transparent' 
                            : 'bg-[#FAF8F5] text-[#605850] hover:bg-[#EFECE6] border-[#E5E0D8]'
                        }`}
                      >
                        {labelMap[cat]}
                      </button>
                    );
                  })}
                </div>

                {filteredMenuItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredMenuItems.map(dish => {
                      const cartItem = cart[dish.id];
                      return (
                        <div key={dish.id} className="bg-[#FAF8F5]/50 border border-[#E5E0D8] rounded-2xl p-4 flex flex-col justify-between space-y-3 transition hover:shadow-xs">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-[#2E2A25]">{dish.name}</h4>
                              <span className="text-xs font-black text-[#2E4A3F] shrink-0 font-serif">${dish.price} MXN</span>
                            </div>
                            <p className="text-[10px] text-[#605850] leading-relaxed line-clamp-2">{dish.description}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-[#E5E0D8]">
                            <span className="text-4xs uppercase tracking-wider font-extrabold text-[#C97A53] bg-amber-50 px-1.5 rounded border border-amber-150">⏱️ {dish.prepTimeMinutes} mins</span>
                            
                            {/* Fast Add to Table cart Controls */}
                            <div className="flex items-center gap-2">
                              {cartItem ? (
                                <div className="flex items-center gap-2 bg-white border border-[#E5E0D8] rounded-lg px-2 py-0.5">
                                  <button
                                    onClick={() => updateCartQuantity(dish.id, -1)}
                                    className="text-stone-500 hover:text-[#AE593E] px-1 font-bold text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-extrabold font-mono text-[#2E2A25]">{cartItem.quantity}</span>
                                  <button
                                    onClick={() => updateCartQuantity(dish.id, 1)}
                                    className="text-stone-500 hover:text-[#2E4A3F] px-1 font-bold text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => updateCartQuantity(dish.id, 1)}
                                  className="px-2 py-1 bg-white hover:bg-[#EBF2EE] border border-[#2E4A3F] text-[#2E4A3F] text-4xs font-extrabold uppercase rounded-lg transition"
                                >
                                  🛒 Pedir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#605850] text-xs font-medium">
                    ⚠️ Ningún platillo coincide con la búsqueda.
                  </div>
                )}
              </div>

              {/* FLOATING CART AND DISPATCH COLUMN (1 COL) */}
              <div className="space-y-4">
                <div className="bg-[#1E2F25] text-white border border-[#132018] rounded-3xl p-5 space-y-4 shadow-md sticky top-6">
                  <div className="flex items-center gap-2 border-b border-[#2F4839] pb-3">
                    <ShoppingBag className="text-[#D1A153]" size={16} />
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-stone-200">Carrito de la Mesa #{activeTable?.number}</h3>
                  </div>

                  {Object.keys(cart).length > 0 ? (
                    <div className="space-y-4">
                      {/* Products List in Cart */}
                      <div className="divide-y divide-[#2F4839]/40 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {Object.keys(cart).map(itemId => {
                          const data = cart[itemId];
                          const dish = menu.find(m => m.id === itemId);
                          return (
                            <div key={itemId} className="pt-2 text-xs text-gray-200 space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>{data.quantity}x {dish?.name}</span>
                                <span className="font-serif text-[#B2C6BA]">${((dish?.price || 0) * data.quantity).toLocaleString()}</span>
                              </div>
                              {/* Extra chefs instructions */}
                              <input
                                type="text"
                                value={data.notes}
                                onChange={e => updateCartNotes(itemId, e.target.value)}
                                className="w-full bg-[#132018] border border-[#2F4839] rounded px-2 py-1 text-[10px] text-gray-200 placeholder-neutral-500 focus:outline-none"
                                placeholder="Escribe instrucciones especiales (ej. sin cebolla)..."
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary prices */}
                      <div className="border-t border-dashed border-[#2F4839] pt-3 text-xs space-y-1.5 font-bold">
                        <div className="flex justify-between text-neutral-400">
                          <span>Subtotal de Carrito:</span>
                          <span>${getCartTotal().toLocaleString()} MXN</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 italic font-normal">
                          * {currentOrder ? `Se añadirá a tu Cuenta existente código ${currentOrder.id}` : 'Se abrirá un nuevo pedido para tu mesa.'}
                        </p>
                      </div>

                      <button
                        onClick={handleSendCartOrder}
                        className="w-full py-3 bg-[#C97A53] hover:bg-[#AE593E] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Send size={12} />
                        {currentOrder ? 'Confirmar Adiciones a Cocina' : 'Confirmar y Mandar Comanda'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 text-neutral-400">
                      <p className="text-xs">Tu carrito está vacío.</p>
                      <p className="text-4xs leading-relaxed max-w-xs mx-auto">Toca "Pedir" en cualquiera de nuestros platillos del menú para agregarlos aquí e iniciar tu experiencia gastronómica.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: ESTADO & PAGO */}
        {activePanel === 'pago' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#E5E0D8] pb-4">
              <h2 className="text-xl font-serif italic text-[#2E2A25]">Caja Interactiva - Autoservicio</h2>
              <p className="text-xs text-[#605850]">Calcula tu cuenta, selecciona propina voluntaria, y liquida tu mesa simulando el cobro en terminal.</p>
            </div>

            {paymentDone && lastClosedOrder ? (
              <div className="space-y-6 max-w-md mx-auto animate-fadeIn">
                
                {/* Success announcement badge banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <h4 className="text-xs font-bold text-[#1E2F25]">¡Pago de Cuenta Realizado!</h4>
                    <p className="text-3xs text-emerald-800">Se ha generado tu recibo oficial en pantalla para control administrativo.</p>
                  </div>
                </div>

                {/* High-fidelity thermal receipt container */}
                <div className="relative bg-white border-2 border-[#CAD9D0] rounded-xl p-6 shadow-md font-mono text-[#33302C] text-xs space-y-4 overflow-hidden select-text text-left">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200"></div>

                  {/* Receipt Header logo */}
                  <div className="text-center space-y-1 border-b border-[#E5E0D8] pb-3">
                    <span className="text-sm font-black tracking-widest text-[#2E4A3F] uppercase font-serif">SABOR & GESTIÓN</span>
                    <span className="block text-[10px] text-gray-400 font-semibold leading-none">AUTO-PAGO CLIENTE</span>
                    <span className="block text-[8px] text-[#605850] leading-snug mt-1">
                      Av. Alfonso Reyes 204, Cuauhtémoc, México DF<br/>
                      RFC: SGE-260520-DF8 • TEL: 55-REST-SABOR
                    </span>
                  </div>

                  {/* Receipt metadata */}
                  <div className="text-3xs text-[#5A524A] space-y-1 block border-b border-dashed border-[#CAD9D0]/50 pb-2 leading-relaxed text-left">
                    <div className="flex justify-between">
                      <span>TRANSACCIÓN ID:</span>
                      <span className="font-bold">CLI-TX-{lastClosedOrder.id.toUpperCase()}-{Date.now().toString().slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FECHA Y HORA:</span>
                      <span className="font-bold">{new Date(lastClosedOrder.date).toLocaleDateString()} {new Date(lastClosedOrder.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MESA CUBIERTA:</span>
                      <span className="font-bold">Mesa #{lastClosedOrder.tableNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MESERO:</span>
                      <span className="font-bold">{lastClosedOrder.waiterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CLIENTE-SERVICIO:</span>
                      <span className="font-bold uppercase">{lastClosedOrder.customerName}</span>
                    </div>
                  </div>

                  {/* Ticket Items */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between text-4xs font-black uppercase text-[#605850] border-b border-[#E5E0D8] pb-1 font-sans">
                      <span>DESCRIPCIÓN COMIDAS</span>
                      <span>IMPORTE</span>
                    </div>
                    
                    <div className="space-y-1 text-[#2E2A25] text-3xs">
                      {lastClosedOrder.items.map((oItem, iIdx) => (
                        <div key={iIdx} className="flex justify-between leading-snug">
                          <span className="max-w-[75%] font-sans">
                            {oItem.quantity}x <span className="font-semibold text-[#2E2A25]">{oItem.name}</span>
                            {oItem.notes && <span className="block text-4xs text-[#AE593E] font-medium font-sans">✏️ "{oItem.notes}"</span>}
                          </span>
                          <span className="font-mono font-bold">${(oItem.price * oItem.quantity).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Math Summary */}
                  <div className="border-t border-dashed border-[#CAD9D0]/60 pt-3 text-3xs text-[#443E38] space-y-1.5 font-bold text-left">
                    <div className="flex justify-between font-normal text-gray-500">
                      <span>SUBTOTAL CONSUMO:</span>
                      <span>${lastClosedOrder.subtotal.toFixed(1)} MXN</span>
                    </div>
                    <div className="flex justify-between font-normal text-gray-500">
                      <span>IVA TRASLADADO (16%):</span>
                      <span>${(lastClosedOrder.subtotal * 0.16).toFixed(1)} MXN</span>
                    </div>
                    <div className="flex justify-between font-normal text-gray-500">
                      <span>PROPINA VOLUNTARIA:</span>
                      <span>+${lastClosedOrder.tipAmount.toFixed(1)} MXN</span>
                    </div>
                    
                    <div className="flex justify-between text-xs font-black border-t-2 border-[#2E2A25] pt-1.5 text-[#2E2A25] font-serif">
                      <span>TOTAL PAGADO:</span>
                      <span>${lastClosedOrder.total.toFixed(1)} MXN</span>
                    </div>
                  </div>

                  {/* Payment detail check */}
                  <div className="bg-[#EFECE6]/45 p-2 rounded-lg text-4xs text-gray-600 block space-y-1 border border-[#E5E0D8]/45 text-left">
                    <div className="flex justify-between">
                      <span>MÉTODO DE PAGO:</span>
                      <span className="font-bold">{lastClosedOrder.paymentMethod === 'efectivo' ? '💵 EFECTIVO' : '💳 TARJETA'}</span>
                    </div>
                    {lastClosedOrder.paymentMethod === 'efectivo' ? (
                      <>
                        <div className="flex justify-between">
                          <span>EFECTIVO ENTREGADO:</span>
                          <span className="font-bold">${(lastClosedOrder.receivedAmount || lastClosedOrder.total).toFixed(1)} MXN</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 font-bold font-sans text-3xs">
                          <span>CAMBIO INDIVIDUAL DEVUELTO:</span>
                          <span>${(lastClosedOrder.changeAmount || 0).toFixed(1)} MXN</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>ESTADO TRANSACCIÓN:</span>
                        <span>APROBADO DE CLIENTE EN COLA</span>
                      </div>
                    )}
                  </div>

                  {/* Receipt Footer design */}
                  <div className="text-center text-[8px] text-gray-500 border-t border-[#E5E0D8] pt-2.5 leading-normal font-sans font-medium">
                    <p className="font-bold text-gray-700 font-serif text-[9px]">¡MUCHAS GRACIAS POR TU PREFERENCIA!</p>
                    <p className="text-gray-400 mt-0.5">Sabor & Gestión - El mejor sazón en un click</p>
                    <div className="pt-2 text-center text-xs tracking-widest text-[#2E2A25]/75 select-none font-mono font-bold">
                      ||||  || | | ||| ||  ||| | ||
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="py-2.5 bg-white text-[#2E4A3F] border border-[#CAD9D0] font-extrabold rounded-xl hover:bg-[#FAF8F5] transition text-3xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    🖨️ Simular Imprimir / Descargar Recibo PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDone(false);
                      setLastClosedOrder(null);
                      setActivePanel('mesa');
                    }}
                    className="py-3 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1 cursor-pointer"
                  >
                    ✅ Entendido: Desocupar Mesa y Finalizar
                  </button>
                </div>

              </div>
            ) : currentOrder ? (
              <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Items detailing list */}
                    <div className="space-y-4 border border-[#E5E0D8] rounded-2xl p-5 bg-[#FAF8F5]">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#605850] border-b border-[#E5E0D8] pb-2">Tu Consumo de Hoy (Mesa {activeTable?.number})</h3>
                      <div className="divide-y divide-[#E5E0D8]/40 space-y-2.5">
                        {currentOrder.items.map((it, idx) => {
                          const dish = menu.find(m => m.id === it.menuItemId);
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs pt-2 text-[#2E2A25]">
                              <div>
                                <span className="font-bold text-[#2E4A3F]">{it.quantity}x</span> {dish?.name}
                                <span className="block text-4xs uppercase tracking-widest text-[#605850] font-extrabold mt-0.5">Estatus: {it.status.toUpperCase()}</span>
                              </div>
                              <span className="font-bold">${((dish?.price || 0) * it.quantity).toLocaleString()} MXN</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-dashed border-[#E5E0D8] space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#605850]">
                          <span>Consumo alimentos & bebidas:</span>
                          <span>${getSubtotal().toLocaleString()} MXN</span>
                        </div>
                        <div className="flex justify-between text-[#605850]">
                          <span>Propina para el personal ({tipPercentage}%):</span>
                          <span>+${getTipAmount().toLocaleString()} MXN</span>
                        </div>
                        <div className="flex justify-between text-base font-serif font-bold text-[#1E2F25] pt-1 border-t border-[#E5E0D8]">
                          <span>Monto Total a Pagar:</span>
                          <span>${getTotalToPay().toLocaleString()} MXN</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Payment checkout box */}
                    <form onSubmit={handleSelfPaymentSubmit} className="space-y-5 bg-white border border-[#E5E0D8] rounded-2xl p-5">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#2E2A25] text-center border-b border-[#E5E0D8] pb-3">Formulario de Liquidación</h3>
                      
                      {/* Tip Selection */}
                      <div className="space-y-2">
                        <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider">Añadir Propina para el personal de servicio</label>
                        <div className="flex gap-2">
                          {[0, 10, 15, 20].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setTipPercentage(pct)}
                              className={`flex-1 py-1.5 text-3xs font-black rounded-lg transition ${
                                tipPercentage === pct ? 'bg-[#1E2F25] text-white border-transparent' : 'bg-[#FAF8F5] text-[#2E2A25] border border-[#E5E0D8] hover:bg-[#EFECE6]'
                              }`}
                            >
                              {pct === 0 ? 'Sin Propina' : `${pct}%`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment method */}
                      <div className="space-y-2">
                        <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider">Selecciona Método de Pago</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('tarjeta')}
                            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 border cursor-pointer ${
                              paymentMethod === 'tarjeta' ? 'bg-[#2E4A3F] text-white border-transparent' : 'bg-[#FAF8F5] text-[#2E2A25] border-[#E5E0D8] hover:bg-[#EFECE6]'
                            }`}
                          >
                            <CreditCard size={12} /> Tarjeta
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('efectivo')}
                            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 border cursor-pointer ${
                              paymentMethod === 'efectivo' ? 'bg-[#2E4A3F] text-white border-transparent' : 'bg-[#FAF8F5] text-[#2E2A25] border-[#E5E0D8] hover:bg-[#EFECE6]'
                            }`}
                          >
                            <DollarSign size={12} /> Efectivo
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('movil')}
                            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 border cursor-pointer ${
                              paymentMethod === 'movil' ? 'bg-[#2E4A3F] text-white border-transparent' : 'bg-[#FAF8F5] text-[#2E2A25] border-[#E5E0D8] hover:bg-[#EFECE6]'
                            }`}
                          >
                            📱 Pago Móvil
                          </button>
                        </div>
                      </div>

                      {/* Explicit block for mobile payment details */}
                      {paymentMethod === 'movil' && (
                        <div className="bg-[#EBF2EE]/40 border border-[#CAD9D0] rounded-2xl p-4 space-y-4 animate-fadeIn text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-[#2E4A3F] text-white font-mono font-extrabold text-[8px] uppercase tracking-wider rounded">
                            ⚡ CoDi® SPEI / NFC Móvil Integrado
                          </span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            
                            {/* QR Scan Section */}
                            <div className="space-y-1.5 p-2.5 bg-white border border-[#E5E0D8] rounded-xl flex flex-col items-center">
                              <span className="block text-[8px] font-extrabold text-[#605850] uppercase tracking-widest text-[#2E4A3F]">Escanear con Banco</span>
                              
                              {/* Simulated QR block layout */}
                              <div className="w-16 h-16 bg-slate-900 rounded p-1 flex flex-wrap items-center justify-center gap-0.5 shadow">
                                {Array.from({ length: 49 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-xs ${
                                      (i < 6 && i % 2 === 0) || (i > 40 && i % 3 === 0) || (i % 5 === 1) || (i === 11 || i === 22 || i === 29 || i === 34)
                                        ? 'bg-transparent'
                                        : 'bg-[#A3E635]'
                                    }`}
                                  ></div>
                                ))}
                              </div>
                              <span className="text-[9px] text-[#605850] font-mono font-semibold">REF: MESA-{activeTable?.number}</span>
                            </div>

                            {/* NFC Touch Section */}
                            <div className="space-y-2 p-2 flex flex-col justify-center items-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-350 text-[#2E4A3F] flex items-center justify-center font-bold animate-pulse text-xs">
                                📡
                              </div>
                              <span className="block text-[8px] font-black text-[#2E4A3F] uppercase tracking-widest">NFC Contactless Ready</span>
                              <p className="text-[10px] text-gray-500 leading-tight">Acerca tu móvil al lector táctil de mesa para transferir tarjetas bancarias digitales.</p>
                            </div>

                          </div>
                          <p className="text-[9px] text-[#AE593E] font-bold italic">
                            💡 Autorización instantánea. Presiona "Simular Pago de Cuenta" abajo para liquidar fondos de inmediato.
                          </p>
                        </div>
                      )}

                      {/* Explicit block for cash parameters */}
                      {paymentMethod === 'efectivo' && (
                        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 space-y-2 animate-fadeIn text-xs">
                          <label className="block text-[10px] font-bold text-[#605850]">Efectivo Entregado (MXN):</label>
                          <input
                            type="number"
                            value={cashGiven}
                            onChange={e => setCashGiven(e.target.value)}
                            className="bg-white border border-[#E5E0D8] rounded p-1.5 w-full font-mono text-xs text-[#2E2A25]"
                            min={getTotalToPay()}
                          />
                          <p className="text-3xs text-[#AE593E] italic font-semibold mt-1">
                            Tu cambio será de: ${(parseFloat(cashGiven) ? Math.max(0, parseFloat(cashGiven) - getTotalToPay()) : 0).toLocaleString()} MXN
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 pt-1 border-t border-[#E5E0D8]">
                        <button
                          type="button"
                          onClick={handleRequestBillSimulate}
                          className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-3xs uppercase tracking-wider rounded-lg transition"
                        >
                          🛎️ Solicitar cuenta física impresa al mesero
                        </button>
                        
                        <button
                          type="submit"
                          className="w-full flex justify-center py-3 border border-transparent rounded-xl text-xs font-bold text-white bg-[#C97A53] hover:bg-[#AE593E] transition active:scale-98 cursor-pointer shadow"
                        >
                          ✅ Simular Pago de Cuenta: ${getTotalToPay().toLocaleString()} MXN
                        </button>
                      </div>
                    </form>

                  </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#605850] text-xs max-w-sm mx-auto space-y-2.5">
                <p>⚠️ No tienes consumos activos registrados en la Mesa #{activeTable?.number} actualmente.</p>
                <button
                  onClick={() => setActivePanel('menu')}
                  className="px-4 py-2 bg-[#2E4A3F] text-white text-xs font-bold rounded-lg"
                >
                  Ir a ordenar algo rico
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CHEFS PANEL / PASE DEL CHEF */}
        {activePanel === 'chefs' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#E5E0D8] pb-4">
              <h2 className="text-xl font-serif italic text-[#2E2A25]">Nuestros Chefs en Servicio</h2>
              <p className="text-xs text-[#605850]">Conoce a los maestros culinarios que están transformando ingredientes frescos en tu platillo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chefs.map(chef => {
                const initials = chef.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <div key={chef.id} className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-5 flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${chef.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0`}>
                      {initials}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-bold text-[#2E2A25] font-serif italic">{chef.name}</h4>
                          <span className="text-3xs uppercase font-extrabold tracking-wider bg-amber-100 text-[#785C24] px-1.5 py-0.5 rounded-sm">🍳 Chef de Cocina Especializada</span>
                        </div>
                        {chef.status === 'active' ? (
                          <span className="text-4xs font-bold uppercase tracking-widest text-[#2E4A3F] border border-[#CAD9D0] bg-[#EBF2EE] px-1.5 py-0.5 rounded-md">🔋 En Línea</span>
                        ) : (
                          <span className="text-4xs font-bold uppercase tracking-widest text-[#785C24] border border-[#E8DCBF] bg-[#FAF0DE] px-1.5 py-0.5 rounded-md">☕ Descanso</span>
                        )}
                      </div>
                      <p className="text-3xs text-[#605850] leading-relaxed">
                        Artesano con alta experiencia en el sazón característico de la casa. Monitorea meticulosamente el horno, los fogones y el emplatado para brindarte una obra maestra sensorial en tu mesa.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#1E2F25] text-white rounded-2xl p-5 space-y-3.5 border border-[#132018]">
              <div className="flex items-center gap-2">
                <ChefHat className="text-[#D1A153]" size={18} />
                <h3 className="text-xs uppercase tracking-widest font-extrabold">Fila de Cocina Activa en Vivo</h3>
              </div>

              {cookingItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cookingItems.map((item, index) => {
                    const matchedPlate = menu.find(m => m.id === item.menuItemId);
                    return (
                      <div key={index} className="bg-[#132018] border border-[#2F4839] rounded-xl p-3 space-y-1 text-3xs">
                        <div className="flex justify-between font-bold text-yellow-500">
                          <span>Mesa {item.tableNum} • {item.customerName}</span>
                          <span className="bg-yellow-900/30 px-1.5 rounded uppercase tracking-wider text-[8px]">En Parrilla</span>
                        </div>
                        <p className="text-gray-200 font-extrabold">{item.quantity}x {matchedPlate?.name}</p>
                        {item.notes && <p className="text-yellow-600/70 italic text-[10px]">✏️ "{item.notes}"</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-3xs text-[#A2B8AA] italic">💤 Todos los pedidos han sido entregados con éxito. Los fogones están listos para recibir tu nueva selección.</p>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
