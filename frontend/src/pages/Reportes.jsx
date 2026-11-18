import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { BarChart2, TrendingUp, Package, DollarSign } from "lucide-react";

const REPORTE_QUERY = gql`
  query ReporteGeneral {
    dashboard {
      totalClientes
      pedidosMes
      ingresosTotales
      productoMasVendido
      productoMasVendidoCantidad
      abonoGeneradoMesKg
      abonoVendidoMesKg
    }
  }
`;

export default function Reportes() {
  const { data, loading, error } = useQuery(REPORTE_QUERY, { fetchPolicy: "network-only" });

  if (loading) return <div className="card text-center py-12 text-gray-500">Cargando reportes...</div>;
  if (error) return <div className="card bg-red-50 text-red-700 p-4">Error: {error.message}</div>;

  const d = data.dashboard;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
        <BarChart2 className="w-8 h-8 text-brand-500" /> Reportes y Estadísticas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-black text-dark mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" /> Resumen de Ventas
          </h2>
          <p className="text-sm font-bold text-gray-500 uppercase">Ingresos Totales</p>
          <p className="text-4xl font-black text-green-700 mb-4">Bs. {parseFloat(d.ingresosTotales).toFixed(2)}</p>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Pedidos del mes</p>
              <p className="text-2xl font-black text-dark">{d.pedidosMes}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Clientes</p>
              <p className="text-2xl font-black text-dark">{d.totalClientes}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-black text-dark mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" /> Producto Estrella
          </h2>
          <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl">
            <p className="text-sm font-bold text-brand-800 uppercase">El más vendido del mes</p>
            <p className="text-2xl font-black text-brand-700 mt-1">{d.productoMasVendido}</p>
            <p className="text-sm text-brand-600 mt-2 font-medium">
              {parseFloat(d.productoMasVendidoCantidad).toFixed(0)} unidades vendidas
            </p>
          </div>
        </div>

        <div className="card md:col-span-2 bg-gray-50">
          <h2 className="text-xl font-black text-dark mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" /> Rendimiento del Abono
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Generado este mes</p>
              <p className="text-3xl font-black text-amber-700">{parseFloat(d.abonoGeneradoMesKg).toFixed(2)} kg</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-bold text-gray-500 uppercase">Vendido este mes</p>
              <p className="text-3xl font-black text-green-700">{parseFloat(d.abonoVendidoMesKg).toFixed(2)} kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}