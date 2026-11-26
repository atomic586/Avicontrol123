import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import {
  Egg, ShoppingCart, DollarSign, Users, TrendingUp,
  Calendar, ChevronDown, ArrowUpRight, AlertTriangle, Clock,
  Package, BarChart3, Activity, PlusCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

// 1. QUERY COMPLETA
const DASHBOARD_QUERY = gql`
  query DashboardData {
    dashboard {
      totalClientes
      pedidosHoy
      pedidosSemana
      pedidosMes
      ingresosTotales
      productoMasVendido
      productoMasVendidoCantidad
      abonoGeneradoMesKg
      abonoVendidoMesKg
      insumosStockBajo { id nombre stock stockMinimo tipo }
      insumosPorVencer { id nombre stock fechaVencimiento tipo }
    }
  }
`;

// Datos de ejemplo para el gráfico (luego los conectas a tu query real)
const DATA_PRODUCCION = [
  { name: "Lun", huevos: 45000 },
  { name: "Mar", huevos: 52000 },
  { name: "Mié", huevos: 48000 },
  { name: "Jue", huevos: 61000 },
  { name: "Vie", huevos: 75000 },
  { name: "Sáb", huevos: 68000 },
  { name: "Dom", huevos: 72000 },
];

export default function Dashboard() {
  const { usuario } = useAuth();
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, { fetchPolicy: "network-only" });
  
  const d = data?.dashboard;

  const formatMoney = (val) => {
    if (!val) return "0,00";
    return Number(val).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-2xl">
      <p className="font-bold">Error al cargar datos</p>
      <p className="text-sm">{error.message}</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER MODERNO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            ¡Hola, {usuario?.nombres || "Administrador"}! 👋
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[var(--bg-secondary)] transition-colors shadow-sm">
            <Calendar className="w-4 h-4" /> Este mes <ChevronDown className="w-4 h-4" />
          </button>
          <Link to="/ventas" className="flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-text)] px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm">
            <PlusCircle className="w-4 h-4" /> Nueva Venta
          </Link>
        </div>
      </div>

      {/* TARJETA DE INGRESOS (Estilo Premium) */}
      <div className="bg-[var(--bg-sidebar)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Ingresos Totales del Mes</p>
            </div>
            <h2 className="text-5xl font-black text-white mb-2">
              Bs. {formatMoney(d?.ingresosTotales)}
            </h2>
            <div className="flex items-center gap-2 text-sm text-green-400 font-bold">
              <ArrowUpRight className="w-4 h-4" />
              +{d?.pedidosMes || 0} Pedidos <span className="text-white/60 font-normal">este mes</span>
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs text-white/60 mb-2 font-medium">
              <span>Objetivo: Bs 60.000</span>
              <span>{Math.min(100, Math.round(((d?.ingresosTotales || 0) / 60000) * 100))}%</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-3">
              <div 
                className="bg-[var(--accent)] h-3 rounded-full transition-all duration-1000 shadow-lg" 
                style={{ width: `${Math.min(100, ((d?.ingresosTotales || 0) / 60000) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE MÉTRICAS (Estilo Tarjetas Modernas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Clientes */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">Activo</span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-bold mb-1">Clientes Registrados</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">{d?.totalClientes || 0}</h3>
          </div>
        </div>

        {/* Card 2: Pedidos del Mes */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-bold mb-1">Pedidos este Mes</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">{d?.pedidosMes || 0}</h3>
          </div>
        </div>

        {/* Card 3: Producto Más Vendido */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[var(--accent)]/10 rounded-2xl text-[var(--accent)] group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-bold mb-1">Más Vendido</p>
            <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight truncate">{d?.productoMasVendido || "—"}</h3>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-1">{d?.productoMasVendidoCantidad || 0} unidades</p>
          </div>
        </div>

        {/* Card 4: Balance Abono */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] font-bold mb-1">Abono Generado (Mes)</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">{d?.abonoGeneradoMesKg || 0} <span className="text-lg font-medium">kg</span></h3>
          </div>
        </div>

      </div>

      {/* ALERTAS (Estilo Notificación) */}
      {(d?.insumosStockBajo?.length > 0 || d?.insumosPorVencer?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d?.insumosStockBajo?.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-[var(--text-primary)] mb-1">Alerta de Stock Bajo</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Tienes {d.insumosStockBajo.length} insumos por debajo del mínimo.</p>
                <Link to="/insumos" className="text-xs font-bold text-amber-600 hover:text-amber-700 underline">Ver Insumos</Link>
              </div>
            </div>
          )}

          {d?.insumosPorVencer?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-500 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-[var(--text-primary)] mb-1">Insumos Próximos a Vencer</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Tienes {d.insumosPorVencer.length} insumos que vencen pronto.</p>
                <Link to="/insumos" className="text-xs font-bold text-red-600 hover:text-red-700 underline">Ver Insumos</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRÁFICOS MODERNOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Producción (2 Columnas) */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">Rendimiento de Producción</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Huevos recolectados - Últimos 7 días</p>
            </div>
            <div className="p-2 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA_PRODUCCION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHuevos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="huevos" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorHuevos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tarjeta de Balance Abono (1 Columna) */}
        <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-color)] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">Balance de Abono</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Generado vs Vendido</p>
            </div>
            <div className="p-2 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-[var(--text-secondary)]">Generado</span>
                <span className="text-[var(--text-primary)]">{d?.abonoGeneradoMesKg || 0} kg</span>
              </div>
              <div className="w-full bg-[var(--bg-main)] rounded-full h-3">
                <div className="bg-[var(--accent)] h-3 rounded-full shadow-sm" style={{ width: `${Math.min(100, ((d?.abonoGeneradoMesKg || 0) / 2000) * 100)}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-[var(--text-secondary)]">Vendido</span>
                <span className="text-[var(--text-primary)]">{d?.abonoVendidoMesKg || 0} kg</span>
              </div>
              <div className="w-full bg-[var(--bg-main)] rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full shadow-sm" style={{ width: `${Math.min(100, ((d?.abonoVendidoMesKg || 0) / 2000) * 100)}%` }}></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[var(--text-secondary)]">Stock Restante</span>
                <span className="text-xl font-black text-[var(--text-primary)]">
                  {Math.max(0, (d?.abonoGeneradoMesKg || 0) - (d?.abonoVendidoMesKg || 0))} kg
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}