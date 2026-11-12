import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ClienteAuthProvider, useClienteAuth } from "./auth/ClienteAuthContext";
import Layout from "./components/Layout";
import LoginAdmin from "./pages/LoginAdmin";
import LoginCliente from "./pages/LoginCliente";
import RegistroCliente from "./pages/RegistroCliente";
import Dashboard from "./pages/Dashboard";
import PortalPublico from "./pages/PortalPublico";
import HacerPedido from "./pages/HacerPedido";
import MisPedidos from "./pages/MisPedidos";
import Clientes from "./pages/Clientes";
import Insumos from "./pages/Insumos";
import Produccion from "./pages/Produccion";
import Pedidos from "./pages/Pedidos";
import Ventas from "./pages/Ventas";
import Configuracion from "./pages/Configuracion";
import Granjas from "./pages/Granjas";
import Abono from "./pages/Abono";

function RutaAdmin({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-gray-500 font-medium">Cargando...</p></div>;
  if (!usuario) return <Navigate to="/admin-login" state={{ from: location }} replace />;
  return <Layout>{children}</Layout>;
}

function RutaCliente({ children }) {
  const { cliente, cargando } = useClienteAuth();
  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-hueso"><p className="text-gray-500 font-medium">Cargando...</p></div>;
  if (!cliente) return <Navigate to="/login" replace />;
  return children;
}

function Rutas() {
  const { usuario } = useAuth();
  const { cliente } = useClienteAuth();

  return (
    <Routes>
      {/* PORTAL PUBLICO */}
      <Route path="/" element={<PortalPublico />} />
      <Route path="/hacer-pedido" element={<HacerPedido />} />

      {/* LOGIN CLIENTE */}
      <Route path="/login" element={cliente ? <Navigate to="/mis-pedidos" replace /> : <LoginCliente />} />
      <Route path="/registro" element={cliente ? <Navigate to="/mis-pedidos" replace /> : <RegistroCliente />} />
      <Route path="/mis-pedidos" element={<RutaCliente><MisPedidos /></RutaCliente>} />

      {/* LOGIN ADMIN */}
      <Route path="/admin-login" element={usuario ? <Navigate to="/dashboard" replace /> : <LoginAdmin />} />

      {/* PANEL ADMIN */}
      <Route path="/dashboard" element={<RutaAdmin><Dashboard /></RutaAdmin>} />
      <Route path="/granjas" element={<RutaAdmin><Granjas /></RutaAdmin>} />
      <Route path="/abono" element={<RutaAdmin><Abono /></RutaAdmin>} />
      <Route path="/clientes" element={<RutaAdmin><Clientes /></RutaAdmin>} />
      <Route path="/insumos" element={<RutaAdmin><Insumos /></RutaAdmin>} />
      <Route path="/produccion" element={<RutaAdmin><Produccion /></RutaAdmin>} />
      <Route path="/pedidos" element={<RutaAdmin><Pedidos /></RutaAdmin>} />
      <Route path="/ventas" element={<RutaAdmin><Ventas /></RutaAdmin>} />
      <Route path="/configuracion" element={<RutaAdmin><Configuracion /></RutaAdmin>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClienteAuthProvider>
        <Rutas />
      </ClienteAuthProvider>
    </AuthProvider>
  );
}