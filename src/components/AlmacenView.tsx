import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, Calendar, DollarSign, AlertTriangle, Plus, Search, 
  Trash2, Layers, CheckCircle2, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import { StaffMember } from '../types';

interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
}

interface SupplyEntry {
  id: string;
  ingredientId: string;
  ingredientName: string;
  supplier: string;
  quantity: number;
  cost: number;
  expiryDate: string;
  receivedDate: string;
}

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Carne Molida de Res', stock: 45, unit: 'kg', minStock: 15 },
  { id: 'ing-2', name: 'Queso Cheddar Rayado', stock: 28, unit: 'kg', minStock: 8 },
  { id: 'ing-3', name: 'Totopos de Maíz Caseros', stock: 12, unit: 'kg', minStock: 5 },
  { id: 'ing-4', name: 'Lechuga Romana Fresca', stock: 3, unit: 'kg', minStock: 5 }, // Low stock warning!
  { id: 'ing-5', name: 'Pan Brioche para Hamburguesa', stock: 120, unit: 'piezas', minStock: 30 },
  { id: 'ing-6', name: 'Salsa Ponzu Especial', stock: 4.5, unit: 'litros', minStock: 2 },
  { id: 'ing-7', name: 'Masa de Trigo Fresca', stock: 18, unit: 'kg', minStock: 8 },
  { id: 'ing-8', name: 'Chocolate Orgánico del 70%', stock: 2.2, unit: 'kg', minStock: 3 }, // Low stock warning!
  { id: 'ing-9', name: 'Vino Tinto de la Casa', stock: 15, unit: 'botellas', minStock: 4 },
];

const INITIAL_SUPPLIES: SupplyEntry[] = [
  { id: 'sup-1', ingredientId: 'ing-1', ingredientName: 'Carne Molida de Res', supplier: 'Carnes de Sonora S.A.', quantity: 20, cost: 3100, expiryDate: '2026-05-28', receivedDate: '2026-05-20' },
  { id: 'sup-2', ingredientId: 'ing-5', ingredientName: 'Pan Brioche para Hamburguesa', supplier: 'Panadería La Francesa', quantity: 100, cost: 1200, expiryDate: '2026-05-25', receivedDate: '2026-05-21' },
  { id: 'sup-3', ingredientId: 'ing-4', ingredientName: 'Lechuga Romana Fresca', supplier: 'Distribuidora Rancho Verde', quantity: 10, cost: 350, expiryDate: '2026-05-24', receivedDate: '2026-05-19' },
];

interface AlmacenViewProps {
  currentUser: StaffMember;
}

