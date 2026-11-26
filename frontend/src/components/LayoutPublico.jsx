import { Link, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../auth/ClienteAuthContext";
import { LogOut, ShoppingCart, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function LayoutPublico({ children }) {
  const { cliente, cerrarSesion } = useClienteAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    cerrarSesion();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      
      {/* HEADER PÚBLICO */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🥚</span>
            <div>
              <div className="text-lg font-black text-[var(--text-primary)] leading-tight tracking-tight">
                AVICONTROL
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Granja Avícola
              </div>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[var(--text-secondary)]">
            <Link to="/" className="hover:text-[var(--accent)] transition-colors">
              Inicio
            </Link>
            <Link to="/hacer-pedido" className="hover:text-[var(--accent)] transition-colors">
              Hacer pedido
            </Link>
            {cliente && (
              <Link to="/mis-pedidos" className="hover:text-[var(--accent)] transition-colors">
                Mis pedidos
              </Link>
            )}
          </nav>

          {/* Acciones (Usuario, Tema, Login/Registro) */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {cliente ? (
              <>
                <span className="text-sm text-[var(--text-secondary)] hidden sm:flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {cliente.nombres}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Ingresar
                </Link>
                <Link 
                  to="/registro" 
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" /> Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="text-center text-xs text-[var(--text-secondary)] py-6 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
        AVICONTROL © {new Date().getFullYear()} · Sistema de Gestión Avícola
      </footer>
    </div>
  );
}