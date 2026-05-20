export type StaffRole = 'waiter' | 'chef' | 'cashier' | 'manager' | 'customer';
export type StaffStatus = 'active' | 'break' | 'inactive';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  avatarColor: string;
  username?: string;
  password?: string;
}

export type MenuCategory = 'entrada' | 'plato_fuerte' | 'postre' | 'bebida';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  description: string;
  available: boolean;
  prepTimeMinutes: number;
}

export type TableStatus = 'disponible' | 'ocupada' | 'cuenta_pedida';

export interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  section?: 'salon' | 'terraza' | 'barra' | 'vip';
  posX?: number; // relative percentage X
  posY?: number; // relative percentage Y
}

export type ItemStatus = 'pendiente' | 'preparando' | 'listo' | 'entregado';

export interface OrderItem {
  itemId: string;
  menuItemId: string;
  quantity: number;
  notes: string;
  status: ItemStatus;
}

export type OrderStatus = 'recibida' | 'preparando' | 'lista' | 'entregada' | 'pagada' | 'cancelada';

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  total: number;
  paymentMethod?: 'efectivo' | 'tarjeta';
}

export interface Sale {
  id: string;
  orderId: string;
  tableNumber: number;
  waiterName: string;
  clientName: string;
  date: string;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta';
  itemsCount: number;
  items?: { name: string; price: number; quantity: number; notes?: string }[];
  subtotal?: number;
  tipAmount?: number;
  receivedAmount?: number;
  changeAmount?: number;
}

// Semillas iniciales / Initial mock data
export const INITIAL_STAFF: StaffMember[] = [
  { id: 'st-1', name: 'Carlos Mendoza', role: 'manager', status: 'active', avatarColor: 'bg-indigo-500', username: 'admin', password: '123' },
  { id: 'st-2', name: 'Sofía Rodríguez', role: 'waiter', status: 'active', avatarColor: 'bg-emerald-500', username: 'sofia', password: '123' },
  { id: 'st-3', name: 'Mateo Guerrero', role: 'waiter', status: 'active', avatarColor: 'bg-teal-500', username: 'mateo', password: '123' },
  { id: 'st-4', name: 'Laura Gómez', role: 'waiter', status: 'break', avatarColor: 'bg-cyan-500', username: 'laura', password: '123' },
  { id: 'st-5', name: 'Chef Alejandro', role: 'chef', status: 'active', avatarColor: 'bg-amber-500', username: 'chef1', password: '123' },
  { id: 'st-6', name: 'Chef Valentina', role: 'chef', status: 'active', avatarColor: 'bg-rose-500', username: 'chef2', password: '123' },
  { id: 'st-7', name: 'Andrés López', role: 'cashier', status: 'active', avatarColor: 'bg-purple-500', username: 'cajero', password: '123' },
  { id: 'st-8', name: 'Mesa Cliente (Demo)', role: 'customer', status: 'active', avatarColor: 'bg-pink-500', username: 'cliente', password: '123' },
];

export const INITIAL_MENU: MenuItem[] = [
  // Entradas
  { id: 'm-1', name: 'Nachos Supremos', price: 160, category: 'entrada', description: 'Totopos crujientes con queso fundido, frijoles, guacamole y jalapeños.', available: true, prepTimeMinutes: 10 },
  { id: 'm-2', name: 'Gyoza de Cerdo (6 pzs)', price: 120, category: 'entrada', description: 'Empanadillas japonesas al vapor y doradas a la plancha con salsa ponzu.', available: true, prepTimeMinutes: 12 },
  { id: 'm-3', name: 'Provoleta Asada', price: 140, category: 'entrada', description: 'Queso provolone fundido con finas hierbas y pan de ajo tostado.', available: true, prepTimeMinutes: 8 },
  
  // Platos Fuertes
  { id: 'm-4', name: 'Hamburguesa Premium', price: 210, category: 'plato_fuerte', description: '200g de carne de res, queso cheddar, tocino ahumado, cebolla caramelizada y papas fritas.', available: true, prepTimeMinutes: 15 },
  { id: 'm-5', name: 'Ribeye Steak standard', price: 340, category: 'plato_fuerte', description: 'Corte de Ribeye certificado de 350g asado al gusto con puré de papa y espárragos.', available: true, prepTimeMinutes: 20 },
  { id: 'm-6', name: 'Fettuccine Alfredo con Pollo', price: 185, category: 'plato_fuerte', description: 'Pasta fettuccine con crema de parmesano caliente, pechuga de pollo a la parrilla.', available: true, prepTimeMinutes: 15 },
  { id: 'm-7', name: 'Tacos de Barbacoa (3 pzs)', price: 150, category: 'plato_fuerte', description: 'Tortillas de maíz hechas a mano, barbacoa de borrego, cebolla picada y cilantro.', available: true, prepTimeMinutes: 10 },
  { id: 'm-8', name: 'Pizza Margherita Grande', price: 220, category: 'plato_fuerte', description: 'Salsa de tomate pomodoro, mozzarella fresca, albahaca orgánica y aceite de oliva.', available: true, prepTimeMinutes: 12 },

  // Postres
  { id: 'm-9', name: 'Volcán de Chocolate', price: 95, category: 'postre', description: 'Bizcocho tibio de chocolate relleno de fudge derretido, acompañado con helado de vainilla.', available: true, prepTimeMinutes: 15 },
  { id: 'm-10', name: 'Cheesecake de Frutos Rojos', price: 85, category: 'postre', description: 'Clásico pay de queso cremoso estilo NY cubierto con compota casera.', available: true, prepTimeMinutes: 5 },
  
  // Bebidas
  { id: 'm-11', name: 'Limonada de Lavanda (400ml)', price: 55, category: 'bebida', description: 'Bebida refrescante gasificada con jarabe natural de lavanda orgánica.', available: true, prepTimeMinutes: 5 },
  { id: 'm-12', name: 'Cerveza Artesanal IPA', price: 75, category: 'bebida', description: 'Cerveza craft nacional, amarga con toques cítricos y florales.', available: true, prepTimeMinutes: 3 },
  { id: 'm-13', name: 'Café Capuchino', price: 60, category: 'bebida', description: 'Café expreso con leche vaporizada y espuma suave con un toque de canela.', available: true, prepTimeMinutes: 4 },
];

