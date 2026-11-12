import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import LayoutPublico from "../components/LayoutPublico";

const CONFIG_QUERY = gql`
  query ConfigPublica {
    configuracionTienda {
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      telefonoContacto
    }
    granjaActual {
      id
      nombre
      codigo
    }
  }
`;

const CATALOGO_PUBLICO = gql`
  query CatalogoPublico {
    productos(soloActivos: true) {
      id
      nombre
      tipo
      presentacion
      calidad
      unidadMedida
      precioUnitario
      stock
    }
  }
`;

export default function PortalPublico() {
  const { data: dataConfig } = useQuery(CONFIG_QUERY, { fetchPolicy: "cache-first" });
  const { data: dataProductos, loading } = useQuery(CATALOGO_PUBLICO, { fetchPolicy: "network-only" });

  const c = dataConfig?.configuracionTienda;
  const g = dataConfig?.granjaActual;
  const productos = (dataProductos?.productos ?? []).filter((p) => parseFloat(p.stock) > 0);

  return (
    <LayoutPublico>
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-3">
            {g?.nombre || "Granja Avícola AVICONTROL"}
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 max-w-3xl">
            {c?.heroTitulo || "Huevos frescos para tu hogar."}
          </h1>
          <p className="text-lg opacity-95 max-w-2xl mb-8">
            {c?.heroSubtitulo || "Elige la calidad y la cantidad que necesitas."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/hacer-pedido" className="bg-white text-brand-700 font-black py-3 px-6 rounded-xl text-base hover:bg-brand-50 transition">
              {c?.heroCtaTexto || "Hacer un pedido"}
            </Link>
            <a href="#catalogo" className="border-2 border-white text-white font-bold py-3 px-6 rounded-xl text-base hover:bg-white/10 transition">
              Ver productos
            </a>
          </div>
        </div>
      </section>

      <section id="catalogo" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-dark mb-2">Catálogo de productos</h2>
        <p className="text-gray-500 mb-8">Productos disponibles para pedido</p>

        {loading ? (
          <p className="text-gray-500">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-gray-500">No hay productos disponibles ahora.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((p) => (
              <div key={p.id} className="card hover:border-brand-200 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className={p.tipo === "abono" ? "badge-success" : "badge-warning"}>
                    {p.tipo === "abono" ? "🌱 Abono" : "🥚 Huevo"} · {p.calidad}
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    Stock: {parseFloat(p.stock).toFixed(0)}
                  </span>
                </div>
                <h3 className="text-lg font-black text-dark">{p.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">{p.presentacion.replace("_", " ")}</p>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Precio</p>
                    <p className="text-2xl font-black text-brand-700">
                      Bs. {parseFloat(p.precioUnitario).toFixed(2)}
                    </p>
                  </div>
                  <Link to="/hacer-pedido" className="btn-primary text-sm py-2 px-4">
                    Pedir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </LayoutPublico>
  );
}