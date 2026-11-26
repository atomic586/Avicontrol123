import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { Package, Search, Plus, Edit2, Trash2, Filter, AlertTriangle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";

// 1. QUERY PARA TRAER LOS INSUMOS
const INSUMOS_QUERY = gql`
  query GetInsumos {
    insumos {
      id
      nombre
      tipo
      presentacion
      stock
      stockMinimo
      precioUnitario
      fechaVencimiento
    }
  }
`;

// 2. MUTACIONES (Ajusta según tu backend si necesitas crear/eliminar)
// Por ahora solo mostraremos la tabla y el filtro.
// const CREAR_INSUMO = gql`...`
// const ELIMINAR_INSUMO = gql`...`

export default function Insumos() {
  const { esSuperadmin, esAdminGranja, esAlmacen } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados locales
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState(searchParams.get("tipo") || "");
  
  // Sincronizar el filtro con la URL
  useEffect(() => {
    const tipoURL = searchParams.get("tipo");
    if (tipoURL) {
      setFiltroTipo(tipoURL);
    } else {
      setFiltroTipo("");
    }
  }, [searchParams]);

  // Query
  const { data, loading, error } = useQuery(INSUMOS_QUERY, { fetchPolicy: "network-only" });
  const insumos = data?.insumos || [];

  // Lógica de filtrado combinada (búsqueda + tipo)
  const insumosFiltrados = insumos.filter((i) => {
    const coincideTexto = i.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = filtroTipo ? i.tipo === filtroTipo : true;
    return coincideTexto && coincideTipo;
  });

  // Cambiar el filtro de tipo (actualiza la URL para mantener consistencia)
  const handleTipoChange = (nuevoTipo) => {
    setFiltroTipo(nuevoTipo);
    if (nuevoTipo) {
      setSearchParams({ tipo: nuevoTipo });
    } else {
      setSearchParams({});
    }
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-BO");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-[var(--accent)]" /> Insumos
          </h1>
          <p className="text-[var(--text-secondary)] text-base mt-1 font-medium">
            Gestiona el inventario de alimentos, medicamentos e insumos generales.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl">
          <p className="font-bold">Error al cargar insumos:</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* BARRA DE FILTROS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
        
        {/* Búsqueda por texto */}
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block uppercase tracking-wider">Buscar Insumo</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Nombre del insumo..."
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Filtro por Tipo */}
        <div className="w-full lg:w-56">
          <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block uppercase tracking-wider">Tipo</label>
          <select
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
            value={filtroTipo}
            onChange={(e) => handleTipoChange(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="alimento">Alimentos</option>
            <option value="medicamento">Medicamentos</option>
            <option value="general">Insumos Generales</option>
          </select>
        </div>
      </div>

      {/* TABLA DE INSUMOS */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Cargando insumos...</div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">Insumo</th>
                  <th className="text-left p-4 font-bold">Tipo</th>
                  <th className="text-left p-4 font-bold">Stock</th>
                  <th className="text-left p-4 font-bold">Precio Unit.</th>
                  <th className="text-left p-4 font-bold">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                      No se encontraron insumos {filtroTipo ? `de tipo "${filtroTipo}"` : ""}.
                    </td>
                  </tr>
                ) : (
                  insumosFiltrados.map((i) => (
                    <tr key={i.id} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-main)] transition-colors">
                      <td className="p-4 font-bold text-[var(--text-primary)]">
                        {i.nombre}
                        <span className="block text-xs text-[var(--text-secondary)] font-normal">{i.presentacion}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${
                          i.tipo === "alimento" ? "bg-amber-500/10 text-amber-600" :
                          i.tipo === "medicamento" ? "bg-blue-500/10 text-blue-600" :
                          "bg-green-500/10 text-green-600"
                        }`}>
                          {i.tipo}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${i.stock <= i.stockMinimo ? "text-red-500" : "text-[var(--text-primary)]"}`}>
                          {i.stock} {i.stock <= i.stockMinimo && <AlertTriangle className="w-4 h-4 inline ml-1" />}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-primary)]">Bs. {Number(i.precioUnitario).toFixed(2)}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{formatFecha(i.fechaVencimiento)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}