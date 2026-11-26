import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  ArrowLeft, Building2, Users, Egg, UserCog, ShoppingCart,
  MapPin, Phone, Mail, CheckCircle, XCircle, Power, PowerOff,
  LayoutDashboard, Home, Calendar, TrendingUp, AlertCircle,
  ChevronRight
} from "lucide-react";
import { CAMBIAR_ESTADO_GRANJA } from "../graphql/granjas";

const GRANJA_DETALLE_QUERY = gql`
  query GranjaDetalle($id: ID!) {
    granja(id: $id) {
      id
      nombre
      codigo
      ubicacion
      telefono
      email
      activo
      creadoEn
    }
    estadisticasGranja(id: $id) {
      totalGalpones
      totalLotes
      totalUsuarios
      totalClientes
      produccionMesHuevos
      ingresosMes
    }
    usuariosGranja(id: $id) {
      id
      username
      email
      nombres
      apellidos
      activo
      roles { codigo nombre }
    }
    galponesGranja(id: $id) {
      id
      codigo
      capacidadAves
      activo
      avesActuales
    }
  }
`;

const ROL_COLOR = {
  superadmin: "badge-danger",
  admin_granja: "badge-warning",
  encargado_ventas: "badge-info",
  encargado_produccion: "badge-success",
  encargado_almacen: "badge-info",
};

