import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Users, ShoppingCart, DollarSign, Egg,
  AlertTriangle, TrendingUp, Calendar, Wheat, Building2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useAuth } from "../auth/AuthContext";

const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboard {
      totalClientes
      pedidosHoy
      pedidosSemana
      pedidosMes
      ingresosTotales
      productoMasVendido
      productoMasVendidoCantidad
<<<<<<< HEAD
      abonoGeneradoMesKg
      abonoVendidoMesKg
=======
>>>>>>> b674335 (creacion de segundo admin)
      insumosStockBajo { id nombre stock stockMinimo }
      insumosPorVencer { id nombre fechaVencimiento }
    }
    producciones {
      fecha
      huevosPrimera
      huevosSegunda
      huevosTercera
    }
    granjaActual {
      id
      nombre
      codigo
    }
<<<<<<< HEAD
=======
  }
`;

const ABONO_DASHBOARD_QUERY = gql`
  query DashboardAbono {
    dashboard {
      abonoGeneradoMesKg
      abonoVendidoMesKg
    }
>>>>>>> b674335 (creacion de segundo admin)
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
  const { usuario } = useAuth();
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, { fetchPolicy: "network-only" });
  const { data: abonoData } = useQuery(ABONO_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
    errorPolicy: "ignore",
  });

  if (loading) {
    return <div className="flex justify-center py-20"><p className="text-lg font-bold text-gray-400 animate-pulse">Cargando panel general...</p></div>;
  }
  if (error) {
    return (
      <div className="card bg-red-50 text-red-700 border-red-200">
        <p className="font-bold mb-2">Error al cargar el panel:</p>
        <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{error.message}</p>
      </div>
    );
  }

  const d = data.dashboard;
<<<<<<< HEAD
=======
  const abonoStats = abonoData?.dashboard;
>>>>>>> b674335 (creacion de segundo admin)
  const esSuperadmin = usuario?.roles?.some((r) => r.codigo === "superadmin");
  const granja = data.granjaActual;

  const chartData = (data.producciones || [])
    .slice(0, 7)
    .map((p) => ({
      name: new Date(p.fecha).toLocaleDateString("es-ES", { weekday: "short" }),
      primera: p.huevosPrimera,
      segunda: p.huevosSegunda,
      tercera: p.huevosTercera,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight">
            Panel {esSuperadmin ? "de la Plataforma" : "de Gestión Avícola"}
          </h1>
          <p className="text-gray-500 text-base mt-2 font-medium">
            {esSuperadmin
              ? "Vista global de todas las granjas activas"
              : `Granja: ${granja?.nombre || "Sin granja"} (${granja?.codigo || "—"})`}
          </p>
        </div>
        <button className="btn-primary">
          <Calendar className="w-5 h-5" /> Ver reporte general
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard title="Clientes" value={d.totalClientes} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-600" trend="Registrados" />
        <KpiCard title="Pedidos Pendientes" value={d.pedidosHoy} icon={ShoppingCart} colorClass="text-brand-600" bgClass="bg-brand-500" trend="Requieren atención" />
        <KpiCard title="Ingresos Totales" value={`Bs. ${Number(d.ingresosTotales).toLocaleString("es-BO")}`} icon={DollarSign} colorClass="text-green-600" bgClass="bg-green-600" trend="Histórico" />
        <KpiCard title="Stock Crítico" value={d.insumosStockBajo.length} icon={AlertTriangle} colorClass="text-red-600" bgClass="bg-red-600" trend="Revisar inventario" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
<<<<<<< HEAD
        <KpiCard title="Abono Generado (mes)" value={`${Number(d.abonoGeneradoMesKg).toFixed(0)} kg`} icon={Wheat} colorClass="text-amber-700" bgClass="bg-amber-600" trend="Recolectado" />
        <KpiCard title="Abono Vendido (mes)" value={`${Number(d.abonoVendidoMesKg).toFixed(0)} kg`} icon={Wheat} colorClass="text-green-700" bgClass="bg-green-600" trend="Comercializado" />
=======
        {abonoStats && (
          <>
            <KpiCard title="Abono Generado (mes)" value={`${Number(abonoStats.abonoGeneradoMesKg).toFixed(0)} kg`} icon={Wheat} colorClass="text-amber-700" bgClass="bg-amber-600" trend="Recolectado" />
            <KpiCard title="Abono Vendido (mes)" value={`${Number(abonoStats.abonoVendidoMesKg).toFixed(0)} kg`} icon={Wheat} colorClass="text-green-700" bgClass="bg-green-600" trend="Comercializado" />
          </>
        )}
>>>>>>> b674335 (creacion de segundo admin)
        <KpiCard title="Pedidos (mes)" value={d.pedidosMes} icon={ShoppingCart} colorClass="text-indigo-600" bgClass="bg-indigo-600" trend="Acumulados" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-dark">Producción de Huevos</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Últimos 7 días</p>
            </div>
            <span className="badge-warning">7 días</span>
          </div>
          {chartData.length === 0 ? (
            <p className="text-center py-16 text-gray-400 font-medium">Sin datos de producción aún.</p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: "#F3F4F6" }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                  <Bar dataKey="primera" name="Primera" fill="#F59E0B" radius={[6, 6, 0, 0]} stackId="a" />
                  <Bar dataKey="segunda" name="Segunda" fill="#FCD34D" radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="tercera" name="Tercera" fill="#FEF3C7" radius={[0, 0, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

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
                {d.insumosStockBajo.slice(0, 5).map((i) => (
                  <div key={i.id} className="bg-white p-4 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-base font-bold text-gray-900">{i.nombre}</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Mín: {i.stockMinimo}</p>
                    </div>
                    <span className="badge-danger">{i.stock} disp.</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-brand-50 border-brand-100">
            <div className="flex items-center gap-2 mb-4">
              <Egg className="w-6 h-6 text-brand-700" strokeWidth={2.5} />
              <h2 className="text-xl font-black text-brand-900">Top Ventas</h2>
            </div>
            <p className="text-2xl font-black text-brand-700 leading-tight">{d.productoMasVendido}</p>
            <p className="text-sm text-brand-700/80 mt-2 font-medium">
              {Number(d.productoMasVendidoCantidad).toFixed(0)} unidades vendidas
            </p>
          </div>
        </div>
      </div>

      {esSuperadmin && (
        <div className="card bg-brand-50 border-brand-100">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-brand-700" />
            <h2 className="text-lg font-black text-brand-900">Modo superadministrador</h2>
          </div>
          <p className="text-sm text-brand-700">
            Estás viendo los datos globales de la plataforma. Para ver una granja específica, ve a <strong>Granjas</strong> en el sidebar.
          </p>
        </div>
      )}
    </div>
  );
}