export const INITIAL_TABLES: RestaurantTable[] = [
  { id: 't-1', number: 1, capacity: 2, status: 'disponible', section: 'salon', posX: 14, posY: 20 },
  { id: 't-2', number: 2, capacity: 4, status: 'ocupada', currentOrderId: 'ord-101', section: 'salon', posX: 14, posY: 52 },
  { id: 't-3', number: 3, capacity: 4, status: 'disponible', section: 'salon', posX: 40, posY: 20 },
  { id: 't-4', number: 4, capacity: 6, status: 'cuenta_pedida', currentOrderId: 'ord-102', section: 'salon', posX: 40, posY: 52 },
  { id: 't-5', number: 5, capacity: 2, status: 'disponible', section: 'barra', posX: 14, posY: 82 },
  { id: 't-6', number: 6, capacity: 8, status: 'disponible', section: 'vip', posX: 76, posY: 20 },
  { id: 't-7', number: 7, capacity: 4, status: 'ocupada', currentOrderId: 'ord-103', section: 'terraza', posX: 76, posY: 52 },
  { id: 't-8', number: 8, capacity: 2, status: 'disponible', section: 'terraza', posX: 76, posY: 82 },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    tableId: 't-2',
    waiterId: 'st-2',
    customerName: 'Familia Gómez',
    items: [
      { itemId: 'oi-1001', menuItemId: 'm-1', quantity: 1, notes: 'Sin chiles jalapeños', status: 'entregado' },
      { itemId: 'oi-1002', menuItemId: 'm-4', quantity: 2, notes: 'Término 3/4', status: 'preparando' },
      { itemId: 'oi-1003', menuItemId: 'm-11', quantity: 3, notes: 'Muy frías', status: 'entregado' }
    ],
    status: 'preparando',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    total: 160 + (210 * 2) + (55 * 3) // 160 + 420 + 165 = 745
  },
  {
    id: 'ord-102',
    tableId: 't-4',
    waiterId: 'st-3',
    customerName: 'Sra. Patricia Rojas',
    items: [
      { itemId: 'oi-2001', menuItemId: 'm-5', quantity: 1, notes: 'Bien cocido', status: 'entregado' },
      { itemId: 'oi-2002', menuItemId: 'm-9', quantity: 1, notes: 'Traer junto al café', status: 'listo' },
      { itemId: 'oi-2003', menuItemId: 'm-13', quantity: 1, notes: 'Con azúcar mascabado', status: 'entregado' }
    ],
    status: 'lista',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    total: 340 + 95 + 60 // 495
  },
  {
    id: 'ord-103',
    tableId: 't-7',
    waiterId: 'st-2',
    customerName: 'Luis & Ana',
    items: [
      { itemId: 'oi-3001', menuItemId: 'm-2', quantity: 1, notes: 'Salsa ponzu extra', status: 'pendiente' },
      { itemId: 'oi-3002', menuItemId: 'm-6', quantity: 1, notes: 'Pollo bien asado', status: 'pendiente' },
      { itemId: 'oi-3003', menuItemId: 'm-12', quantity: 2, notes: 'Traer inmediato', status: 'entregado' }
    ],
    status: 'recibida',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    total: 120 + 185 + (75 * 2) // 455
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 's-5001',
    orderId: 'ord-090',
    tableNumber: 3,
    waiterName: 'Sofía Rodríguez',
    clientName: 'Juan Carlos',
    date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    total: 480,
    paymentMethod: 'tarjeta',
    itemsCount: 3,
    subtotal: 436.4,
    tipAmount: 43.6,
    items: [
      { name: 'Hamburguesa Premium', price: 210, quantity: 1, notes: 'Sin cebolla' },
      { name: 'Limonada de Lavanda (400ml)', price: 55, quantity: 2 }
    ]
  },
  {
    id: 's-5002',
    orderId: 'ord-091',
    tableNumber: 1,
    waiterName: 'Mateo Guerrero',
    clientName: 'Sofía',
    date: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    total: 320,
    paymentMethod: 'efectivo',
    itemsCount: 2,
    subtotal: 290.9,
    tipAmount: 29.1,
    receivedAmount: 350,
    changeAmount: 30,
    items: [
      { name: 'Nachos Supremos', price: 160, quantity: 1 },
      { name: 'Gyoza de Cerdo (6 pzs)', price: 120, quantity: 1 }
    ]
  },
  {
    id: 's-5003',
    orderId: 'ord-092',
    tableNumber: 5,
    waiterName: 'Laura Gómez',
    clientName: 'Reservación Sr. Torres',
    date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    total: 1250,
    paymentMethod: 'tarjeta',
    itemsCount: 7,
    subtotal: 1100,
    tipAmount: 150,
    items: [
      { name: 'Ribeye Steak standard', price: 340, quantity: 2, notes: 'Término medio' },
      { name: 'Pizza Margherita Grande', price: 220, quantity: 1 },
      { name: 'Cerveza Artesanal IPA', price: 75, quantity: 4 }
    ]
  },
];
