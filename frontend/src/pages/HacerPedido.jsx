import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react";
import { CATALOGO_PUBLICO } from "../graphql/pedido_cliente";
import { PRODUCTOS_GALLINAZA_QUERY } from "../graphql/abono";
import { useClienteAuth } from "../auth/ClienteAuthContext";
import LayoutPublico from "../components/LayoutPublico";

const GRANJAS_PUBLICAS = gql`
  query GranjasPublicas {
    granjas { id codigo nombre activo }
  }
`;

const CREAR_PEDIDO_CLIENTE = gql`
  mutation CrearPedidoCliente(
    $granjaId: ID
    $huevos: [DetalleInput!]
    $abono: [LineaAbonoPedidoInput!]
    $nombres: String
    $apellidos: String
    $dni: String
    $telefono: String
    $email: String
    $direccion: String
  ) {
    crearPedidoCliente(
      granjaId: $granjaId
      huevos: $huevos
      abono: $abono
      nombres: $nombres
      apellidos: $apellidos
      dni: $dni
      telefono: $telefono
      email: $email
      direccion: $direccion
    ) {
      pedidoHuevos { id estado total }
      pedidoAbono { id numero estado total }
      total
    }
  }
`;

export default function HacerPedido() {
  const { cliente } = useClienteAuth();
  const [granjaSeleccionada, setGranjaSeleccionada] = useState("");

  const { data: dataGranjas } = useQuery(GRANJAS_PUBLICAS, { fetchPolicy: "cache-first" });
  const { data: dataProductos, loading } = useQuery(CATALOGO_PUBLICO, { fetchPolicy: "network-only" });
  const granjasActivas = (dataGranjas?.granjas ?? []).filter((g) => g.activo);
  const granjaId = cliente?.granjaId || granjaSeleccionada || granjasActivas[0]?.id;
  const granja = granjasActivas.find((g) => g.id === granjaId);
  const { data: dataAbono, loading: cargandoAbono } = useQuery(PRODUCTOS_GALLINAZA_QUERY, {
    variables: { soloActivos: true, granjaId },
    skip: !granjaId,
    fetchPolicy: "network-only",
  });

  const [crearPedido, { loading: guardando }] = useMutation(CREAR_PEDIDO_CLIENTE);

  const [carrito, setCarrito] = useState({});
  const [datosInvitado, setDatosInvitado] = useState({
    nombres: "",
    apellidos: "",
    dni: "",
    telefono: "",
    email: "",
    direccion: "",
  });
  const [error, setError] = useState("");
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [unidadesAbono, setUnidadesAbono] = useState({});

  const huevos = (dataProductos?.productos ?? [])
    .filter((p) => p.tipo === "huevo" && p.granjaId === granjaId && parseFloat(p.stock) > 0)
    .map((p) => ({
      ...p, cartId: `huevo-${p.id}`, productoId: p.id, categoria: "huevo",
      precio: parseFloat(p.precioUnitario), stockVisible: parseFloat(p.stock), unidadVisible: p.unidadMedida,
      presentacionVisible: p.presentacion.replaceAll("_", " "),
    }));
  const abonos = (dataAbono?.productosGallinaza ?? [])
    .filter((p) => parseFloat(p.stockActualKg) > 0)
    .map((p) => {
      const unidad = unidadesAbono[p.id] || "kg";
      const precios = { kg: p.precioKg, bulto: p.precioBulto, tonelada: p.precioTonelada };
      return {
        ...p, cartId: `abono-${p.id}`, productoId: p.id, categoria: "abono", unidad,
        calidad: p.tipo === "en_tratamiento" ? "En tratamiento" : p.tipo === "listo" ? "Listo para vender" : p.tipo[0].toUpperCase() + p.tipo.slice(1),
        precio: parseFloat(precios[unidad]), stockVisible: parseFloat(p.stockActualKg),
        unidadVisible: "kg disponibles", presentacionVisible: `Venta por ${unidad}`,
      };
    });
  const productos = [...huevos, ...abonos];

  const cambiar = (productoId, delta) => {
    setCarrito((prev) => {
      const actual = prev[productoId] || 0;
      const nuevo = Math.max(0, actual + delta);
      const copia = { ...prev };
      if (nuevo === 0) delete copia[productoId];
      else copia[productoId] = nuevo;
      return copia;
    });
  };

  const total = Object.entries(carrito).reduce((acc, [id, cant]) => {
    const prod = productos.find((p) => p.cartId === id);
    return acc + (prod ? prod.precio * cant : 0);
  }, 0);

  const items = Object.entries(carrito);

  const renderProducto = (p) => {
    const cant = carrito[p.cartId] || 0;
    const esAbono = p.categoria === "abono";
    return (
      <div key={p.cartId} className="card flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={esAbono ? "badge-success" : "badge-warning"}>{esAbono ? "🌱 Abono" : "🥚 Huevo"}</span>
            {p.calidad && <span className="text-xs text-gray-500">{p.calidad}</span>}
          </div>
          <h3 className="font-bold text-dark">{p.nombre}</h3>
          <p className="text-sm text-gray-500">{p.presentacionVisible} · Stock: {p.stockVisible.toFixed(2)} {p.unidadVisible}</p>
          <p className="text-lg font-black text-brand-700 mt-1">Bs. {p.precio.toFixed(2)} / {esAbono ? p.unidad : p.unidadVisible}</p>
          {esAbono && (
            <select className="input-field mt-2 max-w-xs" value={p.unidad} onChange={(e) => setUnidadesAbono((prev) => ({ ...prev, [p.id]: e.target.value }))} aria-label={`Unidad para ${p.nombre}`}>
              <option value="kg">Kilogramo</option>
              <option value="bulto">Bulto (50 kg)</option>
              <option value="tonelada">Tonelada</option>
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => cambiar(p.cartId, -1)} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 font-black text-lg">−</button>
          <span className="w-10 text-center font-black">{cant}</span>
          <button type="button" onClick={() => cambiar(p.cartId, 1)} className="w-9 h-9 rounded-lg bg-brand-100 hover:bg-brand-200 font-black text-lg">+</button>
        </div>
      </div>
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    try {
      if (!cliente && !granjaId) {
        setError("No hay una granja disponible para recibir pedidos.");
        return;
      }
      if (!cliente) {
        if (!datosInvitado.nombres || !datosInvitado.apellidos || !datosInvitado.dni || !datosInvitado.telefono) {
          setError("Completa tus datos de contacto.");
          return;
        }
      }

      const { data: dp } = await crearPedido({
        variables: {
          granjaId,
          huevos: items.flatMap(([cartId, cantidad]) => {
            const producto = productos.find((p) => p.cartId === cartId);
            return producto?.categoria === "huevo" ? [{ productoId: producto.productoId, cantidad }] : [];
          }),
          abono: items.flatMap(([cartId, cantidad]) => {
            const producto = productos.find((p) => p.cartId === cartId);
            return producto?.categoria === "abono" ? [{ productoId: producto.productoId, unidadVendida: producto.unidad, cantidad }] : [];
          }),
          nombres: cliente ? null : datosInvitado.nombres,
          apellidos: cliente ? null : datosInvitado.apellidos,
          dni: cliente ? null : datosInvitado.dni,
          telefono: cliente ? null : datosInvitado.telefono,
          email: cliente ? null : datosInvitado.email || null,
          direccion: cliente ? null : datosInvitado.direccion || "",
        },
      });
      setPedidoCreado(dp.crearPedidoCliente);
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
            {pedidoCreado.pedidoHuevos && <>Pedido de huevos <strong>#{pedidoCreado.pedidoHuevos.id}</strong>. </>}
            {pedidoCreado.pedidoAbono && <>Pedido de abono <strong>#{pedidoCreado.pedidoAbono.numero}</strong>. </>}
            Total: <strong>Bs. {parseFloat(pedidoCreado.total).toFixed(2)}</strong>. Recibimos tu solicitud y coordinaremos la entrega.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary">Volver al inicio</Link>
            {!cliente && (
              <Link to="/registro" className="btn-primary">Crear mi cuenta</Link>
            )}
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
        <h1 className="text-3xl font-black text-dark mb-1 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-brand-500" /> Hacer un pedido
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {cliente ? `Pedido como ${cliente.nombres}` : "Puedes pedir como invitado o crear una cuenta después"}
        </p>

        {!cliente && granjasActivas.length > 1 && (
          <div className="max-w-lg mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Granja de tu pedido</label>
            <select className="input-field" value={granjaId || ""} onChange={(e) => { setGranjaSeleccionada(e.target.value); setCarrito({}); }}>
              {granjasActivas.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
        )}
        {cliente && granja && <p className="text-sm text-gray-500 mb-5">Productos de: <strong>{granja.nombre}</strong></p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-dark">1. Elige tus productos</h2>
            {loading || cargandoAbono ? (
              <p className="text-gray-500">Cargando...</p>
            ) : (
              <div className="space-y-5">
                <section className="space-y-3">
                  <h3 className="text-lg font-black text-dark">Huevos</h3>
                  {huevos.length ? huevos.map(renderProducto) : <p className="text-sm text-gray-500">No hay huevos disponibles en esta granja.</p>}
                </section>
                <section className="space-y-3">
                  <h3 className="text-lg font-black text-dark">Abono</h3>
                  {abonos.length ? abonos.map(renderProducto) : <p className="card py-6 text-center text-sm text-gray-500">No hay abono con existencias disponibles en esta granja. El administrador debe registrar una entrada de stock en kilogramos para el producto.</p>}
                </section>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-xl font-black text-dark mb-4">Tu pedido</h2>
              {items.length === 0 ? (
                <p className="text-sm text-gray-500">Carrito vacío</p>
              ) : (
                <ul className="space-y-2 mb-4 text-sm">
                  {items.map(([id, cant]) => {
                    const prod = productos.find((p) => p.cartId === id);
                    if (!prod) return null;
                    return (
                      <li key={id} className="flex justify-between">
                        <span>{cant}× {prod.nombre}{prod.categoria === "abono" ? ` (${prod.unidad})` : ""}</span>
                        <span className="font-bold">
                          Bs. {(prod.precio * cant).toFixed(2)}
                        </span>
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
                      <input
                        className="input-field"
                        placeholder="Nombres *"
                        value={datosInvitado.nombres}
                        onChange={(e) => setDatosInvitado({ ...datosInvitado, nombres: e.target.value })}
                        required
                      />
                      <input
                        className="input-field"
                        placeholder="Apellidos *"
                        value={datosInvitado.apellidos}
                        onChange={(e) => setDatosInvitado({ ...datosInvitado, apellidos: e.target.value })}
                        required
                      />
                    </div>
                    <input
                      className="input-field"
                      placeholder="DNI *"
                      value={datosInvitado.dni}
                      onChange={(e) => setDatosInvitado({ ...datosInvitado, dni: e.target.value })}
                      required
                    />
                    <input
                      className="input-field"
                      placeholder="Teléfono *"
                      value={datosInvitado.telefono}
                      onChange={(e) => setDatosInvitado({ ...datosInvitado, telefono: e.target.value })}
                      required
                    />
                    <input
                      className="input-field"
                      placeholder="Email (opcional)"
                      type="email"
                      value={datosInvitado.email}
                      onChange={(e) => setDatosInvitado({ ...datosInvitado, email: e.target.value })}
                    />
                    <input
                      className="input-field"
                      placeholder="Dirección (opcional)"
                      value={datosInvitado.direccion}
                      onChange={(e) => setDatosInvitado({ ...datosInvitado, direccion: e.target.value })}
                    />
                  </>
                )}
                {error && (
                  <div className="bg-red-50 text-red-700 text-sm p-2 rounded border border-red-200">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={guardando || items.length === 0}
                  className="btn-primary w-full"
                >
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
