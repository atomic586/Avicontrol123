import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { TrendingUp, Egg } from "lucide-react";

// Datos simulados (más adelante vendrán del backend)
const DATOS_EJEMPLO = [
  { fecha: "01 Nov", huevos: 12500 },
  { fecha: "02 Nov", huevos: 13200 },
  { fecha: "03 Nov", huevos: 12800 },
  { fecha: "04 Nov", huevos: 14100 },
  { fecha: "05 Nov", huevos: 13900 },
  { fecha: "06 Nov", huevos: 15200 },
  { fecha: "07 Nov", huevos: 14800 },
  { fecha: "08 Nov", huevos: 15600 },
  { fecha: "09 Nov", huevos: 16100 },
  { fecha: "10 Nov", huevos: 15400 },
  { fecha: "11 Nov", huevos: 16800 },
  { fecha: "12 Nov", huevos: 17200 },
];

export default function ProduccionChart({ data = DATOS_EJEMPLO, loading = false }) {
  const totalMes = useMemo(() => data.reduce((acc, d) => acc + d.huevos, 0), [data]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft h-80 flex items-center justify-center">
        <p className="text-gray-400 font-bold">Cargando gráfico...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-dark dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" /> Producción Diaria
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Últimos 12 días (huevos recolectados)</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total del Período</p>
          <p className="text-2xl font-black text-brand-600 flex items-center gap-2 justify-end">
            <Egg className="w-5 h-5" /> {totalMes.toLocaleString()}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHuevos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="fecha" 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#1f2937", 
              border: "none", 
              borderRadius: "12px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "bold"
            }}
            itemStyle={{ color: "#f97316" }}
            formatter={(value) => [`${value.toLocaleString()} huevos`, "Producción"]}
          />
          <Area 
            type="monotone" 
            dataKey="huevos" 
            stroke="#f97316" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorHuevos)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}