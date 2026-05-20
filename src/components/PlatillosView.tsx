import React, { useState } from 'react';
import { 
  Search, Plus, Leaf, Clock, Trash2, Edit3, ToggleLeft, 
  ToggleRight, CheckCircle, HelpCircle, Utensils, X, DollarSign 
} from 'lucide-react';
import { MenuItem, MenuCategory } from '../types';

interface PlatillosViewProps {
  menu: MenuItem[];
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (id: string, updated: Partial<MenuItem>) => void;
  onDeleteMenuItem: (id: string) => void;
}

export default function PlatillosView({
  menu,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem
}: PlatillosViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create / Edit states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<MenuCategory>('plato_fuerte');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [available, setAvailable] = useState(true);

  const filteredItems = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !prepTime) return;

    const itemProps = {
      name: name.trim(),
      price: parseFloat(price),
      category,
      description: description.trim() || 'Sin descripción adicional.',
      prepTimeMinutes: parseInt(prepTime),
      available
    };

    if (isEditing) {
      onUpdateMenuItem(isEditing, itemProps);
      setIsEditing(null);
    } else {
      onAddMenuItem(itemProps);
    }

    // Reset Form
    setName('');
    setPrice('');
    setCategory('plato_fuerte');
    setDescription('');
    setPrepTime('');
    setAvailable(true);
    setIsFormOpen(false);
  };

  const handleEditClick = (item: MenuItem) => {
    setIsEditing(item.id);
    setName(item.name);
    setPrice(item.price.toString());
    setCategory(item.category);
    setDescription(item.description);
    setPrepTime(item.prepTimeMinutes.toString());
    setAvailable(item.available);
    setIsFormOpen(true);
  };

  const getCategoryTheme = (cat: MenuCategory) => {
    switch (cat) {
      case 'entrada':
        return { label: 'Entradas / Aperitivos', color: 'text-[#2E4A3F] bg-[#EBF2EE] border-[#CAD9D0]', icon: '🥗' };
      case 'plato_fuerte':
        return { label: 'Platos Fuertes', color: 'text-[#785C24] bg-[#FAF0DE] border-[#E8DCBF]', icon: '🍔' };
      case 'postre':
        return { label: 'Postres', color: 'text-[#AE593E] bg-[#FDF3EE] border-[#ECC8B8]', icon: '🍰' };
      case 'bebida':
        return { label: 'Bebidas', color: 'text-[#5A6E65] bg-[#FAF8F5] border-[#E5E0D8]', icon: '☕' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Search & Top Action Buttons */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search input with beautiful layout */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-[#605850]" size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar por platillo o ingrediente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 border border-[#E5E0D8] rounded-xl bg-[#FAF8F5] text-[#2E2A25] placeholder-[#7A7167] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F] focus:bg-white transition"
          />
        </div>

        {/* Action Add Button */}
        <button
          onClick={() => {
            setIsEditing(null);
            setName('');
            setPrice('');
            setCategory('plato_fuerte');
            setDescription('');
            setPrepTime('');
            setAvailable(true);
            setIsFormOpen(!isFormOpen);
          }}
          id="btn-agregar-platillo-toggle"
          className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#2E4A3F] rounded-xl hover:bg-[#1E2F25] transition cursor-pointer"
        >
          {isFormOpen ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {isEditing ? 'Cancelar Edición' : 'Nuevo Platillo'}
        </button>
      </div>

      {/* Accordion / Foldout Add Platillo Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2E4A3F]/30 animate-fadeIn">
          <h3 className="text-base font-bold text-[#2E2A25] mb-4 flex items-center font-serif">
            <Utensils className="text-[#2E4A3F] mr-2" size={18} />
            {isEditing ? 'Editar Platillo Existente' : 'Registrar Nuevo Platillo en el Menú'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Nombre del Platillo</label>
                <input
                  type="text"
                  placeholder="P. ej. Filete Mignon con Salsa de Champiñones"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Precio (MXN)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-[#605850] font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full text-xs pl-6 border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as MenuCategory)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                >
                  <option value="entrada">🥗 Entrada</option>
                  <option value="plato_fuerte">🍔 Plato Fuerte</option>
                  <option value="postre">🍰 Postre</option>
                  <option value="bebida">☕ Bebida</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Descripción corta o Ingredientes</label>
                <input
                  type="text"
                  placeholder="P. ej. Preparado con salsa demi-glace, acompañado de papas cambray."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F]"
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-[#605850] uppercase tracking-wider mb-1">Tiempo de Prep. (Minutos)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="15"
                    value={prepTime}
                    onChange={e => setPrepTime(e.target.value)}
                    className="w-full text-xs pr-10 border border-[#E5E0D8] rounded-lg p-2.5 bg-white text-[#2E2A25] focus:outline-none focus:ring-1 focus:ring-[#2E4A3F] font-mono"
                    required
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-[#605850] font-medium">min</span>
                </div>
              </div>

              <div className="flex items-center pt-5">
                <input
                  type="checkbox"
                  id="chk-availability"
                  checked={available}
                  onChange={e => setAvailable(e.target.checked)}
                  className="w-4 h-4 text-[#2E4A3F] border-[#E5E0D8] rounded focus:ring-[#2E4A3F] cursor-pointer"
                />
                <label htmlFor="chk-availability" className="ml-2 block text-xs font-bold text-[#605850] cursor-pointer">
                  Disponible Inmediatamente
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-xs font-bold text-[#605850] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Cerrar panel
              </button>
              <button
                type="submit"
                id="btn-guardar-platillo"
                className="px-4 py-2 bg-[#2E4A3F] hover:bg-[#1E2F25] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {isEditing ? 'Guardar Cambios' : 'Registrar Platillo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Switch tab bar */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Todos los Platillos', emoji: '🍽️' },
          { id: 'entrada', label: 'Entradas', emoji: '🥗' },
          { id: 'plato_fuerte', label: 'Platos Fuertes', emoji: '🍔' },
          { id: 'postre', label: 'Postres', emoji: '🍰' },
          { id: 'bebida', label: 'Bebidas', emoji: '☕' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-[#2E4A3F] text-white border-[#2E4A3F] shadow-sm'
                : 'bg-white text-[#605850] border-[#E5E0D8] hover:bg-[#FAF8F5]'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span className="text-3xs px-1.5 py-0.2 rounded-full bg-[#EFECE6] text-[#605850] border border-[#E5E0D8]">
              {cat.id === 'all' ? menu.length : menu.filter(item => item.category === cat.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Catalog layout - Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const catInfo = getCategoryTheme(item.category);

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-xl border p-4 flex flex-col justify-between hover:shadow-md transition-all duration-150 ${
                item.available ? 'border-[#E5E0D8]' : 'border-[#E5E0D8] opacity-60 bg-[#FAF8F5]/50'
              }`}
            >
              <div>
                {/* Visual Label Theme and Toggle Availability */}
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold border ${catInfo?.color}`}>
                    {catInfo?.icon} {catInfo?.label}
                  </span>
                  
                  <button
                    onClick={() => onUpdateMenuItem(item.id, { available: !item.available })}
                    className="text-[#605850] hover:text-[#2E4A3F] flex items-center gap-1 cursor-pointer"
                    title={item.available ? 'Marcar agotado' : 'Marcar disponible'}
                    id={`btn-availability-toggle-${item.id}`}
                  >
                    {item.available ? (
                      <span className="inline-flex items-center gap-1 text-3xs font-semibold text-[#2E4A3F] bg-[#E5ECE9] px-1.5 py-0.5 rounded border border-[#CAD9D0]">
                        <CheckCircle size={10} /> En inventario
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-3xs font-semibold text-[#605850] bg-[#EFECE6] px-1.5 py-0.5 rounded border border-[#E5E0D8]">
                        Agotado
                      </span>
                    )}
                  </button>
                </div>

                <div className="mb-2">
                  <h4 className="text-sm font-extrabold text-[#2E2A25] pr-4 truncate font-serif">{item.name}</h4>
                  <p className="text-3xs text-[#605850] mt-1 line-clamp-2 min-h-[34px] leading-relaxed">{item.description}</p>
                </div>
              </div>

              {/* Bottom detail action line */}
              <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-3xs uppercase font-extrabold text-[#605850] block tracking-wide">Precio</span>
                    <span className="text-sm font-black text-[#2E2A25] font-mono">${item.price} MXN</span>
                  </div>
                  <div className="border-l border-[#E5E0D8] pl-3">
                    <span className="text-3xs uppercase font-extrabold text-[#605850] block tracking-wide">Tiempo</span>
                    <span className="text-3xs font-semibold text-[#605850] flex items-center gap-0.5 font-mono">
                      <Clock size={10} /> {item.prepTimeMinutes} min
                    </span>
                  </div>
                </div>

                {/* Edit & Delete actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-1.5 rounded-lg border border-[#E5E0D8] text-[#605850] bg-white hover:bg-[#FAF8F5] hover:text-[#2E4A3F] cursor-pointer"
                    title="Editar Platillo"
                    id={`btn-edit-platillo-${item.id}`}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar "${item.name}" del menú?`)) {
                        onDeleteMenuItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-[#ECC8B8] text-[#AE593E] bg-white hover:bg-[#FDF3EE] cursor-pointer"
                    title="Eliminar Platillo"
                    id={`btn-delete-platillo-${item.id}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-[#FAF8F5] rounded-2xl border-2 border-dashed border-[#CAD9D0] text-[#605850]">
            <Utensils size={40} className="text-[#CAD9D0] mb-2" />
            <h3 className="text-sm font-bold text-[#2E2A25] font-serif">No se encontraron platillos</h3>
            <p className="text-xs text-[#605850] mt-1 leading-relaxed">Intenta ajustando los filtros o añade un nuevo platillo con el botón de arriba.</p>
          </div>
        )}
      </div>

    </div>
  );
}
