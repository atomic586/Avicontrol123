import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { CONFIGURACION_QUERY } from "../graphql/configuracion";
import { CATALOGO_PUBLICO } from "../graphql/pedido_cliente";
import LayoutPublico from "../components/LayoutPublico";

export default function PortalPublico() {
  const { data: dataConfig } = useQuery(CONFIGURACION_QUERY, { fetchPolicy: "cache-first" });
  const { data: dataProductos, loading } = useQuery(CATALOGO_PUBLICO, { fetchPolicy: "network-only" });

  const c = dataConfig?.configuracionTienda;
  const productos = (dataProductos?.productos ?? []).filter(p => p.stock > 0);

  return (
    <LayoutPublico>
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 text-white">
        <div
          className="max-w-6xl mx-auto px-6 py-20"
          style={
            c?.heroImagenUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${c.heroImagenUrl}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: "1rem",
                  marginTop: "1rem",
                }
              : {}
          }
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-3">
            {c?.nombreGranja || "Granja Avícola AVICONTROL"}
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 max-w-3xl">
            {c?.heroTitulo || "Huevos frescos para tu hogar. Maplez para tu negocio."}
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
        <p className="text-gray-500 mb-8">Precios actualizados por maple de 30 huevos</p>

        {loading ? (
          <p className="text-gray-500">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-gray-500">No hay productos disponibles ahora.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map(p => (
              <div key={p.id} className="card hover:border-brand-200 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-warning text-xs uppercase">{p.calidad}</span>
                  <span className="text-xs text-gray-400 font-bold">Stock: {p.stock}</span>
                </div>
                <h3 className="text-lg font-black text-dark">{p.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">{p.presentacion.replace("_", " ")}</p>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Precio</p>
                    <p className="text-2xl font-black text-brand-700">Bs. {parseFloat(p.precioUnitario).toFixed(2)}</p>
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

      <section className="max-w-6xl mx-auto px-6 py-16 bg-white rounded-2xl my-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🥚</div>
            <h3 className="text-lg font-black text-dark mb-1">Calidad garantizada</h3>
            <p className="text-gray-500 text-sm">Huevos de primera, segunda y tercera seleccionados a mano.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="text-lg font-black text-dark mb-1">Entrega local</h3>
            <p className="text-gray-500 text-sm">Coordinamos la entrega directa en tu domicilio o negocio.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📞</div>
            <h3 className="text-lg font-black text-dark mb-1">Atención personal</h3>
            <p className="text-gray-500 text-sm">{c?.telefonoContacto || "Contáctanos para coordinar tu pedido."}</p>
          </div>
        </div>
      </section>
    </LayoutPublico>
  );
}