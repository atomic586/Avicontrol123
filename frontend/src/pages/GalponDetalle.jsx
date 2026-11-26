import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Home, Egg, Plus, ClipboardList, ArrowRight } from "lucide-react";

const GALPON_DETALLE_QUERY = gql`
  query GalponDetalle($id: ID!) {
    galpon(id: $id) {
      id
      codigo
      capacidadAves
      activo
      granjaId
    }
    lotes {
      id
      galponId
      codigo
      raza
      fechaIngreso
      cantidadAves
      estado
      etapa
      avesActuales
      porcentajeMortalidad
    }
  }
`;

export default function GalponDetalle() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(GALPON_DETALLE_QUERY, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  if (loading) return <div className="card text-center py-12 text-gray-500">Cargando galpón...</div>;
  if (error) return <div className="card text-red-600 p-4">Error: {error.message}</div>;

  const galpon = data?.galpon;
  if (!galpon) return <div className="card text-center py-12 text-gray-500">Galpón no encontrado.</div>;

  const misLotes = (data?.lotes ?? []).filter((l) => String(l.galponId) === String(id));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <Link to="/granjas" className="hover:text-brand-600">Granjas</Link>
        <span>/</span>
        <Link to={`/granjas/${galpon.granjaId}`} className="hover:text-brand-600">Granja</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Galpón {galpon.codigo}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-orange-100 text-orange-500 flex items-center justify-center shadow-inner">
            <Home className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-dark tracking-tight">Galpón {galpon.codigo}</h1>
            <p className="text-gray-500 font-medium mt-1">
              Capacidad máxima: <span className="font-bold text-gray-800">{Number(galpon.capacidadAves).toLocaleString()} aves</span>
            </p>
          </div>
        </div>
        <span className={galpon.activo ? "badge-success text-sm px-4 py-1.5" : "badge-danger text-sm px-4 py-1.5"}>
          {galpon.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-dark flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-brand-500" /> Lotes en este galpón
            </h2>
            <p className="text-gray-500 text-sm">Total: {misLotes.length} lotes</p>
          </div>
          <button className="btn-primary">
            <Plus className="w-5 h-5" /> Nuevo lote
          </button>
        </div>

        {misLotes.length === 0 ? (
          <div className="card text-center py-16 text-gray-500">
            <Egg className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            Este galpón aún no tiene lotes. Crea el primero para empezar a registrar aves.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {misLotes.map((l) => (
              <Link
                key={l.id}
                to={`/lotes/${l.id}`}
                className="card hover:border-brand-300 transition-colors group block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Egg className="w-6 h-6" />
                  </div>
                  <span className="badge-info">{l.etapa}</span>
                </div>
                <h3 className="text-xl font-black text-dark group-hover:text-brand-600 transition-colors">Lote {l.codigo}</h3>
                <p className="text-sm text-gray-500 font-bold mb-4">{l.raza}</p>

                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold">Iniciales</p>
                    <p className="font-black text-gray-700">{Number(l.cantidadAves).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold">Actuales</p>
                    <p className="font-black text-brand-600">{l.avesActuales}</p>
                  </div>
                  <div className="col-span-2 mt-1 border-t border-gray-200 pt-1 flex justify-between">
                    <span className="text-gray-500">Mortalidad:</span>
                    <span className={`font-bold ${l.porcentajeMortalidad > 5 ? "text-red-500" : "text-gray-700"}`}>{l.porcentajeMortalidad}%</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-brand-500 font-bold text-sm">
                  <span>Ver detalle del lote</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}