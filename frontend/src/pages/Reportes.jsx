import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, CalendarDays, ChevronDown, ChevronRight, Download, Egg,
  Package, ShoppingCart, Wallet, Wheat, HeartPulse, Truck, FileText,
  Boxes, ClipboardList, TrendingUp, TrendingDown, Printer,
} from "lucide-react";

const REPORTES_QUERY = gql`
  query DatosReportes($desde: Date!, $hasta: Date!) {
    dashboard {
      totalClientes pedidosMes ingresosTotales productoMasVendido productoMasVendidoCantidad
      abonoGeneradoMesKg abonoVendidoMesKg
    }
    producciones { id fecha total huevosPrimera huevosSegunda huevosTercera huevosDescartados }
    ventas {
      id fecha montoTotal
      pedido { id }
    }
    ventasGallinaza(fechaDesde: $desde, fechaHasta: $hasta) {
      id fecha total estado detalles { cantidadKg subtotal producto { nombre } }
    }
    pedidos { id fechaPedido estado estadoEntrega total }
    compras { id fecha total estado }
    insumos { id nombre tipo presentacion stock stockMinimo precioUnitario fechaVencimiento }
    consumosGranja { id insumoId loteId fecha cantidad }
    lotesConAves { id codigo raza etapa cantidadAves avesActuales porcentajeMortalidad }
    generacionesAbono { id fecha cantidadKg estado }
  }
`;

const COLORS = ["#f97316", "#1d4ed8", "#22a447", "#9333ea"];
const MONEY = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COUNT = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 0 });
const REPORTS = [
  { id: "eggs", title: "Producción de huevos", icon: Egg },
  { id: "sales", title: "Ventas", icon: ShoppingCart },
  { id: "inventory", title: "Inventario", icon: Boxes },
  { id: "finance", title: "Finanzas", icon: Wallet },
  { id: "feed", title: "Alimentación", icon: Wheat },
  { id: "health", title: "Salud y mortalidad", icon: HeartPulse },
  { id: "deliveries", title: "Entregas", icon: Truck },
  { id: "general", title: "Reporte general", icon: FileText },
];

