import React, { useState, useEffect } from 'react';
import { 
  Plus, Minus, Circle, CheckCircle, Clock, Utensils, 
  Trash2, User, DollarSign, CreditCard, ChevronRight, X, FileText, Sparkles
} from 'lucide-react';
import { 
  RestaurantTable, MenuItem, StaffMember, Order, OrderItem, ItemStatus 
} from '../types';

interface ComandasViewProps {
  tables: RestaurantTable[];
  menu: MenuItem[];
  staff: StaffMember[];
  orders: Order[];
  onOpenOrder: (tableId: string, customerName: string, waiterId: string, items: { menuItemId: string; quantity: number; notes: string }[]) => void;
  onAddItemsToOrder: (orderId: string, items: { menuItemId: string; quantity: number; notes: string }[]) => void;
  onUpdateItemStatus: (orderId: string, itemId: string, newStatus: ItemStatus) => void;
  onUpdateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  onCloseOrder: (orderId: string, paymentMethod: 'efectivo' | 'tarjeta', tipPercentage: number, receivedAmount?: number, changeAmount?: number) => void;
  onUpdateTablePosition: (tableId: string, posX: number, posY: number, section?: RestaurantTable['section']) => void;
  currentUser?: StaffMember | null;
}

export default function ComandasView({
  tables,
  menu,
  staff,
  orders,
  onOpenOrder,
  onAddItemsToOrder,
  onUpdateItemStatus,
  onUpdateTableStatus,
  onCloseOrder,
  onUpdateTablePosition,
  currentUser
}: ComandasViewProps) {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isOpeningOrder, setIsOpeningOrder] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Layout mode: 'plano' (floor layout) versus 'grid' (cards)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'plano'>('plano');

  // Checkout sub-states: 'details' (amounts & method), 'processing' (card terminal simulation), 'receipt' (thermal ticket proof)
  const [checkoutStage, setCheckoutStage] = useState<'details' | 'processing' | 'receipt'>('details');
  const [simulatedStep, setSimulatedStep] = useState<number>(0);
  const [simulatedAuthCode, setSimulatedAuthCode] = useState<string>('');
  const [isRepositioning, setIsRepositioning] = useState<boolean>(false);

  // States for opening a new order
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newWaiterId, setNewWaiterId] = useState('');
  const [cart, setCart] = useState<{ menuItemId: string; quantity: number; notes: string }[]>([]);

  // Sincronizar newWaiterId con el mesero logueado activo
  useEffect(() => {
    if (currentUser && currentUser.role === 'waiter') {
      setNewWaiterId(currentUser.id);
    } else {
      setNewWaiterId('');
    }
  }, [currentUser, isOpeningOrder]);
  
  // Menu filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Checkout states
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');

  const activeOrder = selectedTable?.currentOrderId 
    ? orders.find(o => o.id === selectedTable.currentOrderId) 
    : null;

  const currentWaiter = activeOrder 
    ? staff.find(s => s.id === activeOrder.waiterId) 
    : null;

  // Filtered menu
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.available;
  });

  const waiters = staff.filter(s => s.role === 'waiter' && s.status === 'active');

  const addToCart = (menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (existing) {
        return prev.map(item => 
          item.menuItemId === menuItemId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { menuItemId, quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(item => item.menuItemId !== menuItemId);
      }
      return prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  };

  const updateCartNotes = (menuItemId: string, notes: string) => {
    setCart(prev => prev.map(item => 
      item.menuItemId === menuItemId ? { ...item, notes } : item
    ));
  };

  const calculateCartTotal = () => {
    return cart.reduce((acc, cartItem) => {
      const menuItem = menu.find(m => m.id === cartItem.menuItemId);
      return acc + (menuItem ? menuItem.price * cartItem.quantity : 0);
    }, 0);
  };

  const handleOpenOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !newWaiterId || cart.length === 0) return;
    
    onOpenOrder(
      selectedTable.id, 
      newCustomerName.trim() || `Mesa ${selectedTable.number}`, 
      newWaiterId, 
      cart
    );
    
    // Reset state
    setNewCustomerName('');
    setNewWaiterId('');
    setCart([]);
    setIsOpeningOrder(false);
    
    // Refresh table details state
    const updatedTable = tables.find(t => t.id === selectedTable.id);
    if (updatedTable) {
      setSelectedTable(updatedTable);
    } else {
      setSelectedTable(null);
    }
  };

  const handleAddMoreSubmit = () => {
    if (!activeOrder || cart.length === 0) return;
    onAddItemsToOrder(activeOrder.id, cart);
    setCart([]);
    setIsAddingItems(false);
  };

  const startCardProcessing = () => {
    setCheckoutStage('processing');
    setSimulatedStep(1);
    
    setTimeout(() => {
      setSimulatedStep(2); // Connecting with bank processor
      setTimeout(() => {
        setSimulatedStep(3); // Authorizing debit value from network
        setTimeout(() => {
          const authCode = Math.floor(100000 + Math.random() * 900000).toString();
          setSimulatedAuthCode(`Auth-${authCode}`);
          setSimulatedStep(4); // Transaction validated!
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleProcessCheckout = (recAmount?: number, chgAmount?: number) => {
    if (!activeOrder) return;
    onCloseOrder(activeOrder.id, paymentMethod, tipPercentage, recAmount, chgAmount);
    
    // Clear and restore states
    setIsCheckoutOpen(false);
    setCheckoutStage('details');
    setSimulatedStep(0);
    setSimulatedAuthCode('');
    setCashReceived('');
    setSelectedTable(null);
  };

  const getStatusColor = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'disponible': return 'bg-[#EBF2EE] border-[#CAD9D0] text-[#2F483A] hover:bg-[#DCE7E1]';
      case 'ocupada': return 'bg-[#FAF0DE] border-[#E8DCBF] text-[#785C24] hover:bg-[#F5E6CC]';
      case 'cuenta_pedida': return 'bg-[#FDF3EE] border-[#ECC8B8] text-[#AE593E] hover:bg-[#F9E2D8] animate-pulse';
    }
  };

  const getStatusBadge = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'disponible':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E5ECE9] text-[#2F483A] border border-[#CAD9D0]">Disponible</span>;
      case 'ocupada':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FAF0DE] text-[#785C24] border border-[#E8DCBF]">En servicio</span>;
      case 'cuenta_pedida':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDF3EE] text-[#AE593E] border border-[#ECC8B8]">Cuenta Pedida</span>;
    }
  };

  const getItemStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'pendiente':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#F2EFE9] text-[#7A7167] border border-[#E5E0D8]"><Clock size={12}/> Pendiente</span>;
      case 'preparando':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#FAF3E6] text-[#9A7028] border border-[#E8D1A7]"><Utensils size={12}/> Preparando</span>;
      case 'listo':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#EBF2EE] text-[#2E4A3F] border border-[#B8D1C2]"><Sparkles size={12}/> ¡Listo!</span>;
      case 'entregado':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#EAE6DF] text-[#605850] border border-[#D5CFC6]"><CheckCircle size={12}/> Servido</span>;
    }
  };

  const orderTotalOriginal = activeOrder ? activeOrder.items.reduce((sum, item) => {
    const mi = menu.find(m => m.id === item.menuItemId);
    return sum + (mi ? mi.price * item.quantity : 0);
  }, 0) : 0;

  const calculatedTip = orderTotalOriginal * (tipPercentage / 100);
  const checkoutTotal = orderTotalOriginal + calculatedTip;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. MESA SELECTION LIST */}
      <div className="lg:col-span-2 space-y-6">
        {/* Layout Modifiers and Tables Wrapper */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#2E2A25] tracking-tight flex items-center gap-2">
                🗺️ Plano de Distribución
              </h2>
              <p className="text-xs text-[#605850]">Visualiza las mesas según su ubicación real y controla comensales en tiempo real.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-[#F2EFE9] p-1 rounded-xl border border-[#E5E0D8] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => { setLayoutMode('plano'); setIsRepositioning(false); }}
                className={`px-3 py-1.5 text-3xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                  layoutMode === 'plano'
                    ? 'bg-[#2E4A3F] text-white shadow-xs'
                    : 'text-[#605850] hover:bg-white/50'
                }`}
              >
                🗺️ Plano Físico
              </button>
              <button
                type="button"
                onClick={() => { setLayoutMode('grid'); setIsRepositioning(false); }}
                className={`px-3 py-1.5 text-3xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-[#2E4A3F] text-white shadow-xs'
                    : 'text-[#605850] hover:bg-white/50'
                }`}
              >
                🎴 Cuadrícula
              </button>
            </div>
          </div>

          {/* Table status legends */}
          <div className="flex flex-wrap gap-4 text-3xs text-[#605850] font-semibold border-b border-[#EFECE6] pb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5ECE9] border border-[#CAD9D0]"></span> Disponible (Verde)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FAF0DE] border border-[#E8DCBF]"></span> En Servicio (Ocre)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FDF3EE] border border-[#ECC8B8] animate-pulse"></span> Cuenta Pedida (Rojo tinto)
            </span>
            {(!currentUser || currentUser.role !== 'waiter') && (
              <span className="ml-auto flex items-center gap-1">
                <span className="text-[#2E4A3F] hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => setIsRepositioning(!isRepositioning)}>
                  🔧 {isRepositioning ? "Terminar Ajustes" : "Ajustar Distribución"}
                </span>
              </span>
            )}
          </div>

          {/* DRAG-AND-POSITION ARCHITECTURAL RESTAURANT FLOOR PLAN */}
          {layoutMode === 'plano' ? (
            <div className="relative w-full h-[380px] sm:h-[480px] bg-[#FAF8F5] border-2 border-[#E5E0D8] rounded-xl overflow-hidden shadow-inner select-none">
              
              {/* Floor architectural guide marks */}
              
              {/* 1. Salón Principal Area demarcation */}
              <div className="absolute top-[4%] left-[4%] w-[52%] h-[68%] border border-dashed border-[#CAD9D0]/50 rounded-lg p-2.5">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#B2AA9C]">🍽️ Salón Principal</span>
              </div>

              {/* 2. Barra de Bebidas Area demarcation */}
              <div className="absolute bottom-[4%] left-[4%] w-[52%] h-[20%] border border-dashed border-[#CAD9D0]/50 rounded-lg bg-[#FAF8F5] flex items-center justify-between px-3 text-[#7A7167]">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#7A7167]">🍷 Barra de Bebidas & Cocktails</span>
                <span className="text-3xs italic">Banquetas con Stools</span>
              </div>

              {/* 3. Zona VIP Area demarcation */}
              <div className="absolute top-[4%] right-[4%] w-[36%] h-[32%] border border-dashed border-[#E8D1A7] bg-[#FAF8F5] rounded-lg p-2 flex flex-col justify-between">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#9A7028] flex items-center gap-1">🛋️ VIP Lounge</span>
                <div className="border-t border-[#E8D1A7]/40 pt-1 text-[8px] text-[#A19584]">Sofás & Luz cálida</div>
              </div>

              {/* 4. Terraza Exterior Area demarcation */}
              <div className="absolute bottom-[4%] right-[4%] w-[36%] h-[56%] border border-dashed border-[#CAD9D0] bg-[#EBF2EE]/30 rounded-lg p-2.5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#2E4A3F] flex items-center gap-0.5">🌿 Terraza</span>
                  <span className="text-[8px] text-[#5A6E65] bg-[#E5ECE9] px-1 rounded">Exterior</span>
                </div>
                <div className="text-[8px] text-[#658B73] italic">Maceteros con bambúes • Sombrillas</div>
              </div>

              {/* Central Entryway label */}
              <div className="absolute left-[58%] top-[25%] transform -rotate-90 text-[8px] tracking-widest text-[#B2AA9C]/70 font-bold uppercase pointer-events-none">
                🚪 Entrada / Hall de Acceso
              </div>

              {/* RENDER ACTIVE TABLES PLACED ABSOLUTELY */}
              {tables.map(table => {
                const activeTableOrder = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
                const isSelected = selectedTable?.id === table.id;
                
                // Read coordinates or assign sensible defaults
                const leftPos = table.posX !== undefined ? table.posX : 10;
                const topPos = table.posY !== undefined ? table.posY : 10;
                
                // Decide table visual size as round (for <= 4 people) or square/rect (for large)
                const isLarge = table.capacity > 4;

                // Let's draw physical chairs absolutely around the relative bounds of the table button!
                const totalChairs = table.capacity;
                const chairDivs: React.ReactNode[] = [];
                
                if (isLarge) {
                  // Rectangular: place chairs along top, bottom, and sides
                  // For 6 people: 3 top, 3 bottom
                  // For 8 people: 3 top, 3 bottom, 1 left, 1 right
                  const topChairsCount = 3;
                  const bottomChairsCount = 3;
                  
                  // Top Chairs
                  for (let c = 0; c < topChairsCount; c++) {
                    const leftPercent = 15 + c * 35; // Distribute chairs along width
                    chairDivs.push(
                      <div key={`chair-t-${c}`} className="absolute top-[-7px] w-3.5 h-1.5 rounded-t bg-amber-800 border-t border-x border-[#E5E0D8]/40 shadow-xs" style={{ left: `${leftPercent}%` }} />
                    );
                  }
                  // Bottom Chairs
                  for (let c = 0; c < bottomChairsCount; c++) {
                    const leftPercent = 15 + c * 35;
                    chairDivs.push(
                      <div key={`chair-b-${c}`} className="absolute bottom-[-7px] w-3.5 h-1.5 rounded-b bg-amber-800 border-b border-x border-[#E5E0D8]/40 shadow-xs" style={{ left: `${leftPercent}%` }} />
                    );
                  }
                  // Sides for 8 people
                  if (totalChairs === 8) {
                    chairDivs.push(
                      <div key="chair-l-1" className="absolute left-[-7px] top-[40%] w-1.5 h-3.5 rounded-l bg-amber-800 border-l border-y border-[#E5E0D8]/40 shadow-xs" />
                    );
                    chairDivs.push(
                      <div key="chair-r-1" className="absolute right-[-7px] top-[40%] w-1.5 h-3.5 rounded-r bg-amber-800 border-r border-y border-[#E5E0D8]/40 shadow-xs" />
                    );
                  }
                } else {
                  // Round shape table chairs
                  if (totalChairs === 2) {
                    chairDivs.push(
                      <div key="chair-round-t" className="absolute top-[-7px] left-[40%] w-3 h-2 rounded bg-amber-800 border border-[#E5E0D8]/20 shadow-xs" />
                    );
                    chairDivs.push(
                      <div key="chair-round-b" className="absolute bottom-[-7px] left-[40%] w-3 h-2 rounded bg-amber-800 border border-[#E5E0D8]/20 shadow-xs" />
                    );
                  } else {
                    // 4 Chairs: Top, Right, Bottom, Left
                    chairDivs.push(
                      <div key="chair-rd-1" className="absolute top-[-7px] left-[40%] w-3.5 h-1.5 rounded-t bg-amber-800 shadow-xs" />
                    );
                    chairDivs.push(
                      <div key="chair-rd-2" className="absolute bottom-[-7px] left-[40%] w-3.5 h-1.5 rounded-b bg-amber-800 shadow-xs" />
                    );
                    chairDivs.push(
                      <div key="chair-rd-3" className="absolute left-[-7px] top-[40%] w-1.5 h-3.5 rounded-l bg-amber-800 shadow-xs" />
                    );
                    chairDivs.push(
                      <div key="chair-rd-4" className="absolute right-[-7px] top-[40%] w-1.5 h-3.5 rounded-r bg-amber-800 shadow-xs" />
                    );
                  }
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      setIsOpeningOrder(false);
                      setIsAddingItems(false);
                      setCart([]);
                    }}
                    style={{ left: `${leftPos}%`, top: `${topPos}%` }}
                    id={`btn-table-${table.id}`}
                    type="button"
                    className={`absolute rounded-xl transition-all hover:scale-105 active:scale-95 duration-150 cursor-pointer flex flex-col items-center justify-center border-2 shadow-md ${
                      isLarge ? 'w-24 h-15 sm:w-28 sm:h-16' : 'w-16 h-16 sm:w-18 sm:h-18 rounded-full'
                    } ${getStatusColor(table.status)} ${
                      isSelected ? 'ring-3 ring-[#2E4A3F] ring-offset-2 border-[#2E4A3F] z-20 scale-105 bg-opacity-95' : 'border-[#E5E0D8]'
                    }`}
                  >
                    {/* Render Chairs wrapper */}
                    <div className="absolute inset-0 pointer-events-none">
                      {chairDivs}
                    </div>

                    {/* Table Name inside */}
                    <span className="text-3xs tracking-wide font-black block font-serif uppercase text-[#605850]">Mesa</span>
                    <span className="text-sm sm:text-base font-black font-mono leading-none">{table.number}</span>
                    
                    {/* Capacity and Order Snapshot code inside absolute box */}
                    {activeTableOrder ? (
                      <span className="text-[8px] font-mono font-black border border-[#E8DCBF]/50 bg-white/95 px-1 py-0.5 rounded mt-0.5 leading-none max-w-[90%] truncate">
                        ${activeTableOrder.total}
                      </span>
                    ) : (
                      <span className="text-[8px] leading-none text-[#5A6E65] font-bold mt-0.5 uppercase bg-white/50 px-1 py-0.5 rounded">
                        Libre
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* SIMPLE ACCESSIBILTY RESPONSIVE GRID */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tables.map(table => {
                const activeTableOrder = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
                const isSelected = selectedTable?.id === table.id;

                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      setIsOpeningOrder(false);
                      setIsAddingItems(false);
                      setCart([]);
                    }}
                    id={`btn-table-${table.id}`}
                    className={`relative p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${getStatusColor(table.status)} ${
                      isSelected ? 'ring-2 ring-[#2E4A3F] ring-offset-2 border-[#2E4A3F] shadow-md transform scale-102 bg-opacity-95' : 'shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold font-mono">Mesa {table.number}</span>
                      <span className="text-2xs text-[#605850] font-medium bg-white/70 px-1.5 py-0.5 rounded border border-[#E5E0D8]">
                        Cap: {table.capacity}p
                      </span>
                    </div>

                    {activeTableOrder ? (
                      <div className="space-y-1">
                      <p className="text-xs font-semibold truncate text-[#2E2A25]">
                        {activeTableOrder.customerName}
                      </p>
                      <div className="flex justify-between items-center text-3xs font-medium text-[#605850] mt-1">
                        <span>{activeTableOrder.items.length} items</span>
                        <span className="font-bold text-[#2E2A25]">${activeTableOrder.total} MXN</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 flex items-center justify-center text-xs text-[#2F483A]/75 border border-dashed border-[#B8D1C2] rounded bg-white/40">
                      <Plus size={14} className="mr-1" /> Libre
                    </div>
                  )}
                  </button>
                );
              })}
            </div>
          )}

          {/* REAL-TIME VISUAL POSITION ADJUSTER PANEL (Shown when "reposicionar" is active and a table is selected) */}
          {isRepositioning && selectedTable && (
            <div className="bg-[#FAF8F5] border border-[#E8D1A7] p-4 rounded-xl space-y-3.5 animate-fadeIn">
              <div className="flex justify-between items-center pb-2 border-b border-[#E5E0D8]">
                <h4 className="text-xs font-bold text-[#2E2A25] uppercase tracking-wider flex items-center gap-1">
                  🔧 Ajuste de Ubicación: <span className="font-mono text-indigo-700">Mesa {selectedTable.number}</span>
                </h4>
                <div className="text-3xs text-[#605850] italic font-semibold">Configuración de Plano de Distribución</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-[#2E2A25]">
                {/* Zone Area Selector */}
                <div className="space-y-1">
                  <label className="block text-2xs uppercase text-[#605850]">Sección / Zona Física</label>
                  <select
                    value={selectedTable.section || 'salon'}
                    onChange={e => onUpdateTablePosition(selectedTable.id, selectedTable.posX || 10, selectedTable.posY || 10, e.target.value as any)}
                    className="w-full text-xs border border-[#E5E0D8] rounded-md p-1.5 bg-white text-[#2E2A25] focus:outline-none"
                  >
                    <option value="salon">🍽️ Salón Principal</option>
                    <option value="terraza">🌿 Terraza Exterior</option>
                    <option value="vip">🛋️ Zona VIP Lounge</option>
                    <option value="barra">🍷 Barra de Bebidas</option>
                  </select>
                </div>

                {/* Horizontal Coordinate Slider X */}
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs uppercase text-[#605850]">
                    <span>Posición Horizontal (X)</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedTable.posX || 10}%</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="86"
                    value={selectedTable.posX !== undefined ? selectedTable.posX : 10}
                    onChange={e => onUpdateTablePosition(selectedTable.id, parseInt(e.target.value), selectedTable.posY || 10, selectedTable.section)}
                    className="w-fullaccent-[#2E4A3F] h-1.5 bg-[#EFECE6] rounded-lg appearance-none cursor-ew-resize focus:outline-none"
                  />
                </div>

                {/* Vertical Coordinate Slider Y */}
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs uppercase text-[#605850]">
                    <span>Posición Vertical (Y)</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedTable.posY || 10}%</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="86"
                    value={selectedTable.posY !== undefined ? selectedTable.posY : 10}
                    onChange={e => onUpdateTablePosition(selectedTable.id, selectedTable.posX || 10, parseInt(e.target.value), selectedTable.section)}
                    className="w-fullaccent-[#2E4A3F] h-1.5 bg-[#EFECE6] rounded-lg appearance-none cursor-ns-resize focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-3xs text-[#605850] italic pt-1 leading-relaxed">
                * Arrastra los controles deslizantes para re-ubicar físicamente la mesa {selectedTable.number}. Esto se adaptará de forma fluida a pantallas de computadoras, iPads y teléfonos inteligentes preservando la distribución física.
              </p>
            </div>
          )}

        </div>

        {/* ACTIVE CHEFS / WAITERS REFERENCE STATUS */}
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="text-[#a19a93] mr-1" size={18} />
            <span className="text-xs font-bold text-[#2E2A25]">Meseros Activos de Turno:</span>
            <div className="flex -space-x-2">
              {waiters.map(waiter => (
                <span 
                  key={waiter.id} 
                  title={waiter.name}
                  className={`w-7 h-7 rounded-full ${waiter.avatarColor} border-2 border-[#FAF8F5] text-3xs text-white flex items-center justify-center font-bold`}
                >
                  {waiter.name.charAt(0)}
                </span>
              ))}
              {waiters.length === 0 && (
                <span className="text-3xs text-[#AE593E] font-semibold bg-white px-2 py-1 rounded border border-[#ECC8B8]">
                  ⚠️ No hay meseros de turno activos
                </span>
              )}
            </div>
          </div>
          <span className="text-3xs text-[#605850] bg-[#FAF8F5] border border-[#E5E0D8] rounded px-2.5 py-1">
            Requisitos: Para agregar pedidos, deba haber al menos un mesero activo
          </span>
        </div>
      </div>

      {/* 2. COMANDA DETAIL SIDEBAR */}
      <div className="lg:col-span-1">
        {selectedTable ? (
          <div className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden min-h-[480px] flex flex-col justify-between sticky top-4">
            
            {/* Header */}
            <div className="bg-[#FAF8F5] px-5 py-4 border-b border-[#E5E0D8] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#2E2A25]">Mesa {selectedTable.number}</h3>
                <p className="text-2xs text-[#605850]">Capacidad para {selectedTable.capacity} personas</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(selectedTable.status)}
                {activeOrder && (
                  <span className="text-3xs font-mono text-[#605850] bg-[#EFECE6] px-1 py-0.5 rounded border border-[#E5E0D8]">ID: {activeOrder.id}</span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
              
              {/* IF EMPTY TAB (NO ORDER IS ACTIVE) */}
              {!activeOrder && !isOpeningOrder && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-[#E5ECE9] text-[#2E4A3F] flex items-center justify-center mb-3">
                    <Utensils size={24} />
                  </div>
                  <h4 className="text-sm font-bold font-serif text-[#2E2A25]">Mesa sin comanda activa</h4>
                  <p className="text-xs text-[#605850] max-w-xs mt-2 mb-4">La mesa está vacía en este momento. Abre una nueva comanda para sentar a los clientes.</p>
                  <button
                    onClick={() => {
                      setIsOpeningOrder(true);
                      setNewCustomerName('');
                      setCart([]);
                      if (waiters.length > 0) {
                        setNewWaiterId(waiters[0].id);
                      }
                    }}
                    id="btn-abrir-comanda"
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#2E4A3F] rounded-lg hover:bg-[#1E2F25] transition cursor-pointer"
                  >
                    <Plus size={16} className="mr-2" /> Abrir Comanda
                  </button>
                </div>
              )}

              {/* STAGE A: OPENING ORDER FORM */}
              {isOpeningOrder && (
                <form onSubmit={handleOpenOrderSubmit} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E5E0D8] pb-2 mb-2">
                    <span className="text-xs font-bold text-[#2E4A3F] uppercase tracking-wide">Nueva Comanda</span>
                    <button type="button" onClick={() => setIsOpeningOrder(false)} className="text-[#605850] hover:text-[#2E2A25] cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-2xs font-bold text-[#2E2A25] uppercase tracking-wider mb-1">Nombre del Cliente / Grupo</label>
                      <input
                        type="text"
                        placeholder="P. ej. Sr. Martínez"
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        className="w-full text-xs border border-[#E5E0D8] rounded-lg px-3 py-2 bg-[#FAF8F5] text-[#2E2A25] placeholder-[#a19a93] focus:ring-1 focus:ring-[#2E4A3F] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-[#2E2A25] uppercase tracking-wider mb-1">Mesero Asignado</label>
                      {currentUser && currentUser.role === 'waiter' ? (
                        <div className="w-full text-xs border border-[#CAD9D0] rounded-lg px-3 py-2 bg-[#EBF2EE] text-[#2F483A] font-bold">
                          🏃‍♂️ {currentUser.name} (Sesión Activa - ID: {currentUser.id})
                        </div>
                      ) : (
                        <select
                          value={newWaiterId}
                          onChange={e => setNewWaiterId(e.target.value)}
                          className="w-full text-xs border border-[#E5E0D8] rounded-lg px-3 py-2 bg-white text-[#2E2A25] focus:ring-1 focus:ring-[#2E4A3F] focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="">-- Seleccionar Mesero --</option>
                          {waiters.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      )}
                      {(!currentUser || currentUser.role !== 'waiter') && waiters.length === 0 && (
                        <p className="text-3xs text-[#AE593E] mt-1 font-semibold">⚠️ Primero activa al menos un mesero en la pestaña 'Personal'</p>
                      )}
                    </div>
                  </div>

                  {/* CART ACCORDION IN OPENING FORM */}
                  <div className="border border-[#E5E0D8] rounded-lg overflow-hidden bg-[#FAF8F5] p-3">
                    <span className="text-2xs font-bold text-[#2E2A25] uppercase tracking-wide block mb-2">Platillos pedidos ({cart.length})</span>
                    
                    {cart.map(cartItem => {
                      const itemObj = menu.find(m => m.id === cartItem.menuItemId);
                      if (!itemObj) return null;
                      return (
                        <div key={cartItem.menuItemId} className="flex flex-col border-b border-[#E5E0D8] last:border-0 py-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-[#2E2A25] max-w-[120px] truncate">{itemObj.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => removeFromCart(cartItem.menuItemId)}
                                className="w-5 h-5 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#605850] hover:bg-[#E5E2DC]"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="font-mono font-bold text-[#2E2A25] w-5 text-center">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(cartItem.menuItemId)}
                                className="w-5 h-5 rounded-full bg-[#E5ECE9] flex items-center justify-center text-[#2E4A3F] hover:bg-[#CAD9D0]"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Notas (p. ej. sin cebolla)"
                            value={cartItem.notes}
                            onChange={e => updateCartNotes(cartItem.menuItemId, e.target.value)}
                            className="text-3xs mt-1 w-full border border-[#E5E0D8] bg-white rounded px-2 py-1 text-[#2E2A25] focus:outline-none"
                          />
                        </div>
                      );
                    })}

                    {cart.length === 0 ? (
                      <p className="text-3xs text-[#605850] text-center py-6 italic">Usa el selector del menú abajo para añadir platillos</p>
                    ) : (
                      <div className="flex justify-between items-center text-xs font-bold text-[#2E2A25] pt-2 border-t border-[#E5E0D8] mt-2">
                        <span>Total Parcial:</span>
                        <span>${calculateCartTotal()} MXN</span>
                      </div>
                    )}
                  </div>

                  {/* SELECTOR DESDE EL MENÚ */}
                  <div>
                    <div className="flex justify-between items-center mb-1 bg-[#FAF8F5] p-1.5 rounded-t border-b border-[#E5E0D8] text-[#2E2A25] text-3xs font-semibold">
                      <span>CATEGORÍA MENÚ</span>
                    </div>
                    
                    <div className="space-y-2 mt-1">
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {['all', 'entrada', 'plato_fuerte', 'postre', 'bebida'].map(cat => (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2 py-0.5 text-3xs rounded-full border transition whitespace-nowrap cursor-pointer ${
                              selectedCategory === cat 
                                ? 'bg-[#2E4A3F] text-white border-[#2E4A3F]' 
                                : 'bg-white text-[#605850] border-[#E5E0D8] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            {cat === 'all' ? 'Ver todo' : cat.replace('_', ' ')}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-[140px] overflow-y-auto border border-[#E5E0D8] rounded-lg p-1 bg-white text-3xs divide-y divide-gray-100">
                        {filteredMenu.map(dish => (
                          <div key={dish.id} className="flex justify-between items-center py-1 px-1.5 hover:bg-[#FAF8F5]">
                            <div className="max-w-[70%]">
                              <span className="font-semibold text-[#2E2A25] line-clamp-1">{dish.name}</span>
                              <span className="text-[#C97A53] font-bold">${dish.price} MXN</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => addToCart(dish.id)}
                              className="px-1.5 py-0.5 rounded bg-[#2E4A3F] hover:bg-[#1E2F25] text-white font-bold inline-flex items-center cursor-pointer"
                            >
                              Agregar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={waiters.length === 0 || cart.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-[#2E4A3F] rounded-lg hover:bg-[#1E2F25] transition disabled:bg-[#A2B8AA] disabled:cursor-not-allowed cursor-pointer"
                  >
                    Abrir Comanda e Iniciar Cocina
                  </button>
                </form>
              )}

              {/* STAGE B: COMMANDA ACTIVE & VIEW DETAILS */}
              {activeOrder && !isAddingItems && (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#605850]">Cliente:</span>
                      <span className="font-bold text-[#2E2A25]">{activeOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605850]">Mesero:</span>
                      <span className="font-medium text-[#2E2A25]">{currentWaiter?.name || 'Desconocido'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605850]">Hora Entrada:</span>
                      <span className="font-mono text-[#605850]">
                        {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#605850]">Estado de Comanda:</span>
                      <span className="font-bold text-[#2E4A3F] capitalize text-3xs bg-[#E5ECE9] px-1.5 py-0.5 rounded border border-[#CAD9D0]">
                        {activeOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Active items list */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#2E2A25] border-b border-[#E5E0D8] pb-1 font-serif">
                      <span>Detalle de Consumo</span>
                      <span className="text-3xs font-sans text-[#605850]">({activeOrder.items.length} items)</span>
                    </div>

                    <div className="divide-y divide-[#E5E0D8] text-xs">
                      {activeOrder.items.map(item => {
                        const menuItem = menu.find(m => m.id === item.menuItemId);
                        if (!menuItem) return null;

                        return (
                          <div key={item.itemId} className="py-2.5 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <div className="max-w-[70%]">
                                <p className="font-bold text-[#2E2A25]">
                                  {item.quantity}x <span className="text-[#2E2A25] font-sans font-medium">{menuItem.name}</span>
                                </p>
                                {item.notes && (
                                  <p className="text-3xs text-[#C97A53] italic font-medium">Nota: "{item.notes}"</p>
                                )}
                              </div>
                              <div className="text-right font-mono font-bold text-[#2E2A25]">
                                <p>${menuItem.price * item.quantity} MXN</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-1">
                              {getItemStatusBadge(item.status)}
                              
                              {/* Waiter actions for item */}
                              <div className="flex gap-1">
                                {item.status === 'listo' && (
                                  <button
                                    onClick={() => onUpdateItemStatus(activeOrder.id, item.itemId, 'entregado')}
                                    className="px-2 py-0.5 text-3xs font-semibold rounded bg-[#2E4A3F] hover:bg-[#1E2F25] text-white cursor-pointer"
                                  >
                                    Servir
                                  </button>
                                )}
                                {item.status === 'pendiente' && (
                                  <span className="text-3xs text-[#605850]">Cocina pendiente</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing footer summary */}
                  <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 text-xs font-semibold text-[#2E2A25] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#605850]">Subtotal Consumo:</span>
                      <span className="font-mono">${orderTotalOriginal} MXN</span>
                    </div>
                    <div className="flex justify-between text-[#C97A53] text-3xs font-medium">
                      <span>IVA Incluido (16%):</span>
                      <span className="font-mono">${(orderTotalOriginal * 0.16).toFixed(1)} MXN</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-[#2E2A25] pt-1.5 border-t border-[#E5E0D8] mt-1 font-serif">
                      <span>Total Parcial:</span>
                      <span>${orderTotalOriginal} MXN</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsAddingItems(true);
                        setCart([]);
                        setSearchTerm('');
                      }}
                      id="btn-adicionar-platillos"
                      className="inline-flex items-center justify-center p-2.5 text-xs font-bold border border-[#CAD9D0] text-[#2E4A3F] bg-[#EBF2EE] rounded-lg hover:bg-[#DCE7E1] transition cursor-pointer"
                    >
                      <Plus size={14} className="mr-1" /> Adicionar
                    </button>

                    {selectedTable.status === 'ocupada' && (
                      <button
                        onClick={() => onUpdateTableStatus(selectedTable.id, 'cuenta_pedida')}
                        id="btn-pedir-cuenta"
                        className="inline-flex items-center justify-center p-2.5 text-xs font-bold border border-[#ECC8B8] text-[#AE593E] bg-[#FDF3EE] rounded-lg hover:bg-[#F9E2D8] transition animate-pulse cursor-pointer"
                      >
                        <FileText size={14} className="mr-1" /> Pedir Cuenta
                      </button>
                    )}

                    {selectedTable.status === 'cuenta_pedida' && (
                      <button
                        onClick={() => {
                          setIsCheckoutOpen(true);
                          setTipPercentage(10);
                          setPaymentMethod('efectivo');
                          setCashReceived('');
                        }}
                        id="btn-cobrar-caja"
                        className="col-span-2 inline-flex items-center justify-center p-3 text-xs font-bold text-white bg-[#2E4A3F] rounded-lg hover:bg-[#1E2F25] transition shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <DollarSign size={14} className="mr-1" /> Procesar Cobro (Caja)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE C: ADDING ITEMS TO AN EXISTING ORDER */}
              {isAddingItems && activeOrder && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E5E0D8] pb-2 mb-2">
                    <span className="text-xs font-bold text-[#C97A53] uppercase tracking-wide">Adicionar a la Mesa</span>
                    <button type="button" onClick={() => setIsAddingItems(false)} className="text-[#605850] hover:text-[#2E2A25] cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Cart Content */}
                  <div className="border border-[#ECC8B8] rounded-lg bg-[#FAF8F5] p-3">
                    <span className="text-2xs font-bold text-[#2E2A25] uppercase tracking-wide block mb-2">Para Cocinar</span>
                    
                    {cart.map(cartItem => {
                      const itemObj = menu.find(m => m.id === cartItem.menuItemId);
                      if (!itemObj) return null;
                      return (
                        <div key={cartItem.menuItemId} className="flex flex-col border-b border-[#E5E0D8] last:border-0 py-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-[#2E2A25] max-w-[120px] truncate">{itemObj.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => removeFromCart(cartItem.menuItemId)}
                                className="w-5 h-5 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#605850] hover:bg-[#E5E2DC]"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="font-mono font-bold text-[#2E2A25] w-5 text-center">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(cartItem.menuItemId)}
                                className="w-5 h-5 rounded-full bg-[#FAF0DE] flex items-center justify-center text-[#785C24] hover:bg-[#E8DCBF]"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Notas (p. ej. término medio)"
                            value={cartItem.notes}
                            onChange={e => updateCartNotes(cartItem.menuItemId, e.target.value)}
                            className="text-3xs mt-1 w-full border border-[#E5E0D8] bg-white rounded px-2 py-1 text-[#2E2A25] focus:outline-none"
                          />
                        </div>
                      );
                    })}

                    {cart.length === 0 ? (
                      <p className="text-3xs text-[#605850] text-[#7A7167] text-center py-6 italic">Selecciona platillos abajo para añadir</p>
                    ) : (
                      <div className="flex justify-between items-center text-xs font-bold text-[#2E2A25] pt-2 border-t border-[#ECC8B8] mt-2">
                        <span>Adición total:</span>
                        <span className="font-mono">${calculateCartTotal()} MXN</span>
                      </div>
                    )}
                  </div>

                  {/* Menu search Filter & list for adding */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar platillo..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-[#FAF8F5] text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                    />

                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {['all', 'entrada', 'plato_fuerte', 'postre', 'bebida'].map(cat => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2 py-0.5 text-3xs rounded-full border transition whitespace-nowrap cursor-pointer ${
                            selectedCategory === cat 
                              ? 'bg-[#2E4A3F] text-white border-[#2E4A3F]' 
                              : 'bg-white text-[#605850] border-[#E5E0D8] hover:bg-slate-50'
                          }`}
                        >
                          {cat === 'all' ? 'Ver todo' : cat.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-[160px] overflow-y-auto border border-[#E5E0D8] rounded-lg p-1 bg-white select-none divide-y divide-[#E5E0D8]">
                      {filteredMenu.map(dish => (
                        <div key={dish.id} className="flex justify-between items-center py-1.5 px-2 hover:bg-[#FAF8F5] text-3xs">
                          <div className="max-w-[70%]">
                            <span className="font-semibold text-[#2E2A25] block text-xs line-clamp-1">{dish.name}</span>
                            <span className="text-[#C97A53] font-bold font-mono">${dish.price} MXN</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(dish.id)}
                            className="px-2 py-1 rounded bg-[#2E4A3F] hover:bg-[#1E2F25] text-white font-bold cursor-pointer"
                          >
                            + Añadir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddMoreSubmit}
                    disabled={cart.length === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#C97A53] hover:bg-[#B76741] rounded-lg transition disabled:bg-[#ECC8B8] disabled:cursor-not-allowed cursor-pointer"
                  >
                    Confirmar Envío a Cocina
                  </button>
                </div>
              )}

            </div>

            {/* Sidebar Footer Close Drawer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8] text-center">
              <button
                onClick={() => setSelectedTable(null)}
                className="text-xs text-[#605850] hover:text-[#2E2A25] font-medium cursor-pointer"
              >
                Cerrar Panel Lateral
              </button>
            </div>

          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center text-center p-8 bg-[#FAF8F5] border-2 border-dashed border-[#CAD9D0] rounded-2xl min-h-[480px]">
            <Utensils size={32} className="text-[#CAD9D0] mb-2" />
            <h4 className="text-sm font-bold text-[#2E2A25] font-serif">Ninguna mesa seleccionada</h4>
            <p className="text-xs text-[#605850] max-w-2xs mt-1 leading-relaxed">Selecciona cualquiera de las mesas a la izquierda para visualizar el estado, registrar comandas o proceder con el cobro.</p>
          </div>
        )}
      </div>

      {/* CHECKOUT BOX DRAWER / OVERLAY MODAL */}
      {isCheckoutOpen && activeOrder && (
        <div className="fixed inset-0 bg-[#121B15]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E0D8] max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#2E2A25] flex items-center font-serif leading-none">
                  <DollarSign className="text-[#2E4A3F] mr-1" size={18} /> Terminal de Caja
                </h3>
                <p className="text-3xs text-[#605850] mt-1 font-mono uppercase tracking-widest font-black">
                  Mesa {selectedTable?.number} | Comanda: {activeOrder.id}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setCheckoutStage('details');
                }}
                className="text-[#605850] hover:text-[#2E2A25] rounded-full p-1 hover:bg-[#EFECE6] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Container based on activeStage */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* STAGE 1: TRANSACTION PARAMETERS SETUP */}
              {checkoutStage === 'details' && (
                <div className="space-y-4">
                  {/* Bill Subtotal */}
                  <div className="bg-[#FAF8F5] rounded-xl p-4 text-xs space-y-2 border border-[#E5E0D8]">
                    <div className="flex justify-between items-center text-[#605850]">
                      <span>Comensal / Cuenta:</span>
                      <span className="font-bold text-[#2E2A25]">{activeOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#605850]">Subtotal Consumido:</span>
                      <span className="font-bold text-[#2E2A25] font-mono font-bold">${orderTotalOriginal} MXN</span>
                    </div>
                    
                    {/* Tip percentages selector */}
                    <div className="pt-2.5 border-t border-[#EFECE6] space-y-1.5">
                      <span className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wide">Monto de Propina Sugerida</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 10, 15, 20].map(tip => (
                          <button
                            key={tip}
                            type="button"
                            onClick={() => setTipPercentage(tip)}
                            className={`py-1.5 text-center font-bold text-xs rounded-lg transition border cursor-pointer ${
                              tipPercentage === tip 
                                ? 'bg-[#2E4A3F] text-white border-[#2E4A3F] shadow-xs' 
                                : 'bg-white text-[#605850] border-[#E5E0D8] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            {tip}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between text-[#605850] text-3xs font-bold pt-1">
                      <span>Propinas Calculadas:</span>
                      <span className="font-mono text-xs text-[#2E4A3F]">${calculatedTip.toFixed(1)} MXN</span>
                    </div>

                    <div className="flex justify-between text-base font-extrabold text-[#2E2A25] border-t border-[#E5E0D8] pt-2 mt-2 font-serif">
                      <span>Total Neto en Caja:</span>
                      <span className="font-mono text-[#2E4A3F]">${checkoutTotal.toFixed(1)} MXN</span>
                    </div>
                  </div>

                  {/* Payment selection tabs */}
                  <div className="space-y-2">
                    <span className="block text-3xs font-extrabold text-[#2E2A25] uppercase tracking-wide">Método para Cobro</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('efectivo'); setCashReceived(''); }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition cursor-pointer ${
                          paymentMethod === 'efectivo' 
                            ? 'bg-[#EBF2EE] border-[#2E4A3F] text-[#2F483A] ring-2 ring-[#B8D1C2]' 
                            : 'bg-white border-[#E5E0D8] text-[#605850] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className="text-lg">💵</span>
                        <span>Efectivo (Cash)</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('tarjeta')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition cursor-pointer ${
                          paymentMethod === 'tarjeta' 
                            ? 'bg-[#EBF2EE] border-[#2E4A3F] text-[#2F483A] ring-2 ring-[#B8D1C2]' 
                            : 'bg-white border-[#E5E0D8] text-[#605850] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className="text-lg">💳</span>
                        <span>Tarjeta Bancaria</span>
                      </button>
                    </div>
                  </div>

                  {/* CASH METHOD change calculator with quick-bill helpers */}
                  {paymentMethod === 'efectivo' && (
                    <div className="space-y-3 bg-[#EBF2EE] border border-[#CAD9D0] p-4 rounded-xl animate-fadeIn">
                      <label className="block text-3xs font-extrabold text-[#2F483A] uppercase tracking-widest">
                        Cálculo de Cambio e Ingreso
                      </label>
                      
                      {/* Cash suggestion buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          Math.ceil(checkoutTotal),
                          Math.ceil(checkoutTotal / 100) * 100,
                          Math.ceil(checkoutTotal / 50) * 50 + (Math.ceil(checkoutTotal) % 50 === 0 ? 50 : 0),
                          200, 500, 1000
                        ]
                          .filter(val => val >= checkoutTotal && val <= 2000)
                          // Unique list
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .slice(0, 4)
                          .map(suggested => (
                            <button
                              key={suggested}
                              type="button"
                              onClick={() => setCashReceived(suggested.toString())}
                              className="px-2 py-1 text-3xs font-mono font-bold cursor-pointer rounded bg-white text-[#2E4A3F] border border-[#CAD9D0] hover:bg-[#FAF8F5] transition"
                            >
                              ${suggested} MXN
                            </button>
                          ))
                        }
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-2.5 text-xs font-bold text-[#2F483A]">$</span>
                          <input
                            type="number"
                            placeholder="Monto recibido en caja..."
                            value={cashReceived}
                            onChange={e => setCashReceived(e.target.value)}
                            className="w-full text-xs font-mono font-bold pl-6 border border-[#CAD9D0] bg-white rounded-lg p-2.5 focus:outline-none text-[#2E2A25]"
                          />
                        </div>
                        
                        {cashReceived && parseFloat(cashReceived) >= checkoutTotal && (
                          <div className="text-right text-xs bg-white border border-[#CAD9D0] px-3 py-1.5 rounded-lg flex flex-col justify-center shrink-0 min-w-[100px]">
                            <span className="text-4xs text-[#2F483A] uppercase font-black">Cambio a entregar:</span>
                            <span className="font-mono font-black text-sm text-[#2E4A3F] leading-none mt-0.5">
                              ${(parseFloat(cashReceived) - checkoutTotal).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {cashReceived && parseFloat(cashReceived) < checkoutTotal && (
                        <p className="text-[10px] font-semibold text-[#AE593E] italic">
                          ⚠️ El monto ingresado es menor al total de la cuenta.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions foot button */}
                  {paymentMethod === 'efectivo' ? (
                    <button
                      type="button"
                      onClick={() => setCheckoutStage('receipt')}
                      disabled={cashReceived === '' || parseFloat(cashReceived) < checkoutTotal}
                      className="w-full py-3 bg-[#2E4A3F] text-white rounded-xl font-bold hover:bg-[#1E2F25] transition text-xs shadow disabled:bg-[#A2B8AA] disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      💵 Registrar Pago de Efectivo y Ver Ticket
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCardProcessing}
                      className="w-full py-3 bg-[#2E4A3F] text-white rounded-xl font-bold hover:bg-[#1E2F25] transition text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      💳 Procesar Tarjeta Bancaria en Terminal POS
                    </button>
                  )}
                </div>
              )}

              {/* STAGE 2: CREDIT CARD TERMINAL CHIP SIMULATOR */}
              {checkoutStage === 'processing' && (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-6 animate-fadeIn">
                  
                  {/* Stylized physical POS terminal simulation layout */}
                  <div className="w-56 bg-slate-850 rounded-2xl p-4 shadow-xl border-4 border-slate-700 flex flex-col space-y-3 font-mono">
                    <div className="flex justify-between items-center text-[8px] text-gray-500">
                      <span>BANCO MULTIPOS v5.1</span>
                      <span className="text-emerald-500 font-bold">● ONLINE</span>
                    </div>
                    
                    {/* LCD Screen container */}
                    <div className="bg-[#1C2C24] text-[#7bf59e] p-3 rounded-lg border-2 border-slate-800 text-center min-h-[110px] flex flex-col justify-center items-center space-y-2 select-none">
                      {simulatedStep === 1 && (
                        <>
                          <div className="w-6 h-6 border-2 border-[#7bf59e] border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] font-black tracking-widest uppercase">CONECTANDO...</span>
                          <span className="text-[8px] text-gray-400">Inserte chip bancario</span>
                        </>
                      )}

                      {simulatedStep === 2 && (
                        <>
                          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] font-black text-indigo-300 uppercase">CONTACTANDO RED</span>
                          <span className="text-[8px] text-gray-400">Verificando adquirente</span>
                        </>
                      )}

                      {simulatedStep === 3 && (
                        <>
                          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] font-black text-amber-300 uppercase">SOLICITANDO PAGO</span>
                          <span className="text-[9px] text-[#7bf59e] font-black">${checkoutTotal.toFixed(1)} MXN</span>
                        </>
                      )}

                      {simulatedStep === 4 && (
                        <>
                          <span className="text-xl">🙌</span>
                          <span className="text-[10px] font-black tracking-widest text-[#7bf59e] uppercase">APROBADO</span>
                          <span className="text-[8px] text-gray-300 uppercase">Código: {simulatedAuthCode}</span>
                        </>
                      )}
                    </div>

                    {/* PIN Pad physical buttons map layout */}
                    <div className="grid grid-cols-3 gap-1.5 text-2xs text-gray-400 font-bold pt-1">
                      {['1','2','3','4','5','6','7','8','9','X','0','O'].map((keyName, idx) => {
                        let btnColor = 'bg-slate-800 text-white hover:bg-slate-750';
                        if (keyName === 'X') btnColor = 'bg-[#AE593E] text-white hover:bg-[#8F4730]';
                        if (keyName === 'O') btnColor = 'bg-emerald-600 text-white hover:bg-emerald-700';

                        return (
                          <div 
                            key={`k-${idx}`}
                            className={`p-1.5 text-center rounded border border-slate-700 font-sans ${btnColor}`}
                          >
                            {keyName}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-[#2E2A25]">
                      {simulatedStep < 4 ? "Estableciendo conexión encriptada..." : "¡Transacción segura procesada correctamente!"}
                    </span>
                    <p className="text-3xs text-[#605850] max-w-xs">
                      {simulatedStep < 4 
                        ? "Por favor no retire la tarjeta de la terminal de pago simulado ni reinicie la aplicación." 
                        : "El banco ha autorizado la transacción de tarjeta débito/crédito. Presiona continuar para ver el ticket de pago."}
                    </p>
                  </div>

                  {simulatedStep === 4 && (
                    <button
                      type="button"
                      onClick={() => setCheckoutStage('receipt')}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-[#2E4A3F] rounded-xl hover:bg-[#1E2F25] transition shadow animate-bounce cursor-pointer"
                    >
                      📄 Ir a Comprobante de Pago (Ticket)
                    </button>
                  )}
                </div>
              )}

              {/* STAGE 3: PRINTABLE TICKET COMPROBANTE RENDERING */}
              {checkoutStage === 'receipt' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Thermal Physical Receipt view layout */}
                  <div className="relative bg-[#FAF8F5] border-2 border-dashed border-[#CAD9D0] rounded-xl p-6 shadow-xs font-mono text-[#33302C] text-xs space-y-4 overflow-hidden select-text">
                    
                    {/* Receipt Header logo */}
                    <div className="text-center space-y-1 border-b border-[#E5E0D8] pb-3">
                      <span className="text-sm font-black tracking-widest text-[#2E4A3F] uppercase font-serif">SABOR & GESTIÓN</span>
                      <span className="block text-[10px] text-gray-500 font-semibold leading-none">RESTAURANTE Y BRASA S.A.</span>
                      <span className="block text-[9px] text-[#605850] leading-snug">
                        Av. Alfonso Reyes 204, Cuauhtémoc, México DF<br/>
                        RFC: SGE-260520-DF8 • TEL: 55-REST-SABOR
                      </span>
                    </div>

                    {/* Receipt metadata logs */}
                    <div className="text-[10px] text-[#5A524A] space-y-1 block border-b border-dashed border-[#CAD9D0]/50 pb-2 leading-relaxed">
                      <div className="flex justify-between">
                        <span>TICKET ID:</span>
                        <span className="font-bold">TKT-{activeOrder.id.toUpperCase()}-{Date.now().toString().slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FECHA Y HORA:</span>
                        <span className="font-bold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MESA CONTRATADA:</span>
                        <span className="font-bold">Mesa {selectedTable?.number} ({selectedTable?.section?.toUpperCase() || 'SALÓN'})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MESERO ASIGNADO:</span>
                        <span className="font-bold">{currentWaiter?.name || "Asignación general"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CLIENTE / SERVICIO:</span>
                        <span className="font-bold uppercase">{activeOrder.customerName}</span>
                      </div>
                    </div>

                    {/* Ticket Items columnized row checklist */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-3xs font-black uppercase text-[#605850] border-b border-[#E5E0D8] pb-1 font-sans">
                        <span>DESCRIPCIÓN COMIDAS</span>
                        <span>TOTAL</span>
                      </div>
                      
                      <div className="space-y-1 text-[#2E2A25]">
                        {activeOrder.items.map(oItem => {
                          const dbDish = menu.find(m => m.id === oItem.menuItemId);
                          return (
                            <div key={oItem.itemId} className="flex justify-between text-[11px] leading-tight">
                              <span>
                                {oItem.quantity}x <span className="font-sans font-medium text-[#2E2A25]">{dbDish ? dbDish.name : 'Platillo'}</span>
                              </span>
                              <span className="font-bold">${dbDish ? dbDish.price * oItem.quantity : 0}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total metrics calculations */}
                    <div className="border-t border-dashed border-[#CAD9D0]/60 pt-3 text-[11px] text-[#443E38] space-y-1.5 font-bold">
                      <div className="flex justify-between font-normal text-gray-500">
                        <span>SUBTOTAL CONSUMO:</span>
                        <span>${orderTotalOriginal} MXN</span>
                      </div>
                      <div className="flex justify-between font-normal text-gray-500">
                        <span>IVA INCLUIDO (16%):</span>
                        <span>${(orderTotalOriginal * 0.16).toFixed(1)} MXN</span>
                      </div>
                      <div className="flex justify-between font-normal text-gray-500">
                        <span>PROPINA CALCULADA ({tipPercentage}%):</span>
                        <span>${calculatedTip.toFixed(1)} MXN</span>
                      </div>
                      
                      <div className="flex justify-between text-sm font-black border-t-2 border-[#2E2A25] pt-2 text-[#2E2A25] font-serif">
                        <span>TOTAL COBRADO:</span>
                        <span>${checkoutTotal.toFixed(1)} MXN</span>
                      </div>
                    </div>

                    {/* Method Context breakdown */}
                    <div className="bg-[#EFECE6]/45 p-2 rounded-lg text-3xs text-gray-600 block space-y-1 leading-normal border border-[#E5E0D8]/45">
                      <div className="flex justify-between">
                        <span>MEDIO DE COBRO:</span>
                        <span className="font-bold">{paymentMethod === 'efectivo' ? '💵 EFECTIVO' : '💳 TARJETA'}</span>
                      </div>
                      {paymentMethod === 'efectivo' ? (
                        <>
                          <div className="flex justify-between">
                            <span>EFECTIVO ENTREGADO:</span>
                            <span className="font-bold">${parseFloat(cashReceived).toFixed(1)} MXN</span>
                          </div>
                          <div className="flex justify-between text-indigo-700 font-bold font-sans">
                            <span>CAMBIO DEVUELTO EN CAJA:</span>
                            <span>${(parseFloat(cashReceived) - checkoutTotal).toFixed(1)} MXN</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>TRANSACCIÓN TERMINAL:</span>
                            <span>APROBADA SEGURO (ONLINE)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ID AUTORIZACIÓN:</span>
                            <span>{simulatedAuthCode || 'Auth-283401'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Friendly Footer message */}
                    <div className="text-center text-[9px] text-gray-500 border-t border-[#E5E0D8] pt-2.5 leading-normal font-sans font-medium space-y-0.5">
                      <p className="font-bold text-gray-700 font-serif">¡GRACIAS POR SU VISITA!</p>
                      <p>Para facturar su ticket ingrese a:</p>
                      <p className="text-[#2E4A3F] underline">sabor-y-gestion.mex/factura</p>
                      <p className="text-[8px] italic text-[#C97A53] pt-1">Este no es un comprobante fiscal - Uso administrativo interno</p>
                    </div>

                  </div>

                  {/* Operational print instructions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        alert("🖨️ ¡Comprobante de cobro enviado exitosamente a la impresora térmica de caja principal en Barra de barra!");
                      }}
                      className="flex-1 py-2 bg-gradient-to-r bg-[#FAF8F5] text-[#2E4A3F] border border-[#CAD9D0] rounded-xl font-bold hover:bg-[#FAF8F5]/80 transition text-3xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🖨️ Simular Imprimir / Descargar PDF
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Confirmations */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex shrink-0">
              {checkoutStage !== 'receipt' ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setCheckoutStage('details');
                  }}
                  className="w-full py-2.5 border border-[#E5E0D8] text-[#605850] hover:bg-[#EFECE6] rounded-xl text-3xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar Cobro
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const finalRecVal = paymentMethod === 'efectivo' ? parseFloat(cashReceived) : checkoutTotal;
                    const finalChgVal = paymentMethod === 'efectivo' ? (parseFloat(cashReceived) - checkoutTotal) : 0;
                    handleProcessCheckout(finalRecVal, finalChgVal);
                  }}
                  className="w-full py-3 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle size={15} /> Confirmar Transacción, Liberar Mesa y Cerrar
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
