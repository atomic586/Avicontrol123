import { Link, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../auth/ClienteAuthContext";
import { LogOut, ShoppingCart, User } from "lucide-react";

export default function LayoutPublico({ children }) {
  const { cliente, cerrarSesion } = useClienteAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-hueso flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🥚</span>
            <div>
              <div className="text-lg font-black text-brand-700 leading-tight">AVICONTROL</div>
              <div className="text-xs text-gray-500">Granja Avícola</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-600">
            <Link to="/" className="hover:text-brand-600">Inicio</Link>
            <Link to="/hacer-pedido" className="hover:text-brand-600">Hacer pedido</Link>
            {cliente && <Link to="/mis-pedidos" className="hover:text-brand-600">Mis pedidos</Link>}
          </nav>

          <div className="flex items-center gap-3">
            {cliente ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  <User className="w-4 h-4 inline mr-1" />
                  {cliente.nombres}
                </span>
                <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-800 flex items-center gap-1">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-brand-600">Ingresar</Link>
                <Link to="/registro" className="btn-primary text-sm">
                  <ShoppingCart className="w-4 h-4" /> Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 bg-white">
        AVICONTROL © {new Date().getFullYear()} · Sistema de Gestión Avícola
      </footer>
    </div>
  );
}