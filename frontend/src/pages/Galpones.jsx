import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Home, Plus, Layers } from "lucide-react";
import { GALPONES_QUERY, CREAR_GALPON } from "../graphql/galpones";
import { GRANJAS_QUERY } from "../graphql/granjas";
import Modal from "../components/Modal";

export default function Galpones() {
  const [modalOpen, setModalOpen] = useState(false);
  const [granjaId, setGranjaId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [error, setError] = useState("");

  const { data: granjasData } = useQuery(GRANJAS_QUERY);
  const { data, loading, refetch } = useQuery(GALPONES_QUERY, {
    variables: { granjaId: granjaId || undefined },
    fetchPolicy: "network-only",
  });
  const [crearGalpon, { loading: creando }] = useMutation(CREAR_GALPON);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await crearGalpon({
        variables: {
          granjaId,
          codigo,
          capacidadAves: parseInt(capacidad, 10),
        },
      });
      setModalOpen(false);
      setCodigo("");
      setCapacidad("");
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const granjas = granjasData?.granjas ?? [];
  const galpones = data?.galpones ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <Home className="w-8 h-8 text-brand-500" /> Galpones
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            Administra los galpones de tus granjas
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo galpón
        </button>
      </div>

      {/* Filtro por granja */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <label className="text-sm font-bold text-gray-700 mb-1 block">Filtrar por granja</label>
        <select
          className="input-field"
          value={granjaId}
          onChange={(e) => setGranjaId(e.target.value)}
        >
          <option value="">Todas las granjas</option>
          {granjas.map((g) => (
            <option key={g.id} value={g.id}>{g.nombre} ({g.codigo})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando galpones...</div>
      ) : galpones.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No hay galpones registrados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galpones.map((gal) => (
            <div key={gal.id} className="card relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
                <span className={gal.activo ? "badge-success" : "badge-danger"}>
                  {gal.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <h3 className="text-xl font-black text-dark">Galpón {gal.codigo}</h3>
              <p className="text-sm text-gray-500 font-bold mb-3">Capacidad: {Number(gal.capacidadAves).toLocaleString()} aves</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Layers className="w-4 h-4 text-gray-400" />
                <span>Aves actuales: <strong>{gal.avesActuales}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo galpón">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Granja *</label>
            <select
              className="input-field"
              value={granjaId}
              onChange={(e) => setGranjaId(e.target.value)}
              required
            >
              <option value="">Selecciona una granja</option>
              {granjas.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre} ({g.codigo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Código *</label>
            <input
              className="input-field"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: G-01"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1 block">Capacidad de aves *</label>
            <input
              type="number"
              className="input-field"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder="Ej: 1000"
              required
              min="1"
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={creando} className="btn-primary">
              {creando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}