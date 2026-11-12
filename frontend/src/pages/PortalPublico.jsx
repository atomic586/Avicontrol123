import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Building2 } from "lucide-react";
import LayoutPublico from "../components/LayoutPublico";

const GRANJAS_PUBLICAS = gql`
  query GranjasPublicas {
    granjas {
      id
      codigo
      nombre
      ubicacion
    }
  }
`;

const CONFIG_QUERY = gql`
  query ConfigPublica($granjaId: ID) {
    configuracionTienda {
      heroTitulo
      heroSubtitulo
      heroCtaTexto
      heroImagenUrl
      telefonoContacto
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
  const { data: dataGranjas } = useQuery(GRANJAS_PUBLICAS, { fetchPolicy: "network-only" });
  const { data: dataConfig } = useQuery(CONFIG_QUERY, { fetchPolicy: "network-only" });
  const { data: dataProductos, loading } = useQuery(CATALOGO_PUBLICO, { fetchPolicy: "network-only" });

  const granjas = dataGranjas?.granjas ?? [];
  const granjaPrincipal = granjas[0];

  const c = dataConfig?.configuracionTienda;
  const productos = (dataProductos?.productos ?? []).filter((p) => parseFloat(p.stock) > 0);
  const productosHuevo = productos.filter((p) => p.tipo === "huevo");
  const productosAbono = productos.filter((p) => p.tipo === "abono");
  const productosOtros = productos.filter((p) => p.tipo !== "huevo" && p.tipo !== "abono");

  return (
    <LayoutPublico>
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-3">
            {granjaPrincipal?.nombre || "Granja Avícola AVICONTROL"}
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

      {granjas.length > 1 && (
        <section className="bg-brand-50 border-b border-brand-100">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3 flex-wrap">
            <Building2 className="w-5 h-5 text-brand-700" />
            <p className="text-sm font-bold text-brand-700">Granjas disponibles:</p>
            {granjas.map((g) => (
              <span key={g.id} className="badge-info">
                {g.codigo} — {g.nombre}
              </span>
            ))}
          </div>
        </section>
      )}

      <section id="catalogo" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-dark mb-2">Catálogo de productos</h2>
        <p className="text-gray-500 mb-8">Productos disponibles para pedido</p>

        {loading ? (
          <p className="text-gray-500">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No hay productos disponibles ahora.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {productosHuevo.length > 0 && (
              <div>
                <h3 className="text-2xl font-black text-dark mb-4 flex items-center gap-2">
                  🥚 Huevos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productosHuevo.map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>
              </div>
            )}

            {productosAbono.length > 0 && (
              <div>
                <h3 className="text-2xl font-black text-dark mb-4 flex items-center gap-2">
                  🌱 Abono (gallinaza)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productosAbono.map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>
              </div>
            )}

            {productosOtros.length > 0 && (
              <div>
                <h3 className="text-2xl font-black text-dark mb-4 flex items-center gap-2">
                  📦 Otros productos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productosOtros.map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 bg-white rounded-2xl my-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🥚</div>
            <h3 className="text-lg font-black text-dark mb-1">Calidad garantizada</h3>
            <p className="text-gray-500 text-sm">Huevos y abono seleccionados con los más altos estándares.</p>
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

function ProductCard({ producto: p }) {
  const esAbono = p.tipo === "abono";
  return (
    <div className="card hover:border-brand-200 transition">
      <div className="flex items-center justify-between mb-3">
        <span className={esAbono ? "badge-success" : "badge-warning"}>
          {esAbono ? "🌱 Abono" : "🥚 Huevo"} · {p.calidad}
        </span>
        <span className="text-xs text-gray-400 font-bold">
          Stock: {parseFloat(p.stock).toFixed(0)} {p.unidadMedida}
        </span>
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
  );
}