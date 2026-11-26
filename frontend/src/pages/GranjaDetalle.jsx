import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { mediaUrl } from "../utils/media";
import { gql } from "@apollo/client";
import {
  Home, Users, Egg, Settings, ShoppingCart, LayoutDashboard,
  MapPin, Phone, Mail, Building2, PowerOff, Power,
  Calendar, TrendingUp, AlertCircle, ChevronRight, Pencil
} from "lucide-react";
import { CAMBIAR_ESTADO_GRANJA } from "../graphql/granjas";
import { useAuth } from "../auth/AuthContext";
import HuevoMascota from "../components/HuevoMascota";
import ProduccionChart from "../components/ProduccionChart";
import FilterBar from "../components/FilterBar";
import ModalCrearGranja from "../components/ModalCrearGranja";

const GRANJA_DETALLE_QUERY = gql`
  query GranjaDetalle($id: ID!) {
    granja(id: $id) {
      id
      nombre
      codigo
      razonSocial
      nit
      propietario
      ubicacion
      telefono
      email
      activo
      creadoEn
      logoFinal
      heroFinal
    }
    estadisticasGranja(id: $id) {
      totalGalpones
      totalLotes
      totalUsuarios
      totalClientes
      produccionMesHuevos
      ingresosMes
    }
    produccionDiariaGranja(granjaId: $id, dias: 30) {
      fecha
      total
    }
    usuariosGranja(id: $id) {
      id
      username
      nombres
      apellidos
      email
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
    lotesGranja(granjaId: $id) {
      id
      galponId
      codigo
      raza
      etapa
      avesActuales
      porcentajeMortalidad
      fechaIngreso
    }
    ventasRecientesGranja(granjaId: $id, limit: 20) {
      id
      fecha
      montoTotal
      formaPago
      pedido {
        id
        cliente { nombres apellidos }
      }
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
  const { cerrarSesion, esSuperadmin } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [editando, setEditando] = useState(false);

  // Filtros de lotes
  const [busquedaLote, setBusquedaLote] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [filtroGalpon, setFiltroGalpon] = useState("");

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
    if (!window.confirm(`¿Seguro que quieres ${verbo} la granja "${g.nombre}"?`)) return;
    try {
      await cambiarEstadoGranja({ variables: { id: g.id, activo: nuevoEstado } });
      refetch();
    } catch (err) {
      alert(`Error al ${verbo} la granja: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <HuevoMascota phase="loading" />
        <p className="text-gray-500 dark:text-gray-400 font-bold mt-6">Cargando granja...</p>
      </div>
    );
  }

  if (error) {
    const mensajes = [...new Set(
      error.message.split("\n").map((mensaje) => mensaje.trim()).filter(Boolean)
    )];
    const esPermiso = mensajes.some((mensaje) => /permiso|superadministrador|autenticad/i.test(mensaje));
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
        <p className="font-bold mb-2">Error al cargar la granja:</p>
        <p className="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded border border-red-200 dark:border-red-800">{mensajes[0]}</p>
        {mensajes.length > 1 && (
          <p className="text-xs mt-1">Se omitieron {mensajes.length - 1} mensajes repetidos.</p>
        )}
        {esPermiso && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm">
              Cierra sesión y vuelve a entrar con una cuenta con rol de superadministrador o administrador de esta granja.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                cerrarSesion();
                navigate("/login", { replace: true });
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
        <Link to="/granjas" className="btn-secondary mt-4 inline-flex">Volver a granjas</Link>
      </div>
    );
  }

  const g = data?.granja;
  const stats = data?.estadisticasGranja;
  const usuarios = data?.usuariosGranja ?? [];
  const galpones = data?.galponesGranja ?? [];
  const produccion = data?.produccionDiariaGranja ?? [];
  const lotes = data?.lotesGranja ?? [];
  const ventas = data?.ventasRecientesGranja ?? [];

  if (!g) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Granja no encontrada.</p>
        <Link to="/granjas" className="btn-secondary mt-4 inline-flex">Volver a granjas</Link>
      </div>
    );
  }

  // Lotes filtrados
  const lotesFiltrados = lotes.filter((l) => {
    const coincideBusqueda =
      l.codigo.toLowerCase().includes(busquedaLote.toLowerCase()) ||
      l.raza.toLowerCase().includes(busquedaLote.toLowerCase());
    const coincideEtapa = filtroEtapa === "todos" || l.etapa === filtroEtapa;
    const coincideGalpon = !filtroGalpon || String(l.galponId) === String(filtroGalpon);
    return coincideBusqueda && coincideEtapa && coincideGalpon;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <Link to="/dashboard" className="hover:text-orange-600 flex items-center gap-1"><Home className="w-4 h-4"/> Inicio</Link>
        <span>/</span>
        <Link to="/granjas" className="hover:text-orange-600">Granjas</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-bold">{g.nombre}</span>
      </div>

      {/* HERO CON IMAGEN Y DIFUMINADO */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        <div className="h-64 sm:h-80 w-full relative bg-gray-900">
          {g.heroFinal ? (
            <img src={mediaUrl(g.heroFinal)} alt={g.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-900"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-5">
              {/* ✅ LOGO EN EL HERO */}
              {g.logoFinal && (
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  <img
                    src={mediaUrl(g.logoFinal)}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}

              <div className="text-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                    g.activo ? "bg-green-500/20 text-green-100 border-green-400/30" : "bg-red-500/20 text-red-100 border-red-400/30"
                  }`}>
                    {g.activo ? "Activa" : "Suspendida"}
                  </span>
                  <span className="text-white/80 font-medium text-sm flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> Código: {g.codigo}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-lg">{g.nombre}</h1>
              </div>
            </div>

            {esSuperadmin && (
              <button
                onClick={toggleEstado}
                disabled={cambiandoEstado}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors backdrop-blur-md border ${
                  g.activo
                    ? "bg-white/10 text-white border-white/30 hover:bg-white/20"
                    : "bg-green-500/80 text-white border-green-400 hover:bg-green-500"
                }`}
              >
                {g.activo ? <><PowerOff className="w-4 h-4" /> Suspender</> : <><Power className="w-4 h-4" /> Activar</>}
              </button>
            )}
          </div>
        </div>

        <div className="px-6 sm:px-10 py-5 bg-white dark:bg-gray-800 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
          {g.razonSocial && (
            <span className="flex items-center gap-2 font-medium">
              <Building2 className="w-4 h-4 text-orange-500" /> {g.razonSocial} {g.nit && `(NIT: ${g.nit})`}
            </span>
          )}
          <span className="flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4 text-orange-500" /> {g.ubicacion}
          </span>
          {g.telefono && (
            <span className="flex items-center gap-2 font-medium">
              <Phone className="w-4 h-4 text-orange-500" /> {g.telefono}
            </span>
          )}
          {g.email && (
            <span className="flex items-center gap-2 font-medium">
              <Mail className="w-4 h-4 text-orange-500" /> {g.email}
            </span>
          )}
          <span className="flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-orange-500" /> Creada el {new Date(g.creadoEn).toLocaleDateString("es-BO")}
          </span>
        </div>
      </div>

      {/* BANNER SUSPENDIDA */}
      {!g.activo && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300 shadow-sm">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-black">Granja suspendida</p>
            <p className="text-sm mt-1">
              Los usuarios de esta granja no pueden iniciar sesión y sus clientes no
              pueden acceder al portal. Los datos se conservan y puedes reactivarla en cualquier momento.
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {[
          { key: "resumen", label: "Resumen", icon: LayoutDashboard },
          { key: "galpones", label: `Galpones (${galpones.length})`, icon: Home },
          { key: "lotes", label: `Lotes (${lotes.length})`, icon: Egg },
          { key: "usuarios", label: `Usuarios (${usuarios.length})`, icon: Users },
          { key: "ventas", label: "Ventas", icon: ShoppingCart },
          { key: "config", label: "Configuración", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                active
                  ? "bg-dark text-white dark:bg-white dark:text-dark shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-white dark:text-dark" : "text-gray-400"}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO: RESUMEN */}
      {tab === "resumen" && stats && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Galpones</p>
              </div>
              <p className="text-4xl font-black text-dark dark:text-white">{stats.totalGalpones}</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-bold mt-1">Operativos</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                  <Egg className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lotes Activos</p>
              </div>
              <p className="text-4xl font-black text-dark dark:text-white">{stats.totalLotes}</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-bold mt-1">En producción</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                  <Egg className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Huevos del Mes</p>
              </div>
              <p className="text-4xl font-black text-orange-600">{Number(stats.produccionMesHuevos).toLocaleString()}</p>
              <p className="text-sm text-gray-400 font-bold mt-1">Producción</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingresos del Mes</p>
              </div>
              <p className="text-3xl font-black text-green-600">Bs. {Number(stats.ingresosMes).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-400 font-bold mt-1">Facturación</p>
            </div>
          </div>

          <ProduccionChart
            data={produccion.map(p => ({
              fecha: new Date(p.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short" }),
              huevos: p.total,
            }))}
            loading={loading}
          />
        </div>
      )}

      {/* GALPONES */}
      {tab === "galpones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {galpones.length === 0 ? (
            <div className="col-span-full card text-center py-12 text-gray-500 dark:text-gray-400">
              Esta granja no tiene galpones registrados.
            </div>
          ) : galpones.map((gal) => (
            <Link
              key={gal.id}
              to={`/galpones/${gal.id}`}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 shadow-soft transition-all block group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                  <Home className="w-6 h-6" />
                </div>
                <span className={gal.activo ? "badge-success" : "badge-danger"}>
                  {gal.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <h3 className="text-xl font-black text-dark dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Galpón {gal.codigo}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-3">
                Capacidad: {Number(gal.capacidadAves).toLocaleString()} aves
              </p>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Aves actuales: <strong>{gal.avesActuales || 0}</strong></span>
                <span className="text-orange-500 font-bold flex items-center gap-1">
                  Ver lotes <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LOTES CON FILTROS */}
      {tab === "lotes" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <FilterBar
                busqueda={busquedaLote}
                setBusqueda={setBusquedaLote}
                filtros={[
                  { label: "Todos", value: "todos" },
                  { label: "Cría", value: "cria" },
                  { label: "Recría", value: "recria" },
                  { label: "Postura", value: "postura" },
                  { label: "Descarte", value: "descarte" },
                ]}
                filtroActivo={filtroEtapa}
                setFiltroActivo={setFiltroEtapa}
                placeholder="Buscar por código o raza..."
              />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Galpón
              </label>
              <select
                value={filtroGalpon}
                onChange={(e) => setFiltroGalpon(e.target.value)}
                className="input-field"
              >
                <option value="">Todos los galpones</option>
                {galpones.map((gal) => (
                  <option key={gal.id} value={gal.id}>Galpón {gal.codigo}</option>
                ))}
              </select>
            </div>
          </div>

          {lotesFiltrados.length === 0 ? (
            <div className="card text-center py-16 text-gray-500 dark:text-gray-400">
              <Egg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              No hay lotes que coincidan con los filtros.
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left p-4 font-bold">Lote</th>
                      <th className="text-left p-4 font-bold">Raza</th>
                      <th className="text-left p-4 font-bold">Galpón</th>
                      <th className="text-left p-4 font-bold">Etapa</th>
                      <th className="text-right p-4 font-bold">Aves</th>
                      <th className="text-right p-4 font-bold">Mortalidad</th>
                      <th className="text-right p-4 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotesFiltrados.map((l) => (
                      <tr key={l.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                        <td className="p-4 font-bold text-dark dark:text-white">{l.codigo}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{l.raza}</td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">
                          {galpones.find((gal) => gal.id === l.galponId)?.codigo || "—"}
                        </td>
                        <td className="p-4">
                          <span className="badge-info uppercase">{l.etapa}</span>
                        </td>
                        <td className="p-4 text-right font-bold text-orange-600">
                          {l.avesActuales?.toLocaleString() || 0}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${
                            l.porcentajeMortalidad > 5 ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                          }`}>
                            {l.porcentajeMortalidad}%
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            to={`/lotes/${l.id}`}
                            className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline"
                          >
                            Ver <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USUARIOS */}
      {tab === "usuarios" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {usuarios.length === 0 ? (
            <p className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">Esta granja no tiene usuarios asignados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
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
                    <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                      <td className="p-5 font-bold text-dark dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 flex items-center justify-center text-xs">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        {u.username}
                      </td>
                      <td className="p-5 text-gray-700 dark:text-gray-300 font-medium">{u.nombres} {u.apellidos}</td>
                      <td className="p-5 text-gray-500 dark:text-gray-400">{u.email}</td>
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

      {/* VENTAS */}
      {tab === "ventas" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {ventas.length === 0 ? (
            <div className="card text-center py-16 text-gray-500 dark:text-gray-400">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              Esta granja aún no tiene ventas registradas.
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left p-4 font-bold">Fecha</th>
                      <th className="text-left p-4 font-bold">Cliente</th>
                      <th className="text-left p-4 font-bold">Forma de Pago</th>
                      <th className="text-right p-4 font-bold">Monto</th>
                      <th className="text-right p-4 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <tr key={v.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                        <td className="p-4 text-gray-700 dark:text-gray-300">
                          {new Date(v.fecha).toLocaleDateString("es-BO")}
                        </td>
                        <td className="p-4 font-bold text-dark dark:text-white">
                          {v.pedido?.cliente
                            ? `${v.pedido.cliente.nombres} ${v.pedido.cliente.apellidos}`
                            : "—"}
                        </td>
                        <td className="p-4">
                          <span className="badge-info uppercase">{v.formaPago}</span>
                        </td>
                        <td className="p-4 text-right font-black text-green-600">
                          Bs. {Number(v.montoTotal).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            to={`/pedidos/${v.pedido?.id}`}
                            className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline"
                          >
                            Ver pedido <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIGURACIÓN */}
      {tab === "config" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-2xl font-black text-dark dark:text-white mb-2 flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-500" /> Configuración de la Granja
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Edita los datos comerciales, la identidad visual y la información de contacto.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Razón Social</p>
              <p className="font-bold text-dark dark:text-white mt-1">{g.razonSocial || "—"}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">NIT</p>
              <p className="font-bold text-dark dark:text-white mt-1">{g.nit || "—"}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Propietario</p>
              <p className="font-bold text-dark dark:text-white mt-1">{g.propietario || "—"}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Código</p>
              <p className="font-bold text-dark dark:text-white mt-1">{g.codigo}</p>
            </div>
          </div>

          <button
            onClick={() => setEditando(true)}
            className="btn-primary"
          >
            <Pencil className="w-5 h-5" /> Editar Granja
          </button>
        </div>
      )}

      {/* MODAL EDITAR */}
      <ModalCrearGranja
        open={editando}
        onClose={() => setEditando(false)}
        granjaEditando={g}
        onSuccess={() => refetch()}
      />
    </div>
  );
}