import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useGranja } from "../context/GranjaContext";
import {
  LayoutDashboard, Egg, ShoppingCart, Users,
  Package, DollarSign, LogOut, Menu, Bell, Settings, Building2, Wheat,
  UserCog, Truck, ShoppingBag, BarChart2, Bird, Pill, ChevronDown, Box, Stethoscope
} from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useModulos } from "../hooks/useModulos";

const GRANJAS_QUERY = gql`
  query GranjasParaSelector {
    granjas { id nombre codigo }
  }
`;

export default function Layout({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { granjaActiva, setGranjaActiva } = useGranja();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [produccionOpen, setProduccionOpen] = useState(false);
  const [comercializacionOpen, setComercializacionOpen] = useState(false);
  const [inventarioOpen, setInventarioOpen] = useState(false);

  // Módulos: loading + helper que evita el "salto" del menú al cargar
  const { tieneModulo, loading: loadingModulos } = useModulos();
  const moduloVisible = (codigo) => loadingModulos || tieneModulo(codigo);

  const rutaProduccionActiva =
    location.pathname.startsWith("/produccion") ||
    location.pathname.startsWith("/abono") ||
    location.pathname.startsWith("/aves") ||
    location.pathname.startsWith("/sanidad");

  const rutaComercializacionActiva =
    location.pathname.startsWith("/pedidos") ||
    location.pathname.startsWith("/entregas") ||
    location.pathname.startsWith("/clientes") ||
    location.pathname.startsWith("/ventas") ||
    location.pathname.startsWith("/productos");

  const rutaInventarioActiva =
    location.pathname.startsWith("/insumos") ||
    location.pathname.startsWith("/proveedores") ||
    location.pathname.startsWith("/compras");

  useEffect(() => {
    if (rutaProduccionActiva) setProduccionOpen(true);
    if (rutaComercializacionActiva) setComercializacionOpen(true);
    if (rutaInventarioActiva) setInventarioOpen(true);
  }, [rutaProduccionActiva, rutaComercializacionActiva, rutaInventarioActiva]);

  const handleLogout = () => {
    cerrarSesion();
    navigate("/admin-login", { replace: true });
  };

  const roles = usuario?.roles?.map((r) => r.codigo) || [];
  const esSuperadmin = roles.includes("superadmin");
  const esAdminGranja = roles.includes("admin_granja");
  const esVentas = roles.includes("encargado_ventas");
  const esProduccion = roles.includes("encargado_produccion");
  const esAlmacen = roles.includes("encargado_almacen");
  const esSanidad = roles.includes("encargado_sanidad");

  const rutaHijaActiva = (child) =>
    location.pathname === child.path &&
    (!child.search ||
      location.search === child.search ||
      (!location.search && child.search === "?seccion=produccion"));

  const { data: dataGranjas } = useQuery(GRANJAS_QUERY, { skip: !esSuperadmin });

  const handleGranjaChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setGranjaActiva(null);
    } else {
      const granja = dataGranjas?.granjas?.find((g) => g.id === id);
      setGranjaActiva(granja || null);
    }
  };

  const menuItems = [
    {
      grupo: "General",
      items: [{ name: "Inicio", path: "/dashboard", icon: LayoutDashboard, show: true }],
    },
    {
      grupo: "Producción",
      items: [
        {
          name: "Granjas",
          path: "/granjas",
          icon: Building2,
          show: esSuperadmin || esAdminGranja || esProduccion,
        },
        {
          name: "Producción",
          icon: Egg,
          show: esSuperadmin || esAdminGranja || esProduccion || esSanidad,
          isOpen: produccionOpen,
          setOpen: setProduccionOpen,
          children: [
            { name: "Huevos", path: "/produccion", search: "?seccion=produccion", icon: Egg },
            { name: "Aves", path: "/aves", icon: Bird, show: moduloVisible("aves") },
            {
              name: "Sanidad",
              path: "/sanidad",
              icon: Stethoscope,
              show:
                moduloVisible("sanidad") &&
                (esSuperadmin || esAdminGranja || esSanidad || esProduccion),
            },
            { name: "Abono", path: "/abono", icon: Wheat, show: moduloVisible("abono") },
          ],
        },
      ],
    },
    {
      grupo: "Comercialización",
      items: [
        {
          name: "Comercialización",
          icon: ShoppingCart,
          show: esSuperadmin || esAdminGranja || esVentas,
          isOpen: comercializacionOpen,
          setOpen: setComercializacionOpen,
          children: [
            { name: "Productos", path: "/productos", icon: Box },
            { name: "Pedidos", path: "/pedidos", icon: ShoppingCart },
            { name: "Entregas", path: "/entregas", icon: Truck },
            { name: "Clientes", path: "/clientes", icon: Users },
            { name: "Ventas", path: "/ventas", icon: DollarSign },
          ],
        },
      ],
    },
    {
      grupo: "Inventario",
      items: [
        {
          name: "Insumos",
          icon: Package,
          show: esSuperadmin || esAdminGranja || esAlmacen || esProduccion,
          isOpen: inventarioOpen,
          setOpen: setInventarioOpen,
          children: [
            { name: "Alimentos", path: "/insumos", search: "?tipo=alimento", icon: Wheat },
            { name: "Medicamentos", path: "/insumos", search: "?tipo=medicamento", icon: Pill },
            { name: "Insumos Generales", path: "/insumos", search: "?tipo=general", icon: Package },
          ],
        },
        {
          name: "Proveedores",
          path: "/proveedores",
          icon: Truck,
          show: esSuperadmin || esAdminGranja || esAlmacen,
        },
        {
          name: "Compras",
          path: "/compras",
          icon: ShoppingBag,
          show: esSuperadmin || esAdminGranja || esAlmacen,
        },
      ],
    },
    {
      grupo: "Administración",
      items: [
        {
          name: "Reportes",
          path: "/reportes",
          icon: BarChart2,
          show: (esSuperadmin || esAdminGranja) && moduloVisible("reportes_avanzados"),
        },
        {
          name: "Usuarios",
          path: "/usuarios",
          icon: UserCog,
          show: esSuperadmin || esAdminGranja,
        },
        {
          name: "Configuración",
          path: "/configuracion",
          icon: Settings,
          show: esSuperadmin || esAdminGranja,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-sidebar)] text-white h-screen sticky top-0 z-20 shadow-2xl">

        <div className="h-24 flex flex-col items-center justify-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐔</span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-tight">AVICONTROL</h1>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-center">Sistema Avícola</p>
            </div>
          </div>
        </div>

        {esSuperadmin && (
          <div className="px-4 py-4 border-b border-white/10">
            <label className="text-[10px] font-bold text-white/50 mb-1.5 block uppercase tracking-widest">
              Granja Activa
            </label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm font-medium text-white focus:ring-2 focus:ring-[var(--accent)] outline-none cursor-pointer"
              value={granjaActiva?.id || ""}
              onChange={handleGranjaChange}
            >
              <option value="" className="text-black">Todas las granjas</option>
              {dataGranjas?.granjas?.map((g) => (
                <option key={g.id} value={g.id} className="text-black">
                  {g.codigo} - {g.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {menuItems.map((grupo) => {
            const itemsVisibles = grupo.items.filter((i) => i.show);
            if (itemsVisibles.length === 0) return null;

            return (
              <div key={grupo.grupo}>
                <p className="px-3 text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  {grupo.grupo}
                </p>
                <div className="space-y-1">
                  {itemsVisibles.map((item) => {
                    if (item.children) {
                      const childrenVisibles = item.children.filter((c) => c.show !== false);
                      if (childrenVisibles.length === 0) return null;
                      const grupoActivo = childrenVisibles.some(rutaHijaActiva);
                      const GrupoIcon = item.icon;
                      return (
                        <div key={item.name}>
                          <button
                            type="button"
                            onClick={() => item.setOpen((abierto) => !abierto)}
                            aria-expanded={item.isOpen}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${
                              grupoActivo
                                ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-md"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <GrupoIcon className="w-5 h-5 mr-3" strokeWidth={grupoActivo ? 2.5 : 2} />
                            <span className="flex-1 text-left">{item.name}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${item.isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {item.isOpen && (
                            <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1">
                              {childrenVisibles.map((child) => {
                                const childActive = rutaHijaActiva(child);
                                const ChildIcon = child.icon;
                                return (
                                  <Link
                                    key={child.name}
                                    to={{ pathname: child.path, search: child.search || "" }}
                                    className={`flex items-center px-3 py-2 rounded-lg transition-colors font-bold text-sm ${
                                      childActive
                                        ? "text-[var(--accent)] bg-white/5"
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4 mr-3" />
                                    {child.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${
                          isActive
                            ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-md"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" strokeWidth={isActive ? 2.5 : 2} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-black text-lg">
              {usuario?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {usuario?.nombres} {usuario?.apellidos}
              </p>
              <p className="text-xs text-white/50 truncate capitalize">
                {usuario?.roles?.[0]?.nombre || "Sin rol"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400 hover:bg-white/5 hover:text-red-300 py-2.5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* SIDEBAR MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[var(--bg-sidebar)] text-white shadow-2xl overflow-y-auto">
            <div className="h-20 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐔</span>
                <span className="text-lg font-black tracking-tight">AVICONTROL</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <span className="text-xl">×</span>
              </button>
            </div>
            <nav className="py-4 px-3 space-y-4">
              {menuItems.map((grupo) => {
                const itemsVisibles = grupo.items.filter((i) => i.show);
                if (itemsVisibles.length === 0) return null;
                return (
                  <div key={grupo.grupo}>
                    <p className="px-3 text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                      {grupo.grupo}
                    </p>
                    <div className="space-y-1">
                      {itemsVisibles.map((item) => {
                        if (item.children) {
                          const childrenVisibles = item.children.filter((c) => c.show !== false);
                          if (childrenVisibles.length === 0) return null;
                          return (
                            <div key={item.name} className="space-y-1">
                              <p className="px-3 py-1 text-xs font-bold text-white/50 uppercase">
                                {item.name}
                              </p>
                              {childrenVisibles.map((child) => {
                                const ChildIcon = child.icon;
                                const childActive = rutaHijaActiva(child);
                                return (
                                  <Link
                                    key={child.name}
                                    to={{ pathname: child.path, search: child.search || "" }}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center px-3 py-2 rounded-lg font-bold text-sm ${
                                      childActive
                                        ? "text-[var(--accent)] bg-white/5"
                                        : "text-white/70 hover:bg-white/5"
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4 mr-3" />
                                    {child.name}
                                  </Link>
                                );
                              })}
                            </div>
                          );
                        }
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center px-3 py-2.5 rounded-xl font-bold text-sm ${
                              isActive
                                ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                : "text-white/70 hover:bg-white/5"
                            }`}
                          >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400 hover:bg-white/5 py-2.5 rounded-xl"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="hidden md:flex bg-[var(--bg-card)] h-20 items-center justify-between px-8 sticky top-0 z-10 border-b border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-3 text-[var(--text-secondary)]">
            <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] relative bg-[var(--bg-main)] rounded-full border border-[var(--border-color)] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-main)]"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-black text-sm">
                {usuario?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold leading-tight">
                  {usuario?.nombres || usuario?.username} {usuario?.apellidos}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">
                  {usuario?.roles?.[0]?.nombre || "Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <header className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 h-16 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐔</span>
            <span className="text-lg font-black text-[var(--text-primary)] tracking-tight">AVICONTROL</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-[var(--text-secondary)] bg-[var(--bg-main)] rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}