export default function GranjaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("resumen");

  const { data, loading, error, refetch } = useQuery(GRANJA_DETALLE_QUERY, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const [cambiarEstadoGranja, { loading: cambiandoEstado }] = useMutation(CAMBIAR_ESTADO_GRANJA);

  const toggleEstado = async () => {
    const g = data?.granja;
    if (!g) return;
    const nuevoEstado = !g.activo;
    const verbo = nuevoEstado ? "activar" : "suspender";
    if (!window.confirm(`¿Seguro que quieres ${verbo} la granja "${g.nombre}"?`)) {
      return;
    }
    try {
      await cambiarEstadoGranja({
        variables: { id: g.id, activo: nuevoEstado },
      });
      refetch();
    } catch (err) {
      alert(`Error al ${verbo} la granja: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="card text-center py-12 text-gray-500">Cargando granja...</div>;
  }
  if (error) {
    return (
      <div className="card bg-red-50 text-red-700 border-red-200">
        <p className="font-bold mb-2">Error al cargar la granja:</p>
        <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{error.message}</p>
      </div>
    );
  }

  const g = data?.granja;
  const stats = data?.estadisticasGranja;
  const usuarios = data?.usuariosGranja ?? [];
  const galpones = data?.galponesGranja ?? [];

  if (!g) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Granja no encontrada.</p>
        <Link to="/granjas" className="btn-secondary mt-4 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver a granjas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <Link to="/dashboard" className="hover:text-brand-600 flex items-center gap-1"><Home className="w-4 h-4"/> Inicio</Link>
        <span>/</span>
        <Link to="/granjas" className="hover:text-brand-600">Granjas</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">{g.nombre}</span>
      </div>

      {/* BANNER PRINCIPAL DE LA GRANJA (Diseño tipo tarjeta grande con foto) */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden relative">
        <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-brand-600 to-brand-400 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-6 pb-6 sm:px-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-4 gap-4">
            
            {/* Logo y Título */}
            <div className="flex items-end gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-brand-500 relative z-10">
                <Building2 className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <div className="pb-1">
                <h1 className="text-3xl sm:text-4xl font-black text-dark tracking-tight">{g.nombre}</h1>
                <p className="text-sm text-gray-500 font-bold mt-1">Código: {g.codigo}</p>
              </div>
            </div>

            {/* Botones de Acción y Estado */}
            <div className="flex items-center gap-3 pb-1 w-full sm:w-auto">
              <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${
                g.activo ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {g.activo ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {g.activo ? "Activa" : "Suspendida"}
              </span>
              
              <button
                onClick={toggleEstado}
                disabled={cambiandoEstado}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border transition-colors disabled:opacity-50 ${
                  g.activo
                    ? "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                    : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                }`}
              >
                {g.activo ? <><PowerOff className="w-5 h-5" /> Suspender</> : <><Power className="w-5 h-5" /> Activar</>}
              </button>
            </div>
          </div>

          {/* Datos de contacto en fila */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
            <span className="flex items-center gap-2 font-medium"><MapPin className="w-4 h-4 text-brand-500" /> {g.ubicacion}</span>
            {g.telefono && <span className="flex items-center gap-2 font-medium"><Phone className="w-4 h-4 text-brand-500" /> {g.telefono}</span>}
            {g.email && <span className="flex items-center gap-2 font-medium"><Mail className="w-4 h-4 text-brand-500" /> {g.email}</span>}
            <span className="flex items-center gap-2 font-medium"><Calendar className="w-4 h-4 text-brand-500" /> Creada el {new Date(g.creadoEn).toLocaleDateString("es-BO")}</span>
          </div>
        </div>
      </div>

      {/* BANNER SI ESTÁ SUSPENDIDA */}
      {!g.activo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 shadow-sm">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-black">Granja suspendida</p>
            <p className="text-sm mt-1">
              Los usuarios de esta granja no pueden iniciar sesión y sus clientes no
              pueden acceder al portal. Los datos se conservan y puedes reactivarla
              en cualquier momento.
            </p>
          </div>
        </div>
      )}

      {/* TABS ESTILO PÍLDORA */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "resumen", label: "Resumen", icon: LayoutDashboard },
          { key: "usuarios", label: `Usuarios (${usuarios.length})`, icon: Users },
          { key: "galpones", label: `Galpones (${galpones.length})`, icon: Home },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                active
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-400"}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DE LA PESTAÑA */}
      {tab === "resumen" && stats && (
        <div className="space-y-6">
          
          {/* TARJETAS KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0">
                <Home className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Galpones</p>
                <p className="text-3xl font-black text-dark leading-none">{stats.totalGalpones}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Activos: {stats.totalGalpones}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Egg className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lotes Activos</p>
                <p className="text-3xl font-black text-dark leading-none">{stats.totalLotes}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">En producción</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-500 flex items-center justify-center flex-shrink-0">
                <UserCog className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Usuarios</p>
                <p className="text-3xl font-black text-dark leading-none">{stats.totalUsuarios}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Registrados</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Clientes</p>
                <p className="text-3xl font-black text-dark leading-none">{stats.totalClientes}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Activos</p>
              </div>
            </div>
          </div>

          {/* TARJETAS DE PRODUCCIÓN E INGRESOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Producción del Mes</p>
                 <p className="text-4xl font-black text-brand-600">{Number(stats.produccionMesHuevos).toLocaleString()} <span className="text-lg text-gray-400 font-bold">huevos</span></p>
               </div>
               <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500">
                 <Egg className="w-8 h-8" />
               </div>
             </div>

             <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos del Mes</p>
                 <p className="text-4xl font-black text-green-600">Bs. {Number(stats.ingresosMes).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</p>
               </div>
               <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                 <TrendingUp className="w-8 h-8" />
               </div>
             </div>
          </div>

          {/* ESPACIO PARA GRÁFICOS */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft text-center py-12">
             <p className="text-gray-400 font-medium mb-2">Gráficos de rendimiento listos para integrar</p>
             <p className="text-sm text-gray-400">(Requiere instalar `recharts`)</p>
          </div>

        </div>
      )}

      {tab === "usuarios" && (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
          {usuarios.length === 0 ? (
            <p className="p-12 text-center text-gray-500 font-medium">Esta granja no tiene usuarios asignados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-5 font-bold">Usuario</th>
                    <th className="text-left p-5 font-bold">Nombre</th>
                    <th className="text-left p-5 font-bold">Email</th>
                    <th className="text-left p-5 font-bold">Rol</th>
                    <th className="text-left p-5 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="p-5 font-bold text-dark flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        {u.username}
                      </td>
                      <td className="p-5 text-gray-700 font-medium">{u.nombres} {u.apellidos}</td>
                      <td className="p-5 text-gray-500">{u.email}</td>
                      <td className="p-5">
                        {u.roles?.length > 0 ? (
                          <span className={ROL_COLOR[u.roles[0].codigo] || "badge-info"}>
                            {u.roles[0].nombre}
                          </span>
                        ) : (
                          <span className="badge-info">Sin rol</span>
                        )}
                      </td>
                      <td className="p-5">
                        <span className={u.activo ? "badge-success" : "badge-danger"}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "galpones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galpones.length === 0 ? (
            <div className="col-span-full card text-center py-12 text-gray-500">
              Esta granja no tiene galpones registrados.
            </div>
          ) : (
            galpones.map((gal) => (
              <Link
                key={gal.id}
                to={`/galpones/${gal.id}`}
                className="card hover:border-brand-300 transition-colors block relative group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Home className="w-6 h-6" />
                  </div>
                  <span className={gal.activo ? "badge-success" : "badge-danger"}>
                    {gal.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-dark group-hover:text-brand-600 transition-colors">
                  Galpón {gal.codigo}
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-3">
                  Capacidad: {Number(gal.capacidadAves).toLocaleString()} aves
                </p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Aves actuales: <strong>{gal.avesActuales || 0}</strong></span>
                  <span className="text-brand-500 font-bold flex items-center gap-1">
                    Ver lotes <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}