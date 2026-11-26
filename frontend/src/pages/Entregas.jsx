import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Truck, Phone, MapPin, Search, CalendarDays, ClipboardList,
} from "lucide-react";

const PEDIDOS_PARA_ENTREGA = gql`
  query PedidosParaEntrega {
    pedidos {
      id
      estado
      estadoEntrega
      total
      fechaPedido
      cliente { nombres apellidos telefono direccion }
    }
  }
`;

const CAMBIAR_ESTADO_ENTREGA = gql`
  mutation CambiarEstadoEntrega($id: ID!, $estadoEntrega: String!) {
    cambiarEstadoEntrega(id: $id, estadoEntrega: $estadoEntrega) {
      id
      estadoEntrega
    }
  }
`;

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", badge: "bg-amber-100 text-amber-800" },
  { value: "preparando", label: "Preparando", badge: "bg-blue-100 text-blue-800" },
  { value: "en_ruta", label: "En ruta", badge: "bg-violet-100 text-violet-800" },
  { value: "entregado", label: "Entregado", badge: "bg-green-100 text-green-800" },
];

const fechaVisible = (fecha) => {
  if (!fecha) return "Sin fecha";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

export default function Entregas() {
  const { data, loading, error, refetch } = useQuery(PEDIDOS_PARA_ENTREGA, { fetchPolicy: "network-only" });
  const [cambiarEstado, { loading: guardando }] = useMutation(CAMBIAR_ESTADO_ENTREGA);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [pedidoActualizando, setPedidoActualizando] = useState(null);
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleCambiar = async (id, nuevoEstado) => {
    setPedidoActualizando(id);
    setErrorAccion("");
    setMensaje("");
    try {
      await cambiarEstado({ variables: { id, estadoEntrega: nuevoEstado } });
      await refetch();
      const estado = ESTADOS.find((item) => item.value === nuevoEstado);
      setMensaje(`Pedido #${id} actualizado a “${estado?.label || nuevoEstado}”.`);
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setPedidoActualizando(null);
    }
  };

  const todosPedidos = (data?.pedidos ?? []).filter((pedido) => pedido.estado !== "anulado");
  const pedidos = estadoFiltro
    ? todosPedidos.filter((pedido) => pedido.estadoEntrega === estadoFiltro)
    : todosPedidos;
  const consulta = busqueda.trim().toLocaleLowerCase("es");
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const nombre = `${pedido.cliente?.nombres ?? ""} ${pedido.cliente?.apellidos ?? ""}`.toLocaleLowerCase("es");
    return !consulta || nombre.includes(consulta) || String(pedido.id).includes(consulta) || (pedido.cliente?.telefono ?? "").includes(consulta);
  });

  const conteos = ESTADOS.reduce((resultado, estado) => {
    resultado[estado.value] = todosPedidos.filter((pedido) => pedido.estadoEntrega === estado.value).length;
    return resultado;
  }, {});

  if (loading) return <div className="card py-12 text-center text-gray-500">Cargando entregas...</div>;
  if (error) return <div className="card border border-red-200 bg-red-50 p-4 text-red-700">No se pudieron cargar las entregas: {error.message}</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-dark md:text-4xl">
            <Truck className="h-8 w-8 text-brand-500" /> Entregas
          </h1>
          <p className="mt-1 text-base font-medium text-gray-500">Organiza cada pedido por su etapa y actualiza su avance.</p>
        </div>
      </header>

      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Filtrar por etapa de entrega">
          <button
            onClick={() => setEstadoFiltro("")}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${estadoFiltro === "" ? "bg-brand-500 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
          >Todos <span className={estadoFiltro === "" ? "ml-1 opacity-80" : "ml-1 text-gray-400"}>{todosPedidos.length}</span></button>
          {ESTADOS.map((estado) => (
            <button
              key={estado.value}
              onClick={() => setEstadoFiltro(estado.value)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${estadoFiltro === estado.value ? "bg-brand-500 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {estado.label} <span className={estadoFiltro === estado.value ? "ml-1 opacity-80" : "ml-1 text-gray-400"}>{conteos[estado.value] || 0}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field py-2 pl-9"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar cliente o pedido"
            aria-label="Buscar por cliente, teléfono o número de pedido"
          />
        </label>
      </div>

      {errorAccion && <div role="alert" className="card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">No se pudo actualizar el estado: {errorAccion}</div>}
      {mensaje && <div role="status" className="card border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{mensaje}</div>}

      {pedidosFiltrados.length === 0 ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <ClipboardList className="mb-3 h-8 w-8 text-gray-400" />
          <p className="font-bold text-dark">{consulta ? "No encontramos pedidos con esa búsqueda." : "No hay pedidos en esta etapa."}</p>
          <p className="mt-1 text-sm text-gray-500">Los pedidos anulados no aparecen en Entregas.</p>
        </div>
      ) : (
        <section className="card overflow-hidden p-0" aria-label="Pedidos para entrega">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-bold text-gray-500">{pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido" : "pedidos"}</p>
            <p className="hidden text-xs font-semibold text-gray-400 sm:block">Ordenados del más reciente</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pedidosFiltrados.map((pedido) => {
              return (
                <article key={pedido.id} className="grid grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-gray-50/70 sm:grid-cols-[minmax(170px,1.3fr)_minmax(170px,1.2fr)_minmax(110px,0.8fr)_minmax(100px,0.6fr)_minmax(150px,0.9fr)] sm:items-center sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-dark">{pedido.cliente?.nombres} {pedido.cliente?.apellidos}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Pedido #{pedido.id}</p>
                  </div>
                  <div className="min-w-0 space-y-1 text-xs text-gray-500">
                    {pedido.cliente?.telefono && (
                      <a className="flex items-center gap-1.5 font-semibold text-brand-700 hover:underline" href={`tel:${pedido.cliente.telefono}`}>
                        <Phone className="h-3.5 w-3.5 shrink-0" />{pedido.cliente.telefono}
                      </a>
                    )}
                    <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{pedido.cliente?.direccion || "Sin dirección"}</span></p>
                  </div>
                  <div><span className="text-[10px] font-bold uppercase text-gray-400 sm:hidden">Fecha · </span><span className="text-sm text-gray-600">{fechaVisible(pedido.fechaPedido)}</span></div>
                  <div className="font-black text-brand-700">Bs. {Number(pedido.total).toFixed(2)}</div>
                  <label className="flex items-center gap-2 sm:justify-end">
                    <span className="text-xs font-semibold text-gray-400 sm:sr-only">Etapa de entrega</span>
                    <select
                      className="input-field min-w-0 py-2 text-sm sm:max-w-40"
                      value={pedido.estadoEntrega}
                      disabled={guardando && pedidoActualizando === pedido.id}
                      onChange={(event) => handleCambiar(pedido.id, event.target.value)}
                      aria-label={`Actualizar entrega del pedido ${pedido.id}`}
                    >
                      {ESTADOS.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
                    </select>
                  </label>
                  {guardando && pedidoActualizando === pedido.id && <span className="text-xs text-gray-400 sm:col-span-5">Guardando cambio…</span>}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
