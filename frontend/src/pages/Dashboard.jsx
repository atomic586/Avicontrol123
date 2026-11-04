<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_METRICAS = gql`
  query GetMetricas {
    clientes { id }
    pedidos { id fechaPedido estado }
    ventas { id montoTotal }
    insumos { id nombre stock stockMinimo }
  }
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');

  // Consultamos todos los datos de una sola vez
  const { data, loading, error } = useQuery(GET_METRICAS, { fetchPolicy: 'network-only' });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  // Cálculos de Métricas
  const totalClientes = data?.clientes?.length || 0;
  const totalPedidos = data?.pedidos?.length || 0;
  
  // Ingresos totales
  const ingresosTotales = data?.ventas?.reduce((sum, v) => sum + parseFloat(v.montoTotal), 0).toFixed(2) || 0;

  // Pedidos pendientes
  const pedidosPendientes = data?.pedidos?.filter(p => p.estado === 'pendiente').length || 0;

  // Insumos con stock bajo (alerta)
  const insumosBajos = data?.insumos?.filter(i => i.stock <= i.stockMinimo) || [];

  return (
    <div className="min-h-screen bg-avi-light">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center overflow-x-auto">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-avi-yellow whitespace-nowrap">🥚 AVICONTROL</h1>
              <button className="text-sm text-avi-yellow font-bold whitespace-nowrap">Dashboard</button>
              <button onClick={() => navigate('/clientes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Clientes</button>
              <button onClick={() => navigate('/lotes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Lotes</button>
              <button onClick={() => navigate('/insumos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Insumos</button>
              <button onClick={() => navigate('/produccion')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Producción</button>
              <button onClick={() => navigate('/pedidos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Pedidos</button>
              <button onClick={() => navigate('/ventas')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Ventas</button>
            </div>
            <div className="flex items-center space-x-4 whitespace-nowrap pl-4">
              <span className="text-sm text-gray-600">{user.username} ({user.rol})</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Gestión Avícola</h2>
        
        {loading && <p className="text-gray-500">Cargando métricas...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && (
          <>
            {/* TARJETAS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* Clientes */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Clientes Registrados</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalClientes}</p>
                </div>
                <span className="text-3xl mt-4">👥</span>
              </div>

              {/* Pedidos */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Pedidos Pendientes</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{pedidosPendientes}</p>
                </div>
                <span className="text-3xl mt-4">📦</span>
              </div>

              {/* Ingresos */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Ingresos por Ventas</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">${ingresosTotales}</p>
                </div>
                <span className="text-3xl mt-4">💰</span>
              </div>

              {/* Total Pedidos */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Total de Pedidos</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalPedidos}</p>
                </div>
                <span className="text-3xl mt-4">📋</span>
              </div>

            </div>

            {/* ALERTAS DE INVENTARIO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Alertas de Stock (Insumos)</h3>
                {insumosBajos.length > 0 ? (
                  <ul className="space-y-2">
                    {insumosBajos.map(insumo => (
                      <li key={insumo.id} className="flex justify-between items-center bg-red-50 p-2 rounded">
                        <span className="text-sm font-medium text-red-800">{insumo.nombre}</span>
                        <span className="text-xs text-red-600 font-bold">Stock: {insumo.stock} / Min: {insumo.stockMinimo}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Todos los insumos tienen stock suficiente.</p>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Accesos Rápidos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => navigate('/pedidos')} className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">+ Nuevo Pedido</button>
                  <button onClick={() => navigate('/ventas')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">+ Nueva Venta</button>
                  <button onClick={() => navigate('/produccion')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">+ Producción</button>
                  <button onClick={() => navigate('/lotes')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Ver Lotes</button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
=======
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { 
  Users, ShoppingCart, DollarSign, Egg, 
  AlertTriangle, TrendingUp, Calendar
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";

const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboard {
      totalClientes
      pedidosHoy
      pedidosSemana
      pedidosMes
      ingresosTotales
      productoMasVendido
      insumosStockBajo { id nombre stock stockMinimo }
      insumosPorVencer { id nombre fechaVencimiento }
    }
    producciones {
      fecha
      huevosPrimera
      huevosSegunda
      huevosTercera
    }
  }
`;

