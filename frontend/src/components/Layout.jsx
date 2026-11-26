import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useGranja } from "../context/GranjaContext";
import {
  LayoutDashboard, Egg, ShoppingCart, Users,
  Package, DollarSign, LogOut, Menu, Bell, Settings, Building2, Wheat, UserCog, Truck, ShoppingBag, BarChart2, Bird, Pill, ChevronDown
} from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

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
  const rutaProduccionActiva = location.pathname.startsWith("/produccion") || location.pathname.startsWith("/abono");
  const [produccionOpen, setProduccionOpen] = useState(rutaProduccionActiva);

  useEffect(() => {
    if (rutaProduccionActiva) setProduccionOpen(true);
  }, [rutaProduccionActiva]);

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

  const rutaHijaActiva = (child) => location.pathname === child.path && (
    !child.search || location.search === child.search || (!location.search && child.search === "?seccion=produccion")
  );

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
      items: [
        { name: "Inicio", path: "/dashboard", icon: LayoutDashboard, show: true },
      ]
    },
    { 
      grupo: "Producción", 
      items: [
        { name: "Granjas", path: "/granjas", icon: Building2, show: esSuperadmin || esAdminGranja || esProduccion },
        {
          name: "Producción",
          icon: Egg,
          show: esSuperadmin || esAdminGranja || esProduccion,
          children: [
            { name: "Huevos", path: "/produccion", search: "?seccion=produccion", icon: Egg },
            { name: "Aves", path: "/produccion", search: "?seccion=aves", icon: Bird },
            { name: "Abono", path: "/abono", icon: Wheat },
          ],
        },
        { name: "Medicamentos", path: "/medicamentos-alimento", icon: Pill, show: esSuperadmin || esAdminGranja || esAlmacen || esProduccion },
      ]
    },
    { 
      grupo: "Comercialización", 
      items: [
        { name: "Pedidos", path: "/pedidos", icon: ShoppingCart, show: esSuperadmin || esAdminGranja || esVentas },
        { name: "Entregas", path: "/entregas", icon: Truck, show: esSuperadmin || esAdminGranja || esVentas },
        { name: "Clientes", path: "/clientes", icon: Users, show: esSuperadmin || esAdminGranja || esVentas },
        { name: "Ventas", path: "/ventas", icon: DollarSign, show: esSuperadmin || esAdminGranja || esVentas },
      ]
    },
    { 
      grupo: "Inventario", 
      items: [
        { name: "Insumos", path: "/insumos", icon: Package, show: esSuperadmin || esAdminGranja || esAlmacen },
        { name: "Proveedores", path: "/proveedores", icon: Truck, show: esSuperadmin || esAdminGranja || esAlmacen },
        { name: "Compras", path: "/compras", icon: ShoppingBag, show: esSuperadmin || esAdminGranja || esAlmacen },
      ]
    },
    { 
      grupo: "Administración", 
      items: [
        { name: "Reportes", path: "/reportes", icon: BarChart2, show: esSuperadmin || esAdminGranja },
        { name: "Usuarios", path: "/usuarios", icon: UserCog, show: esSuperadmin || esAdminGranja },
        { name: "Configuración", path: "/configuracion", icon: Settings, show: esSuperadmin || esAdminGranja },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-sidebar)] text-white h-screen sticky top-0 z-20 shadow-2xl">
        
        {/* Logo */}
        <div className="h-24 flex flex-col items-center justify-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐔</span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-tight">AVICONTROL</h1>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-center">Sistema Avícola</p>
            </div>
          </div>
        </div>

        {/* Selector Granja */}
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
                <option key={g.id} value={g.id} className="text-black">{g.codigo} - {g.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Menú */}
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
                      const grupoActivo = item.children.some(rutaHijaActiva);
                      const GrupoIcon = item.icon;
                      return (
                        <div key={item.name}>
                          <button
                            type="button"
                            onClick={() => setProduccionOpen((abierto) => !abierto)}
                            aria-expanded={produccionOpen}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${
                              grupoActivo 
                                ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-md" 
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <GrupoIcon className="w-5 h-5 mr-3" strokeWidth={grupoActivo ? 2.5 : 2} />
                            <span className="flex-1 text-left">{item.name}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${produccionOpen ? "rotate-180" : ""}`} />
                          </button>
                          {produccionOpen && (
                            <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1">
                              {item.children.map((child) => {
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

        {/* Footer usuario */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-black text-lg">
              {usuario?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{usuario?.nombres} {usuario?.apellidos}</p>
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar Desktop */}
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
                <p className="text-sm font-bold leading-tight">{usuario?.nombres || usuario?.username} {usuario?.apellidos}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">{usuario?.roles?.[0]?.nombre || "Admin"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Topbar Móvil */}
        <header className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 h-16 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐔</span>
            <span className="text-lg font-black text-[var(--text-primary)] tracking-tight">AVICONTROL</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-[var(--text-secondary)] bg-[var(--bg-main)] rounded-lg">
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