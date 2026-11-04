import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { ShoppingCart, ArrowLeft, LogOut } from "lucide-react";
import { useClienteAuth } from "../auth/ClienteAuthContext";
import { MIS_PEDIDOS } from "../graphql/cliente_auth";
import LayoutPublico from "../components/LayoutPublico";

export default function MisPedidos() {
  const { cliente, cargando } = useClienteAuth();
  const { data, loading } = useQuery(MIS_PEDIDOS, {
    skip: !cliente,
    fetchPolicy: "network-only",
  });

  if (cargando) return <p className="p-10 text-center">Cargando...</p>;
  if (!cliente) return <Navigate to="/login" replace />;

  const pedidos = data?.misPedidos ?? [];

  return (
    <LayoutPublico>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-dark mb-2">Mis pedidos</h1>
        <p className="text-gray-500 mb-6">Hola, {cliente.nombres} {cliente.apellidos}</p>

        <Link to="/hacer-pedido" className="btn-primary mb-6 inline-flex">
          <ShoppingCart className="w-4 h-4" /> Hacer un pedido
        </Link>

        {loading ? <p>Cargando...</p> : pedidos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Aún no tienes pedidos.</p>
            <Link to="/hacer-pedido" className="btn-primary mt-4 inline-flex">Hacer mi primer pedido</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map(p => (
              <div key={p.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-black text-dark">Pedido #{p.id}</p>
                    <p className="text-sm text-gray-500">{new Date(p.fechaPedido).toLocaleDateString("es-BO")}</p>
                  </div>
                  <span className={`badge-${p.estado === "entregado" ? "success" : p.estado === "anulado" ? "danger" : "warning"}`}>
                    {p.estado}
                  </span>
                </div>
                <p className="text-2xl font-black text-brand-700">Bs. {parseFloat(p.total).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutPublico>
  );
}