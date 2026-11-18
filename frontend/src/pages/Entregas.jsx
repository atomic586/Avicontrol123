import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Truck, ArrowRight, Phone, MapPin } from "lucide-react";

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
  { value: "pendiente", label: "Pendiente", color: "badge-warning" },
  { value: "preparando", label: "Preparando", color: "badge-info" },
  { value: "en_ruta", label: "En Ruta", color: "bg-blue-100 text-blue-800" },
  { value: "entregado", label: "Entregado", color: "badge-success" },
];

export default function Entregas() {
  const { data, loading, error, refetch } = useQuery(PEDIDOS_PARA_ENTREGA, { fetchPolicy: "network-only" });
  const [cambiarEstado] = useMutation(CAMBIAR_ESTADO_ENTREGA);

  const handleCambiar = async (id, nuevoEstado) => {
    try {
      await cambiarEstado({ variables: { id, estadoEntrega: nuevoEstado } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="card text-center py-12 text-gray-500">Cargando entregas...</div>;
  if (error) return <div className="card bg-red-50 text-red-700 p-4">Error: {error.message}</div>;

  const pedidos = data?.pedidos || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
          <Truck className="w-8 h-8 text-brand-500" /> Entregas
        </h1>
        <p className="text-gray-500 text-base mt-1 font-medium">Gestiona el envío y la distribución de pedidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ESTADOS.map((estadoCol) => (
          <div key={estadoCol.value} className="card bg-gray-50 p-4 border-t-4 border-brand-500">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${estadoCol.color}`}>
              {estadoCol.label} ({pedidos.filter(p => p.estadoEntrega === estadoCol.value).length})
            </div>
            <div className="space-y-3">
              {pedidos.filter(p => p.estadoEntrega === estadoCol.value).map((p) => (
                <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <p className="font-bold text-sm text-dark">{p.cliente.nombres} {p.cliente.apellidos}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Phone className="w-3 h-3" /> {p.cliente.telefono}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mb-2">
                    <MapPin className="w-3 h-3" /> {p.cliente.direccion || "Sin dirección"}
                  </div>
                  <p className="text-xs font-bold text-brand-700 mb-2">Pedido #{p.id} - Bs. {parseFloat(p.total).toFixed(2)}</p>
                  <div className="flex gap-1 flex-wrap">
                    {ESTADOS.filter(e => e.value !== p.estadoEntrega).map(e => (
                      <button
                        key={e.value}
                        onClick={() => handleCambiar(p.id, e.value)}
                        className="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" /> {e.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}