function dateString(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function dateValue(value) {
  if (!value) return null;
  const parts = value.slice(0, 10).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function getRange(preset, from, to) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start = new Date(end);
  if (preset === "week") start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  else if (preset === "year") start = new Date(end.getFullYear(), 0, 1);
  else if (preset === "30days") start.setDate(end.getDate() - 29);
  else if (preset === "custom") return { start: dateValue(from) || new Date(end.getFullYear(), end.getMonth(), 1), end: dateValue(to) || end };
  else start = new Date(end.getFullYear(), end.getMonth(), 1);
  return { start, end };
}
function previousRange(range) {
  const days = Math.max(1, Math.round((range.end - range.start) / 86400000) + 1);
  const end = new Date(range.start);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return { start, end };
}
function inside(value, range) {
  const date = dateValue(value);
  return date && date >= range.start && date <= range.end;
}
function totalOf(list, field) {
  return list.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}
function pct(current, previous) {
  if (!previous) return current ? null : 0;
  return (current - previous) / Math.abs(previous) * 100;
}
function formatDate(value) {
  return dateValue(value)?.toLocaleDateString("es-BO", { day: "2-digit", month: "short" }) || value;
}
function seriesFor(rows, mode) {
  const grouped = new Map();
  rows.forEach((row) => {
    const date = dateValue(row.fecha);
    if (!date) return;
    let key;
    let label;
    if (mode === "year") {
      key = date.getFullYear() + "-" + (date.getMonth() + 1);
      label = date.toLocaleDateString("es-BO", { month: "short" });
    } else if (mode === "month") {
      const week = Math.floor((date.getDate() - 1) / 7) + 1;
      key = date.getFullYear() + "-" + date.getMonth() + "-" + week;
      label = "Sem " + week;
    } else {
      key = dateString(date);
      label = date.toLocaleDateString("es-BO", { weekday: "short" });
    }
    grouped.set(key, { label: mode === "week" ? label + " " + formatDate(key) : label, huevos: (grouped.get(key)?.huevos || 0) + Number(row.total || 0) });
  });
  return Array.from(grouped, ([key, value]) => ({ key, ...value }));
}
function csvDownload(rows, filename) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const content = [columns.join(","), ...rows.map((row) => columns.map((key) => '"' + String(row[key] ?? "").replaceAll('"', '""') + '"').join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makeRows(id, data, range) {
  const productions = data.productions.filter((item) => inside(item.fecha, range));
  const sales = data.sales.filter((item) => inside(item.fecha, range));
  const manureSales = data.manureSales.filter((item) => inside(item.fecha, range));
  const orders = data.orders.filter((item) => inside(item.fechaPedido, range));
  const purchases = data.purchases.filter((item) => inside(item.fecha, range));
  if (id === "eggs") return productions.map((row) => ({ Fecha: formatDate(row.fecha), Total: row.total, Primera: row.huevosPrimera, Segunda: row.huevosSegunda, Tercera: row.huevosTercera, Descartados: row.huevosDescartados }));
  if (id === "sales") return [
    ...sales.map((row) => ({ Fecha: formatDate(row.fecha), Categoría: "Venta de pedido", Referencia: row.pedido?.id || row.id, Total: Number(row.montoTotal) })),
    ...manureSales.map((row) => ({ Fecha: formatDate(row.fecha), Producto: (row.detalles || []).map((detail) => detail.producto?.nombre).filter(Boolean).join(", ") || "Abono", Total: Number(row.total) })),
  ];
  if (id === "inventory") return data.inventory.map((item) => ({ Insumo: item.nombre, Tipo: item.tipo, Stock: Number(item.stock), Minimo: Number(item.stockMinimo), Presentacion: item.presentacion, Estado: Number(item.stock) <= Number(item.stockMinimo) ? "Stock bajo" : "Disponible" }));
  if (id === "finance") {
    const income = totalOf(sales, "montoTotal") + totalOf(manureSales, "total");
    const costs = totalOf(purchases, "total");
    return [{ Concepto: "Ventas del periodo", Monto: income }, { Concepto: "Compras del periodo", Monto: costs }, { Concepto: "Balance estimado", Monto: income - costs }];
  }
  if (id === "feed") return data.consumptions.filter((row) => inside(row.fecha, range) && data.inventory.some((item) => item.id === row.insumoId && item.tipo === "alimento")).map((row) => ({ Fecha: formatDate(row.fecha), Alimento: data.inventory.find((item) => item.id === row.insumoId)?.nombre || "Alimento", Lote: row.loteId, Cantidad: Number(row.cantidad) }));
  if (id === "health") return data.lots.map((row) => ({ Lote: row.codigo, Raza: row.raza, Etapa: row.etapa, "Aves iniciales": row.cantidadAves, "Aves actuales": row.avesActuales, Mortalidad: Number(row.porcentajeMortalidad || 0).toFixed(1) + "%" }));
  if (id === "deliveries") return orders.map((row) => ({ Pedido: row.id, Fecha: formatDate(row.fechaPedido), Estado: row.estado, Entrega: row.estadoEntrega || "—", Total: Number(row.total) }));
  return [
    { Indicador: "Huevos producidos", Valor: COUNT.format(totalOf(productions, "total")) },
    { Indicador: "Ventas", Valor: "Bs. " + MONEY.format(totalOf(sales, "montoTotal") + totalOf(manureSales, "total")) },
    { Indicador: "Pedidos", Valor: COUNT.format(orders.length) },
    { Indicador: "Clientes", Valor: COUNT.format(data.clientCount) },
  ];
}

function Kpi({ icon: Icon, title, value, color, change }) {
  const up = change == null || change >= 0;
  return <article className={"rounded-2xl border bg-white p-4 shadow-sm " + color.border}>
    <div className="flex items-center gap-3"><span className={"flex h-14 w-14 items-center justify-center rounded-full " + color.icon}><Icon className="h-7 w-7" /></span><div><p className="text-sm font-bold text-slate-700">{title}</p><p className={"mt-1 text-2xl font-black " + color.value}>{value}</p></div></div>
    <p className={"mt-3 flex items-center justify-end gap-1 text-xs font-bold " + (up ? "text-green-700" : "text-red-600")}>{up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{change == null ? "Sin periodo anterior" : Math.abs(change).toFixed(1) + "% vs. periodo anterior"}</p>
  </article>;
}

export default function Reportes() {
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [chartMode, setChartMode] = useState("week");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");
  const range = useMemo(() => getRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const previous = useMemo(() => previousRange(range), [range]);
  const { data, loading, error } = useQuery(REPORTES_QUERY, {
    variables: { desde: dateString(previous.start), hasta: dateString(range.end) },
    fetchPolicy: "network-only",
  });
  if (loading) return <div className="card py-12 text-center text-gray-500">Cargando reportes...</div>;
  if (error) return <div className="card border border-red-200 bg-red-50 p-5 text-red-700">No se pudieron cargar los reportes: {error.message}</div>;

  const dashboard = data.dashboard;
  const productions = data.producciones || [];
  const sales = data.ventas || [];
  const manureSales = data.ventasGallinaza || [];
  const orders = data.pedidos || [];
  const purchases = data.compras || [];
  const currentProduction = productions.filter((row) => inside(row.fecha, range));
  const previousProduction = productions.filter((row) => inside(row.fecha, previous));
  const currentSales = sales.filter((row) => inside(row.fecha, range));
  const previousSales = sales.filter((row) => inside(row.fecha, previous));
  const currentManure = manureSales.filter((row) => inside(row.fecha, range));
  const previousManure = manureSales.filter((row) => inside(row.fecha, previous));
  const currentOrders = orders.filter((row) => inside(row.fechaPedido, range));
  const previousOrders = orders.filter((row) => inside(row.fechaPedido, previous));
  const currentPurchases = purchases.filter((row) => inside(row.fecha, range));
  const previousPurchases = purchases.filter((row) => inside(row.fecha, previous));
  const eggs = totalOf(currentProduction, "total");
  const oldEggs = totalOf(previousProduction, "total");
  const income = totalOf(currentSales, "montoTotal") + totalOf(currentManure, "total");
  const oldIncome = totalOf(previousSales, "montoTotal") + totalOf(previousManure, "total");
  const balance = income - totalOf(currentPurchases, "total");
  const oldBalance = oldIncome - totalOf(previousPurchases, "total");
  const inventory = data.insumos || [];
  const detailData = { productions, sales, manureSales, orders, purchases, inventory, consumptions: data.consumosGranja || [], lots: data.lotesConAves || [], clientCount: dashboard.totalClientes };
  const report = REPORTS.find((item) => item.id === selectedReport);
  const rows = report ? makeRows(report.id, detailData, range) : [];
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const chartAnchor = range.end;
  const chartStart = chartMode === "year" ? new Date(chartAnchor.getFullYear(), 0, 1) : chartMode === "month" ? new Date(chartAnchor.getFullYear(), chartAnchor.getMonth(), 1) : new Date(chartAnchor.getFullYear(), chartAnchor.getMonth(), chartAnchor.getDate() - 6);
  const chartRows = seriesFor(productions.filter((row) => inside(row.fecha, { start: chartStart, end: chartAnchor })), chartMode);
  const productTotals = new Map();
  if (currentSales.length) productTotals.set("Ventas de pedidos", totalOf(currentSales, "montoTotal"));
  if (currentManure.length) productTotals.set("Abono", (productTotals.get("Abono") || 0) + totalOf(currentManure, "total"));
  const donutRows = Array.from(productTotals, ([name, value]) => ({ name, value }));
  const dateLabel = range.start.toLocaleDateString("es-BO") + " – " + range.end.toLocaleDateString("es-BO");
  const lowStock = inventory.filter((item) => Number(item.stock) <= Number(item.stockMinimo)).length;
  const feed = (data.consumosGranja || []).filter((row) => inside(row.fecha, range) && inventory.some((item) => item.id === row.insumoId && item.tipo === "alimento"));
  const exportReport = (format) => {
    setExportOpen(false);
    if (format === "pdf") window.print();
    else csvDownload(rows.length ? rows : makeRows("general", detailData, range), "avicontrol-" + (selectedReport || "resumen") + "-" + dateString(range.start) + ".csv");
  };

  return <main className="space-y-6 pb-10 text-slate-800">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-4"><BarChart3 className="h-11 w-11 shrink-0 text-orange-500" /><div><h1 className="text-3xl font-black tracking-tight text-slate-900">Reportes y Estadísticas</h1><p className="text-slate-500">Resumen general del negocio avícola</p></div></div>
      <div className="no-print flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><CalendarDays className="h-5 w-5 text-slate-500" /><select aria-label="Periodo del reporte" value={preset} onChange={(event) => setPreset(event.target.value)} className="bg-transparent text-sm font-bold outline-none"><option value="week">Esta semana</option><option value="month">Este mes</option><option value="30days">Últimos 30 días</option><option value="year">Este año</option><option value="custom">Personalizado</option></select><ChevronDown className="h-4 w-4 text-slate-500" /></div>
        {preset === "custom" && <div className="flex gap-2"><input type="date" aria-label="Desde" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="rounded-lg border px-2 py-2 text-sm" /><input type="date" aria-label="Hasta" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="rounded-lg border px-2 py-2 text-sm" /></div>}
        <div className="relative"><button onClick={() => setExportOpen((open) => !open)} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 font-bold text-white hover:bg-orange-600"><Download className="h-5 w-5" /> Exportar <ChevronDown className="h-4 w-4" /></button>{exportOpen && <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border bg-white p-1 shadow-xl"><button onClick={() => exportReport("pdf")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><Printer className="h-4 w-4" /> Guardar como PDF</button><button onClick={() => exportReport("csv")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><Download className="h-4 w-4" /> Descargar CSV</button></div>}</div>
      </div>
    </header>
    <p className="text-xs font-semibold text-slate-500">Periodo: {dateLabel}</p>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi icon={Egg} title="Producción de huevos" value={COUNT.format(eggs)} color={{ border: "border-orange-200", icon: "bg-orange-100 text-orange-500", value: "text-slate-900" }} change={pct(eggs, oldEggs)} />
      <Kpi icon={ShoppingCart} title="Ventas totales" value={"Bs. " + MONEY.format(income)} color={{ border: "border-green-200", icon: "bg-green-100 text-green-600", value: "text-green-700" }} change={pct(income, oldIncome)} />
      <Kpi icon={Package} title="Pedidos realizados" value={COUNT.format(currentOrders.length)} color={{ border: "border-blue-200", icon: "bg-blue-100 text-blue-600", value: "text-slate-900" }} change={pct(currentOrders.length, previousOrders.length)} />
      <Kpi icon={Wallet} title="Ganancia estimada" value={"Bs. " + MONEY.format(balance)} color={{ border: "border-purple-200", icon: "bg-purple-100 text-purple-600", value: "text-purple-700" }} change={pct(balance, oldBalance)} />
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <article className="report-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-black"><BarChart3 className="h-6 w-6 text-orange-500" /> Producción de Huevos</h2><div className="no-print flex rounded-full bg-slate-100 p-1">{[["week", "Semanal"], ["month", "Mensual"], ["year", "Anual"]].map(([id, label]) => <button key={id} onClick={() => setChartMode(id)} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (chartMode === id ? "bg-orange-500 text-white shadow" : "text-slate-600")}>{label}</button>)}</div></div>
        <div className="h-64">{chartRows.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartRows}><defs><linearGradient id="eggArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [COUNT.format(value), "Huevos"]} /><Area type="monotone" dataKey="huevos" stroke="#f97316" strokeWidth={3} fill="url(#eggArea)" /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Sin registros de producción en el periodo.</div>}</div>
      </article>
      <article className="report-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-black"><ShoppingCart className="h-6 w-6 text-orange-500" /> Ventas por categoría</h2>{donutRows.length ? <div className="grid items-center gap-3 md:grid-cols-[1fr_1.1fr]"><div className="relative h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={donutRows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={2}>{donutRows.map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => ["Bs. " + MONEY.format(value), "Ventas"]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-black">100%</span><span className="text-sm text-slate-500">Ventas</span></div></div><div className="space-y-3">{donutRows.map((row, index) => <div key={row.name} className="flex justify-between gap-2 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{row.name}</span><strong>Bs. {MONEY.format(row.value)}</strong></div>)}<div className="flex justify-between border-t pt-3 font-black"><span>Total</span><span className="rounded-lg bg-orange-500 px-3 py-1 text-white">Bs. {MONEY.format(income)}</span></div></div></div> : <div className="flex h-56 items-center justify-center text-sm text-slate-500">Sin ventas en este periodo.</div>}</article>
    </section>

    <section><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-xl font-black"><ClipboardList className="h-6 w-6 text-orange-500" /> Reportes disponibles</h2><p className="text-sm text-slate-500">Selecciona un reporte para ver sus datos.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{REPORTS.map(({ id, title, icon: Icon }) => <button key={id} onClick={() => setSelectedReport(id)} className={"report-print flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " + (selectedReport === id ? "border-orange-400 ring-2 ring-orange-100" : "border-orange-100")}><Icon className="h-7 w-7 shrink-0 text-orange-500" /><strong className="flex-1">{title}</strong><ChevronRight className="h-5 w-5 text-orange-500" /></button>)}</div></section>

    {report && <section className="report-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black">{report.title}</h2><p className="text-sm text-slate-500">{dateLabel}</p></div><button className="no-print text-sm font-bold text-orange-600" onClick={() => setSelectedReport("")}>Cerrar detalle</button></div>{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{columns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{columns.map((column) => <td key={column} className="px-3 py-2">{column === "Monto" ? "Bs. " + MONEY.format(row[column]) : String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></div> : <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No hay datos para este reporte en el periodo seleccionado.</div>}</section>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Abono generado</p><p className="mt-1 text-xl font-black text-amber-700">{MONEY.format(totalOf((data.generacionesAbono || []).filter((row) => inside(row.fecha, range)), "cantidadKg"))} kg</p></div><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Stock bajo</p><p className="mt-1 text-xl font-black text-red-600">{lowStock} insumos</p></div><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Consumo de alimento</p><p className="mt-1 text-xl font-black">{MONEY.format(totalOf(feed, "cantidad"))} kg</p></div><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Pedidos entregados</p><p className="mt-1 text-xl font-black text-green-700">{COUNT.format(currentOrders.filter((row) => row.estado === "entregado").length)} / {COUNT.format(currentOrders.length)}</p></div></section>
  </main>;
}