export default function AlmacenView({ currentUser }: AlmacenViewProps) {
  // Local state persistence
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('resto_almacen_ing_v1');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [supplies, setSupplies] = useState<SupplyEntry[]>(() => {
    const saved = localStorage.getItem('resto_almacen_sup_v1');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIES;
  });

  useEffect(() => {
    localStorage.setItem('resto_almacen_ing_v1', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('resto_almacen_sup_v1', JSON.stringify(supplies));
  }, [supplies]);

  // Form states to register ingredients entry (supplies)
  const [selectedIngId, setSelectedIngId] = useState(ingredients[0]?.id || '');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [cost, setCost] = useState<number>(500);
  const [expiryDate, setExpiryDate] = useState('2026-05-30');

  // Form states to create brand new raw ingredient definition
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngMinStock, setNewIngMinStock] = useState<number>(5);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Handle incoming stock entry submission
  const handleRegisterSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngId || !supplier || quantity <= 0 || cost <= 0) return;

    const matchedIng = ingredients.find(i => i.id === selectedIngId);
    if (!matchedIng) return;

    const newSupply: SupplyEntry = {
      id: `sup-${Date.now()}`,
      ingredientId: selectedIngId,
      ingredientName: matchedIng.name,
      supplier: supplier.trim(),
      quantity: Number(quantity),
      cost: Number(cost),
      expiryDate,
      receivedDate: new Date().toISOString().split('T')[0]
    };

    // Increment current stock of the ingredient
    setIngredients(prev => prev.map(ing => {
      if (ing.id === selectedIngId) {
        return { ...ing, stock: ing.stock + Number(quantity) };
      }
      return ing;
    }));

    setSupplies(prev => [newSupply, ...prev]);
    
    // Reset and feedback
    setSupplier('');
    setQuantity(10);
    setCost(500);
  };

  // Handle building a new raw ingredient type
  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;

    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newIngName.trim(),
      stock: 0, // starts at 0 until supply entry is submitted
      unit: newIngUnit,
      minStock: Number(newIngMinStock)
    };

    setIngredients(prev => [...prev, newIng]);
    setSelectedIngId(newIng.id); // pre-select in incoming form

    // Reset
    setNewIngName('');
    setIsAddIngredientOpen(false);
  };

  // Delete an entry of supplies
  const handleDeleteSupply = (supplyId: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de inventario? Esto devolverá el stock anterior del ingrediente.')) {
      const target = supplies.find(s => s.id === supplyId);
      if (target) {
        setIngredients(prev => prev.map(ing => {
          if (ing.id === target.ingredientId) {
            return { ...ing, stock: Math.max(0, ing.stock - target.quantity) };
          }
          return ing;
        }));
      }
      setSupplies(prev => prev.filter(s => s.id !== supplyId));
    }
  };

  // Delete an ingredient type definition
  const handleDeleteIngredient = (ingId: string) => {
    const matched = ingredients.find(i => i.id === ingId);
    if (matched && confirm(`¿Deseas dar de baja el ingrediente "${matched.name}" de la base de datos de almacén?`)) {
      setIngredients(prev => prev.filter(i => i.id !== ingId));
    }
  };

  // Stats
  const lowStockCount = ingredients.filter(i => i.stock <= i.minStock).length;
  const totalItemsRegistered = ingredients.length;
  const totalSupplySpent = supplies.reduce((acc, curr) => acc + curr.cost, 0);

  // Filter
  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. TOP SECURED BRANDING BANNER */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-900 border border-stone-700 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-amber-500 font-black text-black font-mono text-3xs uppercase tracking-wider">
              Módulo de Almacén Protegido
            </span>
            <span className="text-stone-400 font-mono text-[10px]">v1.4 • Cifrado Local</span>
          </div>
          <h2 className="text-xl font-serif font-black tracking-tight text-stone-100">
            Control de Existencias e Ingreso de Proveedores
          </h2>
          <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
            Sección restringida operada por <strong>{currentUser.name} ({currentUser.role === 'warehouse' ? 'Encargado de Almacén' : 'Administrador'})</strong>. Registra entradas de materias primas con costos exactos y fechas de caducidad para proteger la frescura culinaria.
          </p>
        </div>

        <div className="bg-stone-800/80 border border-stone-700/60 rounded-2xl p-3 flex items-center gap-2 max-w-xs text-3xs text-stone-300">
          <ShieldAlert size={20} className="text-amber-500 shrink-0" />
          <span>
            Este portal <strong>bloquea</strong> el acceso a las ventas, caja chica y datos confidenciales del personal para mantener el principio de privilegio mínimo de inventario.
          </span>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Materia Prima Insuficiente</span>
            <span className="text-lg font-bold font-mono text-orange-600">{lowStockCount} alertas</span>
            <p className="text-[10px] text-gray-500 leading-none">Elementos por debajo de reserva mínima</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Package size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Ingredientes Registrados</span>
            <span className="text-lg font-bold font-mono text-emerald-700">{totalItemsRegistered} unidades</span>
            <p className="text-[10px] text-gray-500 leading-none">Artículos catalogados en almacén</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="block text-4xs uppercase tracking-widest text-[#605850] font-black">Gastos Totales Proveedores</span>
            <span className="text-lg font-bold font-mono text-stone-850">${totalSupplySpent.toLocaleString()} MXN</span>
            <p className="text-[10px] text-gray-500 leading-none">Inversión acumulada en stock</p>
          </div>
        </div>

      </div>

      {/* 3. CORE COLUMNS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (4 spans): INCOMING SHIPMENTS / PROVEEDOR ENTRY FORM */}
        <div className="lg:col-span-4 bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-4">
          <div className="border-b border-[#E5E0D8] pb-3">
            <h3 className="text-sm font-black font-serif text-[#2E2A25] flex items-center gap-1.5">
              <span>🚚 Entrada de Mercancías</span>
              <span className="text-[9px] bg-[#2E4A3F] text-white px-2 py-0.5 rounded-full font-mono">Formulario</span>
            </h3>
            <p className="text-3xs text-[#605850] mt-0.5 uppercase tracking-wider">Añade stock recién entregado por el transportista</p>
          </div>

          <form onSubmit={handleRegisterSupply} className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider">Ingrediente Recibido</label>
                <button
                  type="button"
                  onClick={() => setIsAddIngredientOpen(!isAddIngredientOpen)}
                  className="text-[9px] text-[#2E4A3F] font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus size={10} /> Nuevo tipo de ingrediente
                </button>
              </div>

              {isAddIngredientOpen ? (
                <div className="bg-stone-50 border border-stone-250 p-3 rounded-lg space-y-2 mt-1 animate-fadeIn">
                  <span className="block text-[9px] font-black uppercase text-stone-800">Crear Definición de Materia Prima</span>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Ej. Tomates Bola Frescos"
                      value={newIngName}
                      onChange={e => setNewIngName(e.target.value)}
                      className="w-full text-xs p-2 border border-stone-250 bg-white rounded text-stone-800"
                    />
                    <div className="grid grid-cols-2 gap-1 px-0.5">
                      <select
                        value={newIngUnit}
                        onChange={e => setNewIngUnit(e.target.value)}
                        className="text-3xs p-1 bg-white border border-stone-200 rounded text-stone-800"
                      >
                        <option value="kg">kg (kilogramos)</option>
                        <option value="gramos">gramos</option>
                        <option value="litros">litros</option>
                        <option value="piezas">piezas</option>
                        <option value="botellas">botellas</option>
                        <option value="cajas">cajas</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Mínimo"
                        title="Stock mínimo de reserva"
                        value={newIngMinStock}
                        onChange={e => setNewIngMinStock(Number(e.target.value))}
                        className="text-3xs p-1 bg-white border border-stone-200 rounded text-stone-800 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddIngredientOpen(false)}
                      className="px-2 py-0.5 text-3xs border border-stone-300 text-stone-600 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateIngredient}
                      className="px-2.5 py-0.5 text-3xs bg-[#2E4A3F] text-white font-bold rounded"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedIngId}
                  onChange={e => setSelectedIngId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#CAD9D0] rounded-lg bg-white text-[#2E2A25] focus:outline-none"
                  required
                >
                  <option value="">-- Elige qué ingrediente --</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.stock} {ing.unit} actuales)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Nombre del Proveedor Oficial</label>
              <input
                type="text"
                placeholder="Ej. Carnes de Sonora S.A. o Lala Local"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full text-xs p-2.5 border border-[#CAD9D0] bg-white rounded-lg text-[#2E2A25] placeholder-gray-400 focus:outline-[#2E4A3F]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Cantidad Entrada</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold p-2.5 border border-[#CAD9D0] bg-white rounded-lg text-[#2E2A25] focus:outline-none"
                    required
                  />
                  <span className="absolute right-2.5 top-2.5 text-4xs font-bold text-gray-500 uppercase bg-gray-100 px-1 py-0.5 rounded">
                    {ingredients.find(i => i.id === selectedIngId)?.unit || 'u'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Costo Total ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-gray-500">$</span>
                  <input
                    type="number"
                    value={cost}
                    onChange={e => setCost(Number(e.target.value))}
                    className="w-full text-xs pl-6 font-mono font-bold p-2.5 border border-[#CAD9D0] bg-white rounded-lg text-[#2E2A25] focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Fecha de Caducidad / Límite</label>
              <div className="relative">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-[#CAD9D0] bg-white rounded-lg text-[#2E2A25] focus:outline-none"
                  required
                />
              </div>
              <span className="text-[9px] text-[#AE593E] italic mt-1 block font-bold">
                ⚠️ Avisará automáticamente en cocina antes de vencer.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white rounded-xl text-xs font-extrabold transition shadow cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Registrar Entrada y Actualizar Stock
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN (8 spans): REALTIME WAREHOUSE ELEMENTS GRID & HISTORIAL LOGS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TAB 1: Existencias actualizadas con visualizador de alertas */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-3">
              <div>
                <h3 className="text-sm font-black font-serif text-[#2E2A25] flex items-center gap-1.5">
                  <Layers size={16} className="text-[#2E4A3F]" />
                  <span>Existencias de Ingredientes en Bodega</span>
                </h3>
                <p className="text-3xs text-[#605850] uppercase tracking-wide">Monitor de niveles de stock en estantes con reserva mínima</p>
              </div>

              {/* Search filter input */}
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-gray-400">
                  <Search size={13} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar ingrediente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="text-xs pl-7 pr-3 py-1.5 border border-[#E5E0D8] bg-[#FAF8F5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2E4A3F] text-slate-800"
                />
              </div>
            </div>

            {/* Ingredients table / bento cards list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredIngredients.map(ing => {
                const isUnderStock = ing.stock <= ing.minStock;
                return (
                  <div 
                    key={ing.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between space-y-3 transition group hover:shadow-xs ${
                      isUnderStock 
                        ? 'bg-[#FDF3EE] border-orange-250 text-orange-950 shadow-inner' 
                        : 'bg-white border-[#E5E0D8] text-[#2E2A25]'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-serif font-black pr-1 leading-tight">{ing.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(ing.id)}
                          className="text-[#CAD9D0] hover:text-[#AE593E] p-1 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Dar de baja ingrediente"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <span className="text-4xs font-mono text-gray-400 block tracking-normal">REF: {ing.id}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-3xs text-[#605850] font-bold">Nivel Actual:</span>
                        <div className="text-right">
                          <span className="text-sm font-mono font-black">{ing.stock}</span>
                          <span className="text-3xs text-gray-500 font-bold ml-1">{ing.unit}</span>
                        </div>
                      </div>

                      {/* Stock percentage bar */}
                      <div className="w-full bg-slate-100/80 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${isUnderStock ? 'bg-orange-500' : 'bg-[#2E4A3F]'}`}
                          style={{ width: `${Math.min(100, (ing.stock / (ing.minStock || 1)) * 50)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-dashed border-[#E5E0D8]/45">
                        <span>Reserva Mín:</span>
                        <span className="font-mono font-semibold">{ing.minStock} {ing.unit}</span>
                      </div>
                    </div>

                    {isUnderStock && (
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-orange-700 bg-orange-100 border border-orange-200 text-center py-0.5 rounded animate-pulse">
                        ⚠️ Alerta: Abastecer de Urgencia
                      </span>
                    )}
                  </div>
                );
              })}

              {filteredIngredients.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-gray-500 italic">
                  Ningún ingrediente coincide con la búsqueda.
                </div>
              )}
            </div>
          </div>

          {/* TAB 2: Historial logs of entries delivered by suppliers */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-3">
            <div className="border-b border-[#E5E0D8] pb-2.5">
              <h3 className="text-sm font-black font-serif text-[#2E2A25] flex items-center gap-1.5">
                <Truck size={16} className="text-[#2E4A3F]" />
                <span>Historial de Envíos del Almacén</span>
              </h3>
              <p className="text-3xs text-[#605850] uppercase tracking-wide">Póliza y registro en tiempo real de entradas validadas</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E0D8] text-3xs uppercase tracking-widest text-slate-500 font-bold">
                    <th className="py-2.5 font-bold">Fecha / ID</th>
                    <th className="py-2.5 font-bold">Materia Prima</th>
                    <th className="py-2.5 font-bold">Proveedor</th>
                    <th className="py-2.5 font-mono text-right font-bold">Cantidad</th>
                    <th className="py-2.5 font-mono text-right font-bold">Costo</th>
                    <th className="py-2.5 font-bold text-center">Caducidad</th>
                    <th className="py-2.5 text-center font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]/40">
                  {supplies.map(sup => (
                    <tr key={sup.id} className="hover:bg-[#FAF8F5] transition text-[11px]">
                      <td className="py-3">
                        <span className="block text-[#2E2A25] font-semibold">{sup.receivedDate}</span>
                        <span className="font-mono text-gray-400 text-[9px] uppercase">{sup.id}</span>
                      </td>
                      <td className="py-3 font-serif font-bold text-stone-900">{sup.ingredientName}</td>
                      <td className="py-3 text-gray-600 font-semibold">{sup.supplier}</td>
                      <td className="py-3 text-right font-mono font-black text-slate-800 text-xs">+{sup.quantity}</td>
                      <td className="py-3 text-right font-mono font-black text-emerald-800 text-xs">${sup.cost.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-red-50 border border-red-200 text-red-700">
                          📅 {sup.expiryDate}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSupply(sup.id)}
                          className="text-[#CAD9D0] hover:text-[#AE593E] p-1 rounded hover:bg-stone-100 cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {supplies.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center italic text-gray-500 text-xs">
                        No hay remisiones de mercancía cargadas en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
