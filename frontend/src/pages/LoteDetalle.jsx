import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Egg, Clock, Plus } from "lucide-react";

const LOTE_DETALLE_QUERY = gql`
  query LoteDetalle($id: ID!) {
    lote(id: $id) {
      id
      galponId
      codigo
      raza
      fechaIngreso
      fechaNacimiento
      cantidadAves
      estado
      etapa
      avesActuales
      porcentajeMortalidad
      edadSemanas
    }
  }
`;

export default function LoteDetalle() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(LOTE_DETALLE_QUERY, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  if (loading) return <div className="card text-center py-12 text-gray-500">Cargando lote...</div>;
  if (error) return <div className="card text-red-600 p-4">Error: {error.message}</div>;

  const lote = data?.lote;
  if (!lote) return <div className="card text-center py-12 text-gray-500">Lote no encontrado.</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium flex-wrap">
        <Link to="/granjas" className="hover:text-brand-600">Granjas</Link>
        <span>/</span>
        <Link to={`/galpones/${lote.galponId}`} className="hover:text-brand-600">Galpón</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Lote {lote.codigo}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-blue-100 text-blue-500 flex items-center justify-center shadow-inner">
            <Egg className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-dark tracking-tight">Lote {lote.codigo}</h1>
            <p className="text-gray-500 font-medium mt-1">Raza: <span className="font-bold text-gray-800">{lote.raza}</span></p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="badge-info text-sm px-4 py-1.5 uppercase">{lote.etapa}</span>
          <span className="text-sm text-gray-500 font-medium">Edad: {lote.edadSemanas ? `${lote.edadSemanas} semanas` : "No registrada"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Aves Iniciales</p>
          <p className="text-3xl font-black text-dark">{Number(lote.cantidadAves).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">Aves Actuales</p>
          <p className="text-3xl font-black text-brand-600">{lote.avesActuales.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mortalidad</p>
          <p className={`text-3xl font-black ${lote.porcentajeMortalidad > 5 ? "text-red-500" : "text-gray-700"}`}>{lote.porcentajeMortalidad}%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha Ingreso</p>
          <p className="text-lg font-black text-gray-700">{new Date(lote.fechaIngreso).toLocaleDateString("es-BO")}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary">
          <Plus className="w-5 h-5" /> Registrar Movimiento
        </button>
        <button className="btn-secondary">
          <Clock className="w-5 h-5" /> Ver Historial
        </button>
      </div>
    </div>
  );
}