import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import {
  Egg, ShoppingCart, DollarSign, Users, TrendingUp, TrendingDown,
  Calendar, PlusCircle, FileText, ArrowRight, Activity, Home, CheckCircle2, ChevronDown, Bell
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

// Query para el dashboard (mantenemos tu query actual)
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
    }
  }
`;

// Datos simulados para los gráficos (luego los conectamos a la BD real)
const DATA_PRODUCCION = [
  { name: "Lun", huevos: 45000 },
  { name: "Mar", huevos: 52000 },
  { name: "Mié", huevos: 48000 },
  { name: "Jue", huevos: 61000 },
  { name: "Vie", huevos: 75000 },
  { name: "Sáb", huevos: 68000 },
  { name: "Dom", huevos: 72000 },
];

const DATA_VENTAS = [
  { name: "Sem 1", huevos: 3500, abono: 1200 },
  { name: "Sem 2", huevos: 4200, abono: 1500 },
  { name: "Sem 3", huevos: 3800, abono: 1100 },
  { name: "Sem 4", huevos: 5100, abono: 1800 },
];

export default function Dashboard() {
  const { usuario } = useAuth();
  const { data } = useQuery(DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });

  const d = data?.dashboard;

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark tracking-tight">
            ¡Hola, {usuario?.nombres || "Admin"}! 👋
          </h1>
          <p className="text-gray-500 font-medium mt-1">Aquí está el resumen de tu granja hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50">
            <Calendar className="w-4 h-4" /> Últimos 30 días <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* TARJETAS KPI (Igual que en el detalle de granja) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos Totales</p>
            <p className="text-2xl font-black text-green-600">
              Bs. {d ? Number(d.ingresosTotales).toLocaleString("es-BO", { minimumFractionDigits: 2 }) : "0,00"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pedidos */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pedidos del Mes</p>
            <p className="text-2xl font-black text-brand-600">{d?.pedidosMes ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Clientes */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Clientes</p>
            <p className="text-2xl font-black text-dark">{d?.totalClientes ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Producto Top */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Más Vendido</p>
            <p className="text-sm font-black text-dark leading-tight">{d?.productoMasVendido || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{d?.productoMasVendidoCantidad || 0} unid.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Producción de Huevos */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-dark">Producción de Huevos</h2>
              <p className="text-sm text-gray-500 font-medium">Esta semana</p>
            </div>
            <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
               <TrendingUp className="w-3 h-3" /> 88.955 Huevos
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA_PRODUCCION} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(v) => `${v / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value.toLocaleString()} huevos`, 'Producción']}
                />
                <Line type="monotone" dataKey="huevos" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Ventas vs Abono */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-dark">Ingresos y Ventas</h2>
              <p className="text-sm text-gray-500 font-medium">Este mes</p>
            </div>
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
               <TrendingUp className="w-3 h-3" /> Bs. 6.245,00
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA_VENTAS} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                <Bar dataKey="huevos" name="Ventas Huevos" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="abono" name="Ventas Abono" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE Y ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actividad Reciente (Simulada visualmente) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-dark flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-500" /> Actividad Reciente
            </h2>
            <button className="text-sm font-bold text-brand-600 hover:text-brand-800">Ver todas →</button>
          </div>
          <div className="space-y-1">
             <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><ShoppingCart className="w-4 h-4"/></div>
                  <div>
                    <p className="font-bold text-sm text-dark">Venta de huevos</p>
                    <p className="text-xs text-gray-500">Bs. 420,00</p>
                  </div>
               </div>
               <div className="text-right">
                 <p className="text-xs font-bold text-gray-700">Hoy, 16:30</p>
                 <p className="text-xs text-gray-500">Alex R.</p>
               </div>
             </div>
             
             <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Egg className="w-4 h-4"/></div>
                  <div>
                    <p className="font-bold text-sm text-dark">Registro de producción</p>
                    <p className="text-xs text-gray-500">88.955 huevos</p>
                  </div>
               </div>
               <div className="text-right">
                 <p className="text-xs font-bold text-gray-700">Hoy, 15:20</p>
                 <p className="text-xs text-gray-500">Enc. Producción</p>
               </div>
             </div>

             <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><FileText className="w-4 h-4"/></div>
                  <div>
                    <p className="font-bold text-sm text-dark">Venta de abono</p>
                    <p className="text-xs text-gray-500">Bs. 250,00</p>
                  </div>
               </div>
               <div className="text-right">
                 <p className="text-xs font-bold text-gray-700">Hoy, 14:10</p>
                 <p className="text-xs text-gray-500">Enc. Ventas</p>
               </div>
             </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <h2 className="text-lg font-black text-dark mb-4 flex items-center gap-2">
             <PlusCircle className="w-5 h-5 text-brand-500" /> Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 gap-3">
             <Link to="/ventas" className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition-colors border border-orange-100 group">
               <ShoppingCart className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
               <span className="text-xs font-bold text-orange-800 text-center">Registrar Venta</span>
             </Link>
             <Link to="/produccion" className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors border border-blue-100 group">
               <Egg className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
               <span className="text-xs font-bold text-blue-800 text-center">Reg. Producción</span>
             </Link>
             <Link to="/abono" className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-colors border border-green-100 group">
               <DollarSign className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
               <span className="text-xs font-bold text-green-800 text-center">Venta de Abono</span>
             </Link>
             <Link to="/reportes" className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors border border-purple-100 group">
               <FileText className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
               <span className="text-xs font-bold text-purple-800 text-center">Ver Reportes</span>
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
