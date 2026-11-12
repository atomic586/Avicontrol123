import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  LayoutDashboard, Egg, ShoppingCart, Users,
  Package, DollarSign, LogOut, Menu, Bell, Settings, Building2, Wheat, Factory
} from "lucide-react";
import { useState } from "react";

export default function Layout({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    cerrarSesion();
    navigate("/admin-login", { replace: true });
  };

  const roles = usuario?.roles?.map(r => r.codigo) || [];
  const esSuperadmin = roles.includes("superadmin");
  const esAdminGranja = roles.includes("admin_granja");
  const esVentas = roles.includes("encargado_ventas");
  const esProduccion = roles.includes("encargado_produccion");
  const esAlmacen = roles.includes("encargado_almacen");

  // Menú filtrado por rol
  const menuItems = [
    { name: "Panel general", path: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Granjas", path: "/granjas", icon: Building2, show: esSuperadmin },
    { name: "Producción", path: "/produccion", icon: Egg, show: esSuperadmin || esAdminGranja || esProduccion },
    { name: "Abono", path: "/abono", icon: Wheat, show: esSuperadmin || esAdminGranja || esProduccion },
    { name: "Pedidos", path: "/pedidos", icon: ShoppingCart, show: esSuperadmin || esAdminGranja || esVentas },
    { name: "Clientes", path: "/clientes", icon: Users, show: esSuperadmin || esAdminGranja || esVentas },
    { name: "Ventas", path: "/ventas", icon: DollarSign, show: esSuperadmin || esAdminGranja || esVentas },
    { name: "Inventario", path: "/insumos", icon: Package, show: esSuperadmin || esAdminGranja || esAlmacen },
    { name: "Configuración", path: "/configuracion", icon: Settings, show: esSuperadmin || esAdminGranja },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 z-20">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <span className="text-3xl mr-3">🥚</span>
          <div>
            <h1 className="text-xl font-black text-brand-600 tracking-tight">AVICONTROL</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {esSuperadmin ? "Plataforma global" : "Panel de granja"}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-2 text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Espacio de trabajo</p>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-xl transition-colors font-bold text-[15px] ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-brand-600" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {usuario?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{usuario?.nombres} {usuario?.apellidos}</p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {usuario?.roles?.[0]?.nombre || "Sin rol"}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 py-2.5 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex bg-background h-20 items-center justify-between px-8 sticky top-0 z-10">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-brand-500 relative bg-white rounded-full shadow-sm border border-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <header className="md:hidden bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥚</span>
            <span className="text-lg font-black text-brand-600 tracking-tight">AVICONTROL</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-600 bg-gray-50 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}