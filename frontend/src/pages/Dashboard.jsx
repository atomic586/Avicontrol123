import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import {
  Egg, ShoppingCart, DollarSign, Users, TrendingUp,
  Calendar, PlusCircle, FileText, Activity, ChevronDown, ArrowUpRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

const DASHBOARD_QUERY = gql`
  query DashboardData {
    dashboard {
      totalClientes
      pedidosMes
      ingresosTotales
      productoMasVendido
      productoMasVendidoCantidad
    }
  }
`;

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
  const { data } = useQuery(DASHBOARD_QUERY, { fetchPolicy: "network-only" });
  const d = data?.dashboard;

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Jueves, 26 de Noviembre
          </p>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            ¡Buen día, {usuario?.nombres || "administrador"}!
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">
            Aquí tienes el estado general de tu negocio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] shadow-sm cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
            <Calendar className="w-4 h-4" /> Últimos 30 días <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* TARJETA DE INGRESOS (Café Oscuro) */}
      <div className="bg-[var(--bg-sidebar)] text-white rounded-2xl p-8 shadow-lg relative overflow-hidden mb-6">
        <div className="relative z-10">
          <p className="text-sm text-white/70 font-semibold mb-2 uppercase tracking-wide">Ingresos Totales del Mes</p>
          <h2 className="text-4xl font-black mb-4">
            Bs. {d ? Number(d.ingresosTotales).toLocaleString("es-BO", { minimumFractionDigits: 2 }) : "48.750,00"}
          </h2>
          
          <div className="flex items-center gap-2 text-sm text-green-400 font-bold mb-6">
            <ArrowUpRight className="w-4 h-4" />
            +18.4% <span className="text-white/60 font-normal">Respecto al mes anterior</span>
          </div>

          <div className="flex justify-between text-xs text-white/60 mb-2 font-medium">
            <span>Objetivo mensual: Bs 60.000</span>
            <span>81%</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-2.5">
            <div className="bg-[var(--accent)] h-2.5 rounded-full" style={{ width: '81%' }}></div>
          </div>
        </div>
      </div>

      {/* GRID DE MÉTRICAS (Tarjetas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg">
              <Egg className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">+8%</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">12.850</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Huevos producidos</p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg">
              <Users className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Activo</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{d?.totalClientes ?? 5200}</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Clientes registrados</p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg">
              <ShoppingCart className="w-5 h-5 text-[var(--accent)]" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{d?.pedidosMes ?? 184}</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Ventas realizadas</p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--bg-main)] rounded-lg">
              <FileText className="w-5 h-5 text-[var(--accent)]" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">86%</h3>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Disponibilidad de stock</p>
          </div>
        </div>

      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1 */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">Rendimiento de producción</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Producción de huevos - Últimos 7 días</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA_PRODUCCION} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="huevos" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2 */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">Distribución de ventas</h2>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Este mes</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-[var(--bg-main)] rounded-xl border border-dashed border-[var(--border-color)] text-[var(--text-secondary)]">
             Aquí irá tu gráfico circular de ventas
          </div>
        </div>
      </div>

    </div>
  );
}