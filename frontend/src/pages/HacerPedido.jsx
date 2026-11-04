import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { ShoppingCart, Plus, ArrowLeft, CheckCircle } from "lucide-react";
import { CATALOGO_PUBLICO } from "../graphql/pedido_cliente";
import { useClienteAuth } from "../auth/ClienteAuthContext";
import LayoutPublico from "../components/LayoutPublico";

const CREAR_PEDIDO_INVITADO = gql`
  mutation CrearClienteYPedido(
    $nombres: String!, $apellidos: String!, $dni: String!, $telefono: String!,
    $email: String, $fechaPedido: Date!, $detalles: [DetalleInput!]!
  ) {
    crearCliente(
      nombres: $nombres, apellidos: $apellidos, dni: $dni,
      telefono: $telefono, email: $email, direccion: ""
    ) { id }
  }
`;

const CREAR_PEDIDO = gql`
  mutation CrearPedido($clienteId: ID!, $fechaPedido: Date!, $detalles: [DetalleInput!]!) {
    crearPedido(clienteId: $clienteId, fechaPedido: $fechaPedido, detalles: $detalles) {
      id
      estado
      total
    }
  }
`;

export default function HacerPedido() {
  const navigate = useNavigate();
  const { cliente } = useClienteAuth();
  const { data, loading } = useQuery(CATALOGO_PUBLICO, { fetchPolicy: "network-only" });
  const [crearCliente] = useMutation(CREAR_PEDIDO_INVITADO);
  const [crearPedido, { loading: guardando }] = useMutation(CREAR_PEDIDO);

  const [carrito, setCarrito] = useState({});
  const [modo, setModo] = useState(cliente ? "logueado" : "invitado");
  const [datosInvitado, setDatosInvitado] = useState({
    nombres: "", apellidos: "", dni: "", telefono: "", email: "",
  });
  const [error, setError] = useState("");
  const [pedidoCreado, setPedidoCreado] = useState(null);

  const productos = (data?.productos ?? []).filter(p => p.stock > 0);

  const cambiar = (productoId, delta) => {
    setCarrito(prev => {
      const actual = prev[productoId] || 0;
      const nuevo = Math.max(0, actual + delta);
      const copia = { ...prev };
      if (nuevo === 0) delete copia[productoId];
      else copia[productoId] = nuevo;
      return copia;
    });
  };

  const total = Object.entries(carrito).reduce((acc, [id, cant]) => {
    const prod = productos.find(p => p.id === id);
    return acc + (prod ? parseFloat(prod.precioUnitario) * cant : 0);
  }, 0);

  const items = Object.entries(carrito);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) { setError("Agrega al menos un producto."); return; }

    try {
      let clienteId;
      if (modo === "logueado" && cliente) {
        clienteId = cliente.id;
      } else {
        const { data: d } = await crearCliente({
          variables: {
            nombres: datosInvitado.nombres,
            apellidos: datosInvitado.apellidos,
            dni: datosInvitado.dni,
            telefono: datosInvitado.telefono,
            email: datosInvitado.email || null,
            fechaPedido: new Date().toISOString().split("T")[0],
            detalles: [],
          },
        });
        clienteId = d.crearCliente.id;
      }

      const { data: dp } = await crearPedido({
        variables: {
          clienteId,
          fechaPedido: new Date().toISOString().split("T")[0],
          detalles: items.map(([productoId, cantidad]) => ({ productoId, cantidad })),
        },
      });
      setPedidoCreado(dp.crearPedido);
    } catch (err) {
      setError(err.message);
    }
  };

  if (pedidoCreado) {
    return (
      <LayoutPublico>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-dark mb-2">¡Pedido recibido!</h1>
          <p className="text-gray-600 mb-6">
            Tu pedido <strong>#{pedidoCreado.id}</strong> por un total de <strong>Bs. {parseFloat(pedidoCreado.total).toFixed(2)}</strong> fue registrado. Nos pondremos en contacto para coordinar la entrega.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary">Volver al inicio</Link>
            <Link to="/login" className="btn-primary">Crear mi cuenta</Link>
          </div>
        </div>
      </LayoutPublico>
    );
  }

  return (
    <LayoutPublico>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link to="/" className="text-sm font-bold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
        <h1 className="text-3xl font-black text-dark mb-6 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-brand-500" /> Hacer un pedido
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-dark">1. Elige tus productos</h2>
            {loading ? <p className="text-gray-500">Cargando...</p> : (
              productos.map(p => {
                const cant = carrito[p.id] || 0;
                return (
                  <div key={p.id} className="card flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-dark">{p.nombre}</h3>
                      <p className="text-sm text-gray-500">{p.presentacion.replace("_", " ")} · Stock: {p.stock}</p>
                      <p className="text-lg font-black text-brand-700 mt-1">Bs. {parseFloat(p.precioUnitario).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => cambiar(p.id, -1)} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 font-black text-lg">−</button>
                      <span className="w-10 text-center font-black">{cant}</span>
                      <button type="button" onClick={() => cambiar(p.id, 1)} className="w-9 h-9 rounded-lg bg-brand-100 hover:bg-brand-200 font-black text-lg">+</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-xl font-black text-dark mb-4">Tu pedido</h2>
              {items.length === 0 ? <p className="text-sm text-gray-500">Carrito vacío</p> : (
                <ul className="space-y-2 mb-4 text-sm">
                  {items.map(([id, cant]) => {
                    const prod = productos.find(p => p.id === id);
                    if (!prod) return null;
                    return (
                      <li key={id} className="flex justify-between">
                        <span>{cant}× {prod.nombre}</span>
                        <span className="font-bold">Bs. {(parseFloat(prod.precioUnitario) * cant).toFixed(2)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="border-t pt-3 mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
                <p className="text-3xl font-black text-brand-700">Bs. {total.toFixed(2)}</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-3">
                {!cliente && (
                  <>
                    <p className="text-sm font-bold text-gray-700">Datos de contacto</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input-field" placeholder="Nombres" value={datosInvitado.nombres} onChange={(e) => setDatosInvitado({...datosInvitado, nombres: e.target.value})} required />
                      <input className="input-field" placeholder="Apellidos" value={datosInvitado.apellidos} onChange={(e) => setDatosInvitado({...datosInvitado, apellidos: e.target.value})} required />
                    </div>
                    <input className="input-field" placeholder="DNI" value={datosInvitado.dni} onChange={(e) => setDatosInvitado({...datosInvitado, dni: e.target.value})} required />
                    <input className="input-field" placeholder="Teléfono" value={datosInvitado.telefono} onChange={(e) => setDatosInvitado({...datosInvitado, telefono: e.target.value})} required />
                    <input className="input-field" placeholder="Email (opcional)" value={datosInvitado.email} onChange={(e) => setDatosInvitado({...datosInvitado, email: e.target.value})} />
                  </>
                )}
                {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded border border-red-200">{error}</div>}
                <button type="submit" disabled={guardando || items.length === 0} className="btn-primary w-full">
                  {guardando ? "Enviando..." : "Confirmar pedido"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </LayoutPublico>
  );
}