function KpiCard({ title, value, icon: Icon, trend, colorClass, bgClass }) {
  return (
    <div className="card flex flex-col justify-between relative overflow-hidden group hover:border-brand-200 transition-colors cursor-default">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5 transition-transform group-hover:scale-110 ${bgClass}`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-4xl font-black text-dark tracking-tight">{value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl ${bgClass} bg-opacity-10`}>
          <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={2.5} />
        </div>
      </div>
      {trend && (
        <p className="text-sm text-gray-500 flex items-center gap-1.5 font-bold relative z-10">
          <TrendingUp className="w-4 h-4 text-green-500" /> {trend}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, { fetchPolicy: "network-only" });

  if (loading) return <div className="flex justify-center py-20"><p className="text-lg font-bold text-gray-400 animate-pulse">Cargando panel general...</p></div>;
  if (error) return <div className="card bg-red-50 text-red-600 border-red-100 font-bold">Error de conexión con el servidor</div>;

  const d = data.dashboard;
  
  // Mapeo de producción para el gráfico (últimos 7 registros)
  const chartData = data.producciones?.slice(0, 7).map(p => ({
    name: new Date(p.fecha).toLocaleDateString('es-ES', { weekday: 'short' }),
    primera: p.huevosPrimera,
    segunda: p.huevosSegunda,
    tercera: p.huevosTercera,
  })).reverse() || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight">Panel de Gestión Avícola</h1>
          <p className="text-gray-500 text-base mt-2 font-medium">Tu operación, en un solo lugar. Esto es lo que pasa hoy.</p>
        </div>
        <button className="btn-primary">
          <Calendar className="w-5 h-5" /> Ver reporte general
        </button>
      </div>

      {/* Fila de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard title="Clientes" value={d.totalClientes} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-600" trend="+4 este mes" />
        <KpiCard title="Pedidos Pendientes" value={d.pedidosHoy} icon={ShoppingCart} colorClass="text-brand-600" bgClass="bg-brand-500" trend="Requieren atención" />
        <KpiCard title="Ingresos Totales" value={`Bs. ${Number(d.ingresosTotales).toLocaleString('es-BO')}`} icon={DollarSign} colorClass="text-green-600" bgClass="bg-green-600" trend="Histórico de ventas" />
        <KpiCard title="Stock Crítico" value={d.insumosStockBajo.length} icon={AlertTriangle} colorClass="text-red-600" bgClass="bg-red-600" trend="Revisar inventario" />
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Producción */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-dark">Producción de Huevos</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Huevos recolectados por calidad - últimos 7 días</p>
            </div>
            <span className="badge-warning">7 días</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 600 }} 
                />
                <Bar dataKey="primera" name="Primera" fill="#F59E0B" radius={[6, 6, 0, 0]} stackId="a" />
                <Bar dataKey="segunda" name="Segunda" fill="#FCD34D" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="tercera" name="Tercera" fill="#FEF3C7" radius={[0, 0, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas y Producto Estrella */}
        <div className="space-y-6">
          <div className="card bg-red-50 border-red-100">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2.5} />
              <h2 className="text-xl font-black text-red-900">Alertas de Stock</h2>
            </div>
            {d.insumosStockBajo.length === 0 ? (
              <p className="text-sm text-red-700 font-medium bg-white p-4 rounded-xl border border-red-100">Todo el inventario está en niveles óptimos.</p>
            ) : (
              <div className="space-y-3">
                {d.insumosStockBajo.map(i => (
                  <div key={i.id} className="bg-white p-4 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-base font-bold text-gray-900">{i.nombre}</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Mínimo requerido: {i.stockMinimo}</p>
                    </div>
                    <span className="badge-danger">{i.stock} disp.</span>
                  </div>
                ))}
              </div>
            )}
            <button className="w-full mt-5 text-sm font-black text-red-700 hover:text-red-900 py-2 uppercase tracking-wide">
              Revisar inventario completo →
            </button>
          </div>

          <div className="card bg-brand-50 border-brand-100">
            <div className="flex items-center gap-2 mb-4">
              <Egg className="w-6 h-6 text-brand-700" strokeWidth={2.5} />
              <h2 className="text-xl font-black text-brand-900">Top Ventas</h2>
            </div>
            <p className="text-3xl font-black text-brand-700 leading-tight">{d.productoMasVendido}</p>
            <p className="text-sm text-brand-700/80 mt-2 font-medium">El más solicitado por tus clientes este mes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
