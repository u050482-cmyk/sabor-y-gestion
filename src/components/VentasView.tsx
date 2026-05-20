import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, ShoppingBag, CreditCard, Calendar, BarChart3, 
  Search, RefreshCw, FileSpreadsheet, HeartHandshake, UserCheck, X, FileText 
} from 'lucide-react';
import { Sale } from '../types';

interface VentasViewProps {
  sales: Sale[];
  onClearHistory: () => void;
}

export default function VentasView({
  sales,
  onClearHistory
}: VentasViewProps) {
  const [filterDate, setFilterDate] = useState<string>('all');
  const [searchClient, setSearchClient] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // 1. Math formulas for business insights
  const totalSalesCount = sales.length;
  const totalEarnings = sales.reduce((acc, sale) => acc + sale.total, 0);
  
  const cashSalesTotal = sales
    .filter(s => s.paymentMethod === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const cardSalesTotal = sales
    .filter(s => s.paymentMethod === 'tarjeta')
    .reduce((acc, s) => acc + s.total, 0);

  const averageTicket = totalSalesCount > 0 ? (totalEarnings / totalSalesCount) : 0;

  // Let's calculate waiter performance for the horizontal flex bar chart leaderboard
  const waiterSales: { [waiterName: string]: number } = {};
  sales.forEach(s => {
    waiterSales[s.waiterName] = (waiterSales[s.waiterName] || 0) + s.total;
  });

  const waiterLeaderboard = Object.entries(waiterSales)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const maxWaiterSales = waiterLeaderboard.length > 0 ? Math.max(...waiterLeaderboard.map(w => w.amount)) : 1;

  // Let's filter sales list
  const filteredSales = sales.filter(sale => {
    const matchesClient = sale.clientName.toLowerCase().includes(searchClient.toLowerCase()) || 
                          sale.waiterName.toLowerCase().includes(searchClient.toLowerCase()) ||
                          sale.id.toLowerCase().includes(searchClient.toLowerCase());
    return matchesClient;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Metrics Row Grid counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#2E4A3F] uppercase tracking-wider">Ventas Brutas Acumuladas</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono mt-0.5">${totalEarnings.toLocaleString()} <span className="text-xs text-[#605850]">MXN</span></h3>
            <p className="text-3xs text-[#605850] mt-0.5">Corte de caja en tiempo real</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E5ECE9] text-[#2E4A3F] flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#785C24] uppercase tracking-wider">Recaudado en Efectivo</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono mt-0.5">${cashSalesTotal.toLocaleString()} <span className="text-xs text-[#605850]">MXN</span></h3>
            <p className="text-3xs text-[#605850] mt-0.5">Contrapeso de caja física</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF0DE] text-[#785C24] flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#AE593E] uppercase tracking-wider">Recaudado en Tarjeta</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono mt-0.5">${cardSalesTotal.toLocaleString()} <span className="text-xs text-[#605850]">MXN</span></h3>
            <p className="text-3xs text-[#605850] mt-0.5">Banco / Terminales POS</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FDF3EE] text-[#AE593E] flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <span className="text-3xs font-extrabold text-[#5A6E65] uppercase tracking-wider">Ticket Promedio por Mesa</span>
            <h3 className="text-2xl font-black text-[#2E2A25] font-mono mt-0.5">${averageTicket.toFixed(1)} <span className="text-xs text-[#605850]">MXN</span></h3>
            <p className="text-3xs text-[#605850] mt-0.5">Gastos promedio por cliente</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#5A6E65] border border-[#E5E0D8] flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

      </div>

      {/* Visual Charts Layout (Analytics Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard of Waiters */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-[#2E2A25] flex items-center gap-1.5 font-serif">
                <BarChart3 className="text-[#2E4A3F]" size={18} /> Rendimiento de Meseros
              </h3>
              <p className="text-xs text-[#605850]">Ventas totales acumuladas por cada mesero del restaurante.</p>
            </div>
            <span className="text-3xs font-bold bg-[#E5ECE9] border border-[#CAD9D0] px-2.5 py-1 rounded text-[#2E4A3F]">
              Ranking de Mesas
            </span>
          </div>

          <div className="space-y-4">
            {waiterLeaderboard.map((waiter, idx) => {
              const pct = (waiter.amount / maxWaiterSales) * 100;

              return (
                <div key={waiter.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#2E2A25] flex items-center gap-1">
                      <span className="w-4 h-4 text-center rounded-full bg-[#E5ECE9] text-[#2E4A3F] text-3xs font-semibold inline-block">{idx + 1}</span>
                      {waiter.name}
                    </span>
                    <span className="font-bold text-[#2E2A25] font-mono">${waiter.amount.toLocaleString()} MXN</span>
                  </div>
                  
                  {/* CSS Flex Bar */}
                  <div className="w-full bg-[#EFECE6] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#2E4A3F] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {waiterLeaderboard.length === 0 && (
              <p className="text-xs italic text-[#605850] py-10 text-center leading-relaxed">Sin datos de ventas disponibles para tabular.</p>
            )}
          </div>
        </div>

        {/* Payment Split & Sales Info summary widget */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E5E0D8] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#2E2A25] mb-1 flex items-center gap-1.5 font-serif">
              <CreditCard className="text-[#2E4A3F]" size={18} /> Balance de Caja
            </h3>
            <p className="text-xs text-[#605850] mb-4">Relación de formas de pago aceptadas en el día.</p>
            
            <div className="space-y-4">
              {/* Cash vs Card Gauge Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-3xs font-extrabold text-[#605850]">
                  <span>EFECTIVO ({totalEarnings > 0 ? ((cashSalesTotal / totalEarnings) * 100).toFixed(0) : '0'}%)</span>
                  <span>TARJETA ({totalEarnings > 0 ? ((cardSalesTotal / totalEarnings) * 100).toFixed(0) : '0'}%)</span>
                </div>
                <div className="w-full bg-[#AE593E] h-3.5 rounded-lg overflow-hidden flex font-mono text-[9px] font-black text-white">
                  <div 
                    className="bg-[#2E4A3F] h-full flex items-center justify-center transition-all duration-300"
                    style={{ width: `${totalEarnings > 0 ? (cashSalesTotal / totalEarnings) * 100 : 50}%` }}
                  >
                  </div>
                  <div 
                    className="bg-[#AE593E] h-full flex items-center justify-center transition-all duration-300"
                    style={{ width: `${totalEarnings > 0 ? (cardSalesTotal / totalEarnings) * 100 : 50}%` }}
                  >
                  </div>
                </div>
              </div>

              {/* Cash and Card detailed row items */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3 border border-[#CAD9D0] bg-[#EBF2EE] rounded-xl text-[#2E4A3F]">
                  <span className="block text-[10px] text-[#2E4A3F] font-bold uppercase">Efectivo total</span>
                  <span className="font-mono font-bold text-sm block mt-0.5">${cashSalesTotal}</span>
                </div>
                <div className="p-3 border border-[#ECC8B8] bg-[#FDF3EE] rounded-xl text-[#AE593E]">
                  <span className="block text-[10px] text-[#AE593E] font-bold uppercase">Tarjetas total</span>
                  <span className="font-mono font-bold text-sm block mt-0.5">${cardSalesTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E0D8] mt-4">
            <button
              onClick={() => {
                if (confirm('⚠️ ATENCIÓN: ¿Estás seguro de vaciar el historial de ventas? Esto reseteará la caja registradora a cero.')) {
                  onClearHistory();
                }
              }}
              id="btn-recolocar-caja"
              className="w-full py-2 hover:bg-[#FDF3EE] text-[#AE593E] border border-[#ECC8B8] hover:border-[#AE593E] rounded-lg text-3xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              🔄 Inicializar Caja (Cero Ventas)
            </button>
          </div>

        </div>

      </div>

      {/* 2. TABULAR SALES LIST LOG */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E0D8] overflow-hidden">
        
        {/* Table Toolbar controls */}
        <div className="p-5 border-b border-[#E5E0D8] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#2E2A25] font-serif">Libro Diario de Transacciones</h3>
            <p className="text-xs text-[#605850]">Historial pormenorizado de cobros hechos en caja por comensal.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="text-[#605850]" size={14} />
            </span>
            <input
              type="text"
              placeholder="Filtrar por Cliente, ID o Mesero..."
              value={searchClient}
              onChange={e => setSearchClient(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2 border border-[#E5E0D8] rounded-xl bg-[#FAF8F5] text-[#2E2A25] placeholder-[#7A7167] focus:outline-none"
            />
          </div>
        </div>

        {/* Database Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] text-3xs text-[#605850] uppercase font-black tracking-wider border-b border-[#E5E0D8]">
                <th className="py-3 px-5">ID Ticket</th>
                <th className="py-3 px-5">Cliente</th>
                <th className="py-3 px-5">Mesa</th>
                <th className="py-3 px-5">Mesero Asignado</th>
                <th className="py-3 px-5">Fecha y Hora</th>
                <th className="py-3 px-5">Método Cobro</th>
                <th className="py-3 px-5 text-right">Monto Facturado</th>
                <th className="py-3 px-5 text-center">Acción</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#E5E0D8] text-xs text-[#2E2A25]">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-3 px-5 font-mono text-3xs font-bold text-[#2E4A3F]">{sale.id}</td>
                  <td className="py-3 px-5 font-bold text-[#2E2A25]">{sale.clientName}</td>
                  <td className="py-3 px-5">Mesa {sale.tableNumber}</td>
                  <td className="py-3 px-5 font-medium">{sale.waiterName}</td>
                  <td className="py-3 px-5 text-[#605850] font-mono text-3xs">
                    {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-5">
                    {sale.paymentMethod === 'efectivo' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-3xs bg-[#E5ECE9] text-[#2E4A3F] font-bold border border-[#CAD9D0]">💵 Efectivo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-3xs bg-[#FDF3EE] text-[#AE593E] font-bold border border-[#ECC8B8]">💳 Tarjeta</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right font-bold text-[#2E2A25] font-mono text-sm">${sale.total.toLocaleString()} MXN</td>
                  <td className="py-3 px-5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-3xs font-black uppercase rounded-lg border border-[#CAD9D0] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#2E4A3F] cursor-pointer transition"
                    >
                      <FileText size={10} /> Recibo
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#605850] italic leading-relaxed">
                    Sin registros de cobro coincidentes con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* POPUP DETAIL OF PAST SALES: THERMAL RECEIPT PREPRINT */}
      {selectedSale && (
        <div className="fixed inset-0 bg-[#121B15]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E0D8] max-w-sm w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E0D8] shrink-0">
              <h3 className="text-sm font-bold text-[#2E2A25] font-serif uppercase tracking-widest flex items-center gap-1">
                🧾 Comprobante Reimpreso
              </h3>
              <button 
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-[#EFECE6] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated thermal receipt paper texture container */}
            <div className="bg-[#FAF8F5] border border-dashed border-[#CAD9D0] rounded-lg p-5 font-mono text-[#33302C] text-xs space-y-3 shrink-0">
              <div className="text-center space-y-1 border-b border-[#E5E0D8] pb-2">
                <span className="text-xs font-black tracking-widest text-[#2E4A3F] uppercase">SABOR & GESTIÓN</span>
                <span className="block text-[8px] text-gray-400 font-bold leading-none">RESTAURANTE Y BRASA S.A.</span>
                <span className="block text-[8px] text-[#605850] leading-tight">
                  Av. Alfonso Reyes 204, México DF<br/>
                  RFC: SGE-260520-DF8 • TEL: 55-REST-SABOR
                </span>
              </div>

              {/* Receipt metadata logs */}
              <div className="text-[9px] text-gray-600 space-y-0.5 leading-normal">
                <div className="flex justify-between">
                  <span>TICKET ORIGINAL:</span>
                  <span className="font-bold">{selectedSale.id} (PAGADO)</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA EMISIÓN:</span>
                  <span className="font-bold">
                    {new Date(selectedSale.date).toLocaleDateString()} {new Date(selectedSale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MESA COBRADA:</span>
                  <span className="font-bold">Mesa {selectedSale.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>MESERO DE TURNO:</span>
                  <span className="font-bold">{selectedSale.waiterName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE FACTURA:</span>
                  <span className="font-bold uppercase">{selectedSale.clientName}</span>
                </div>
              </div>

              {/* Items detail loop */}
              <div className="border-t border-b border-dashed border-[#CAD9D0] py-2 space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-gray-500">
                  <span>CANT x PLATILLO</span>
                  <span>TOTAL</span>
                </div>
                
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((it, idx) => (
                    <div key={`itm-p-${idx}`} className="flex justify-between text-[10px] leading-tight text-[#2E2A25]">
                      <span>{it.quantity}x <span className="font-sans text-[10px] font-medium">{it.name}</span></span>
                      <span className="font-bold">${it.price * it.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-[10px] leading-tight italic text-gray-500">
                    <span>{selectedSale.itemsCount} platillo(s) consumidos</span>
                    <span className="font-bold">${selectedSale.subtotal || selectedSale.total}</span>
                  </div>
                )}
              </div>

              {/* Calculations summaries */}
              <div className="text-[10px] space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>SUBTOTAL:</span>
                  <span>${selectedSale.subtotal || (selectedSale.total * 0.9).toFixed(0)} MXN</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>PROPINA REGISTRADA:</span>
                  <span>${selectedSale.tipAmount || (selectedSale.total * 0.1).toFixed(0)} MXN</span>
                </div>
                <div className="flex justify-between text-sm text-[#2E2A25] font-extrabold border-t border-[#EFECE6] pt-1.5 font-serif">
                  <span>TOTAL COBRADO:</span>
                  <span>${selectedSale.total} MXN</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-[#EFECE6]/45 p-2 rounded text-[9px] text-gray-600 space-y-0.5 leading-normal">
                <div className="flex justify-between">
                  <span>MÉTODO COBRO:</span>
                  <span className="font-bold">{selectedSale.paymentMethod.toUpperCase()}</span>
                </div>
                {selectedSale.paymentMethod === 'efectivo' ? (
                  <>
                    <div className="flex justify-between">
                      <span>RECIBIDO EN CAJA:</span>
                      <span>${selectedSale.receivedAmount || selectedSale.total} MXN</span>
                    </div>
                    <div className="flex justify-between text-indigo-700 font-bold font-sans text-3xs">
                      <span>CAMBIO RETORNADO:</span>
                      <span>${selectedSale.changeAmount || 0} MXN</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>EMULACIÓN TERMINAL:</span>
                      <span>PAGO APROBADO</span>
                    </div>
                    <div className="flex justify-between text-3xs">
                      <span>ID AUTORIZACIÓN:</span>
                      <span>Card-Auth-Online</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-[8px] text-gray-400 font-sans font-medium pt-2 border-t border-gray-100">
                <p className="font-bold font-serif text-gray-600">¡GRACIAS POR SU PREFERENCIA!</p>
                <p>sabor-y-gestion.mex/factura</p>
              </div>
            </div>

            {/* Print and Close buttons */}
            <div className="space-y-2 pt-2 text-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  alert("🖨️ ¡Cargando pre-asistente de impresión de ticket térmico!");
                }}
                className="w-full py-2 border border-[#CAD9D0] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#2E4A3F] rounded-lg text-3xs font-black uppercase tracking-wider cursor-pointer"
              >
                🖨️ Imprimir Copia de Comprobante
              </button>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="w-full py-2 bg-[#2E4A3F] text-white hover:bg-[#1E2F25] rounded-lg text-xs font-bold cursor-pointer transition"
              >
                Cerrar consulta de ticket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
