import React, { useState, useEffect } from 'react';
import { 
  Utensils, LayoutGrid, Flame, BookOpen, Users, Receipt, 
  HelpCircle, Sparkles, LogOut, CheckCircle, Clock 
} from 'lucide-react';
import { 
  RestaurantTable, MenuItem, StaffMember, Order, Sale, OrderItem, ItemStatus,
  INITIAL_TABLES, INITIAL_MENU, INITIAL_STAFF, INITIAL_ORDERS, INITIAL_SALES 
} from './types';
import ComandasView from './components/ComandasView';
import CocinaView from './components/CocinaView';
import PlatillosView from './components/PlatillosView';
import PersonalView from './components/PersonalView';
import VentasView from './components/VentasView';
import LoginView from './components/LoginView';
import ClientePortalView from './components/ClientePortalView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'comandas' | 'cocina' | 'platillos' | 'personal' | 'ventas'>('comandas');

  // Estado de usuario operando el sistema actualmente
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    const backup = localStorage.getItem('resto_session_user_v4');
    return backup ? JSON.parse(backup) : null;
  });

  // Forzar pestañas por rol conveniente al iniciar sesión
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'waiter') {
        setActiveTab('comandas');
      } else if (currentUser.role === 'chef') {
        setActiveTab('cocina');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('resto_session_user_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('resto_session_user_v4');
    }
  }, [currentUser]);

  // Master States with LocalStorage backups
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const backup = localStorage.getItem('resto_tables_state_v3');
    return backup ? JSON.parse(backup) : INITIAL_TABLES;
  });

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const backup = localStorage.getItem('resto_menu_state_v3');
    return backup ? JSON.parse(backup) : INITIAL_MENU;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const backup = localStorage.getItem('resto_staff_state_v3');
    const parsed = backup ? JSON.parse(backup) : INITIAL_STAFF;
    // Guarantee that at least one customer demo user exists
    if (!parsed.some((s: StaffMember) => s.role === 'customer')) {
      parsed.push({ 
        id: 'st-8', 
        name: 'Mesa Cliente (Demo)', 
        role: 'customer', 
        status: 'active', 
        avatarColor: 'bg-pink-500', 
        username: 'cliente', 
        password: '123' 
      });
    }
    return parsed;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const backup = localStorage.getItem('resto_orders_state_v3');
    return backup ? JSON.parse(backup) : INITIAL_ORDERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const backup = localStorage.getItem('resto_sales_state_v3');
    return backup ? JSON.parse(backup) : INITIAL_SALES;
  });

  // Sync to database simulated storage
  useEffect(() => {
    localStorage.setItem('resto_tables_state_v3', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('resto_menu_state_v3', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('resto_staff_state_v3', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('resto_orders_state_v3', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('resto_sales_state_v3', JSON.stringify(sales));
  }, [sales]);


  // CALLBACKS FOR MANAGING ORDERS
  const handleOpenOrder = (
    tableId: string, 
    customerName: string, 
    waiterId: string, 
    cartItems: { menuItemId: string; quantity: number; notes: string }[]
  ) => {
    const newOrderId = `ord-${Date.now().toString().slice(-4)}`;
    const newOrderItems: OrderItem[] = cartItems.map((cart, index) => ({
      itemId: `oi-${Date.now()}-${index}`,
      menuItemId: cart.menuItemId,
      quantity: cart.quantity,
      notes: cart.notes,
      status: 'pendiente'
    }));

    const ticketTotal = cartItems.reduce((sum, cart) => {
      const match = menu.find(m => m.id === cart.menuItemId);
      return sum + (match ? match.price * cart.quantity : 0);
    }, 0);

    const newOrder: Order = {
      id: newOrderId,
      tableId,
      waiterId,
      customerName,
      items: newOrderItems,
      status: 'recibida',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      total: ticketTotal
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Update Table status as occupied
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, status: 'ocupada', currentOrderId: newOrderId } 
        : table
    ));
  };


  const handleAddItemsToOrder = (
    orderId: string, 
    itemsToAdd: { menuItemId: string; quantity: number; notes: string }[]
  ) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const newItems: OrderItem[] = itemsToAdd.map((cart, index) => ({
        itemId: `oi-add-${Date.now()}-${index}`,
        menuItemId: cart.menuItemId,
        quantity: cart.quantity,
        notes: cart.notes,
        status: 'pendiente'
      }));

      const extendedItemsList = [...order.items, ...newItems];

      // Recompute ticket price
      const updatedTotal = extendedItemsList.reduce((sum, item) => {
        const match = menu.find(m => m.id === item.menuItemId);
        return sum + (match ? match.price * item.quantity : 0);
      }, 0);

      return {
        ...order,
        items: extendedItemsList,
        status: 'preparando', // Bump status back into action
        total: updatedTotal,
        updatedAt: new Date().toISOString()
      };
    }));
  };


  const handleUpdateItemStatus = (orderId: string, itemId: string, newStatus: ItemStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const updatedItems = order.items.map(item => 
        item.itemId === itemId ? { ...item, status: newStatus } : item
      );

      // Intelligent state machine calculation:
      // If all items are 'listo' or 'entregado', then the ticket itself becomes 'lista' for delivery.
      // If any item is in 'preparando' or 'pendiente', the order remains active.
      let finalOrderStatus = order.status;
      const allReadyOrServed = updatedItems.every(i => i.status === 'listo' || i.status === 'entregado');
      const allServed = updatedItems.every(i => i.status === 'entregado');

      if (allServed) {
        finalOrderStatus = 'entregada';
      } else if (allReadyOrServed) {
        finalOrderStatus = 'lista';
      } else if (updatedItems.some(i => i.status === 'preparando')) {
        finalOrderStatus = 'preparando';
      }

      return {
        ...order,
        items: updatedItems,
        status: finalOrderStatus,
        updatedAt: new Date().toISOString()
      };
    }));
  };


  const handleUpdateTableStatus = (tableId: string, status: RestaurantTable['status']) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status } : table
    ));
  };

  const handleUpdateTablePosition = (tableId: string, posX: number, posY: number, section?: RestaurantTable['section']) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, posX, posY, ...(section ? { section } : {}) } 
        : table
    ));
  };


  const handleCloseOrder = (
    orderId: string, 
    paymentMethod: 'efectivo' | 'tarjeta', 
    tipPercentage: number,
    receivedAmount?: number,
    changeAmount?: number
  ) => {
    const orderToClose = orders.find(o => o.id === orderId);
    if (!orderToClose) return;

    const selectedTable = tables.find(t => t.id === orderToClose.tableId);
    const assignedWaiter = staff.find(s => s.id === orderToClose.waiterId);

    const baseAmount = orderToClose.items.reduce((sum, item) => {
      const match = menu.find(m => m.id === item.menuItemId);
      return sum + (match ? match.price * item.quantity : 0);
    }, 0);

    const tipAmount = baseAmount * (tipPercentage / 100);
    const finalBillValue = baseAmount + tipAmount;

    // Build the items details snapshot
    const saleItemsSnapshot = orderToClose.items.map(oItem => {
      const dbItem = menu.find(m => m.id === oItem.menuItemId);
      return {
        name: dbItem ? dbItem.name : 'Platillo',
        price: dbItem ? dbItem.price : 0,
        quantity: oItem.quantity,
        notes: oItem.notes
      };
    });

    // Create a new sales log
    const newSale: Sale = {
      id: `s-${Date.now().toString().slice(-4)}`,
      orderId: orderId,
      tableNumber: selectedTable ? selectedTable.number : 0,
      waiterName: assignedWaiter ? assignedWaiter.name : 'Mesero general',
      clientName: orderToClose.customerName,
      date: new Date().toISOString(),
      total: finalBillValue,
      paymentMethod,
      itemsCount: orderToClose.items.reduce((acc, i) => acc + i.quantity, 0),
      items: saleItemsSnapshot,
      subtotal: baseAmount,
      tipAmount: tipAmount,
      receivedAmount,
      changeAmount
    };

    setSales(prev => [newSale, ...prev]);

    // Update order status
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'pagada', paymentMethod, total: finalBillValue, updatedAt: new Date().toISOString() } 
        : order
    ));

    // Release and vacate Table
    setTables(prev => prev.map(table => 
      table.id === orderToClose.tableId 
        ? { ...table, status: 'disponible', currentOrderId: undefined } 
        : table
    ));
  };


  // CALLBACKS FOR MANAGING PLATILLOS / CATALOGUE
  const handleAddMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `m-${Date.now().toString().slice(-4)}`
    };
    setMenu(prev => [...prev, newItem]);
  };

  const handleUpdateMenuItem = (id: string, updatedData: Partial<MenuItem>) => {
    setMenu(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedData } : item
    ));
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenu(prev => prev.filter(item => item.id !== id));
  };


  // CALLBACKS FOR MANAGING STAFF
  const handleAddStaffMember = (memberData: Omit<StaffMember, 'id' | 'avatarColor'>) => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500', 'bg-teal-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newMember: StaffMember = {
      ...memberData,
      id: `st-${Date.now().toString().slice(-3)}`,
      avatarColor: randomColor
    };
    setStaff(prev => [...prev, newMember]);
  };

  const handleUpdateStaffMember = (id: string, updatedData: Partial<StaffMember>) => {
    setStaff(prev => prev.map(member => 
      member.id === id ? { ...member, ...updatedData } : member
    ));
  };

  const handleDeleteStaffMember = (id: string) => {
    setStaff(prev => prev.filter(member => member.id !== id));
  };

  const handleClearSalesHistory = () => {
    setSales([]);
  };


  // Quick top-line summary calculations
  const occupiedTablesCount = tables.filter(t => t.status !== 'disponible').length;
  
  const cookingItemsCount = orders
    .filter(o => o.status !== 'pagada' && o.status !== 'cancelada')
    .reduce((sum, o) => sum + o.items.filter(i => i.status === 'pendiente' || i.status === 'preparando').length, 0);

  const earningsToday = sales.reduce((sum, s) => sum + s.total, 0);

  if (!currentUser) {
    return <LoginView staff={staff} tables={tables} onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#2E2A25] font-sans flex flex-col antialiased">
      
      {/* 1. MASTER BRAND NAVIGATION HEADER */}
      <nav className="bg-[#1E2F25] text-[#FAFAFA] shadow-md border-b border-[#132018]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E4A3F] flex items-center justify-center text-[#F5F2EB] shadow-inner border border-[#406354]">
                <Utensils size={18} className="translate-y-[-0.5px]" />
              </div>
              <div>
                <span className="font-serif italic font-light text-white text-xl tracking-wide">Sabor & Gestión</span>
                <span className="block text-[8px] uppercase tracking-widest text-[#B2C6BA] font-medium">Gestión de Restaurante</span>
              </div>
            </div>

            {/* Micro Dashboard Widget Indicators */}
            <div className="hidden sm:flex items-center gap-6 text-xs border-l border-[#2F4839] pl-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D1A153] animate-pulse"></span>
                <div>
                  <span className="block text-[8px] text-[#A2B8AA] uppercase font-bold tracking-wider">Mesas Ocupadas</span>
                  <span className="font-bold text-gray-200">{occupiedTablesCount} de {tables.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-[#C97A53]" />
                <div>
                  <span className="block text-[8px] text-[#A2B8AA] uppercase font-bold tracking-wider">Cocina Activa</span>
                  <span className="font-bold text-gray-200">{cookingItemsCount} órdenes</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#4A7055]/30 text-[#A2B8AA] flex items-center justify-center font-bold text-[9px] border border-[#4A7055]/40">$</div>
                <div>
                  <span className="block text-[8px] text-[#A2B8AA] uppercase font-bold tracking-wider">Caja del Día</span>
                  <span className="font-bold text-[#EBF2EE] font-mono">${earningsToday.toLocaleString()} MXN</span>
                </div>
              </div>
            </div>

            {/* Time Stamp Indicator & Active user with LogOut */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-[10px] text-[#A2B8AA] font-mono bg-[#132018] px-2.5 py-1 rounded-md border border-[#2F4839]">
                UTC: 2026-05-20
              </div>

              <div className="bg-[#132018] border border-[#2F4839] rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${currentUser.avatarColor || 'bg-slate-400'} text-white`}>
                  {currentUser.name[0].toUpperCase()}
                </div>
                <div className="text-left leading-none">
                  <span className="block text-[10px] font-bold text-[#EBF2EE]">{currentUser.name}</span>
                  <span className="block text-[8px] uppercase tracking-widest text-[#A2B8AA] font-extrabold mt-0.5">
                    {currentUser.role === 'manager' && 'Admin 🔑'}
                    {currentUser.role === 'waiter' && 'Mesero 🏃‍♂️'}
                    {currentUser.role === 'customer' && 'Cliente 🍽️'}
                    {currentUser.role === 'chef' && 'Chef 🧑‍🍳'}
                    {currentUser.role === 'cashier' && 'Cajero 💳'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentUser(null);
                }}
                id="btn-logout-header"
                className="p-1.5 rounded-lg bg-[#2E4A3F] text-white hover:bg-[#AE593E] hover:text-white transition cursor-pointer flex items-center gap-1 text-2xs font-bold"
                title="Cerrar Sesión"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* 2. TAB CONTROLLER LINK BAR */}
      {currentUser.role !== 'customer' && (
        <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-2 py-3 scrollbar-none">
              
              <button
                onClick={() => setActiveTab('comandas')}
                id="tab-comandas"
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'comandas'
                    ? 'bg-[#2E4A3F] text-white shadow-xs'
                    : 'bg-[#EFECE6] text-[#605850] hover:bg-[#E5E2DC] hover:text-[#2E2A25]'
                }`}
              >
                <LayoutGrid size={15} />
                Mesas y Comandas
              </button>

              {currentUser.role !== 'waiter' && (
                <>
                  <button
                    onClick={() => setActiveTab('cocina')}
                    id="tab-cocina"
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 relative cursor-pointer ${
                      activeTab === 'cocina'
                        ? 'bg-[#2E4A3F] text-white shadow-xs'
                        : 'bg-[#EFECE6] text-[#605850] hover:bg-[#E5E2DC] hover:text-[#2E2A25]'
                    }`}
                  >
                    <Flame size={15} />
                    Estación de Cocina
                    {cookingItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C97A53] text-[#FAF8F5] flex items-center justify-center text-3xs font-bold animate-bounce shadow-md">
                        {cookingItemsCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('platillos')}
                    id="tab-platillos"
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'platillos'
                        ? 'bg-[#2E4A3F] text-white shadow-xs'
                        : 'bg-[#EFECE6] text-[#605850] hover:bg-[#E5E2DC] hover:text-[#2E2A25]'
                    }`}
                  >
                    <BookOpen size={15} />
                    Menú de Platillos
                  </button>

                  <button
                    onClick={() => setActiveTab('personal')}
                    id="tab-personal"
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'personal'
                        ? 'bg-[#2E4A3F] text-white shadow-xs'
                        : 'bg-[#EFECE6] text-[#605850] hover:bg-[#E5E2DC] hover:text-[#2E2A25]'
                    }`}
                  >
                    <Users size={15} />
                    Personal de Turno
                  </button>

                  <button
                    onClick={() => setActiveTab('ventas')}
                    id="tab-ventas"
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'ventas'
                        ? 'bg-[#2E4A3F] text-white shadow-xs'
                        : 'bg-[#EFECE6] text-[#605850] hover:bg-[#E5E2DC] hover:text-[#2E2A25]'
                    }`}
                  >
                    <Receipt size={15} />
                    Caja y Ventas
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE TAB PANEL CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'customer' ? (
          <ClientePortalView
            tables={tables}
            menu={menu}
            orders={orders}
            staff={staff}
            onUpdateTableStatus={handleUpdateTableStatus}
            onCloseOrder={handleCloseOrder}
            onOpenOrder={handleOpenOrder}
            onAddItemsToOrder={handleAddItemsToOrder}
            currentUser={currentUser}
          />
        ) : (
          <>
            {activeTab === 'comandas' && (
              <ComandasView
                tables={tables}
                menu={menu}
                staff={staff}
                orders={orders}
                sales={sales}
                onOpenOrder={handleOpenOrder}
                onAddItemsToOrder={handleAddItemsToOrder}
                onUpdateItemStatus={handleUpdateItemStatus}
                onUpdateTableStatus={handleUpdateTableStatus}
                onCloseOrder={handleCloseOrder}
                onUpdateTablePosition={handleUpdateTablePosition}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'cocina' && (
              <CocinaView
                orders={orders}
                menu={menu}
                onUpdateItemStatus={handleUpdateItemStatus}
              />
            )}

            {activeTab === 'platillos' && (
              <PlatillosView
                menu={menu}
                onAddMenuItem={handleAddMenuItem}
                onUpdateMenuItem={handleUpdateMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
              />
            )}

            {activeTab === 'personal' && (
              <PersonalView
                staff={staff}
                onAddStaffMember={handleAddStaffMember}
                onUpdateStaffMember={handleUpdateStaffMember}
                onDeleteStaffMember={handleDeleteStaffMember}
              />
            )}

            {activeTab === 'ventas' && (
              <VentasView
                sales={sales}
                onClearHistory={handleClearSalesHistory}
              />
            )}
          </>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#1E2F25] text-[#A2B8AA] py-8 text-center border-t border-[#132018] text-3xs font-medium">
        <p className="tracking-wide">Sabor & Gestión • Motor de Control de Restaurante Refinado • Hecho para Servicio de Cocina y Control de Caja</p>
        <p className="text-[#658572] mt-1.5 font-mono">2026 • Los datos persistirán localmente en este dispositivo</p>
      </footer>

    </div>
  );
}
