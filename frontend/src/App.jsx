import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ClienteAuthProvider, useClienteAuth } from "./auth/ClienteAuthContext";
import { GranjaProvider } from "./context/GranjaContext";
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
import GranjaDetalle from "./pages/GranjaDetalle";
import Abono from "./pages/Abono";
import Usuarios from "./pages/Usuarios";
import Proveedores from "./pages/Proveedores";
import Compras from "./pages/Compras";
import Entregas from "./pages/Entregas";
import Reportes from "./pages/Reportes";
import MedicamentosAlimento from "./pages/MedicamentosAlimento";
import GalponDetalle from "./pages/GalponDetalle";
import LoteDetalle from "./pages/LoteDetalle";
import Granjas from "./pages/Granjas";
import Productos from "./pages/Productos";
import Aves from "./pages/Aves";
import Sanidad from "./pages/Sanidad";                                    // ← NUEVO
import { ModuloGate } from "./components/ModuloGate";
import { ThemeProvider } from "./theme/ThemeContext";

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
      {/* 1. RUTAS DE ADMINISTRACIÓN (Protegidas) */}
      <Route path="/dashboard" element={<RutaAdmin><Dashboard /></RutaAdmin>} />
      <Route path="/granjas" element={<RutaAdmin><Granjas /></RutaAdmin>} />
      <Route path="/granjas/:id" element={<RutaAdmin><GranjaDetalle /></RutaAdmin>} />
      <Route path="/galpones/:id" element={<RutaAdmin><GalponDetalle /></RutaAdmin>} />
      <Route path="/lotes/:id" element={<RutaAdmin><LoteDetalle /></RutaAdmin>} />
      <Route path="/abono" element={<RutaAdmin><ModuloGate codigo="abono"><Abono /></ModuloGate></RutaAdmin>} />
      <Route path="/clientes" element={<RutaAdmin><Clientes /></RutaAdmin>} />
      <Route path="/insumos" element={<RutaAdmin><Insumos /></RutaAdmin>} />
      <Route path="/produccion" element={<RutaAdmin><Produccion /></RutaAdmin>} />
      <Route path="/aves" element={<RutaAdmin><ModuloGate codigo="aves"><Aves /></ModuloGate></RutaAdmin>} />
      <Route path="/sanidad" element={<RutaAdmin><ModuloGate codigo="sanidad"><Sanidad /></ModuloGate></RutaAdmin>} />
      <Route path="/medicamentos-alimento" element={<RutaAdmin><MedicamentosAlimento /></RutaAdmin>} />
      <Route path="/pedidos" element={<RutaAdmin><Pedidos /></RutaAdmin>} />
      <Route path="/entregas" element={<RutaAdmin><Entregas /></RutaAdmin>} />
      <Route path="/ventas" element={<RutaAdmin><Ventas /></RutaAdmin>} />
      <Route path="/proveedores" element={<RutaAdmin><Proveedores /></RutaAdmin>} />
      <Route path="/compras" element={<RutaAdmin><Compras /></RutaAdmin>} />
      <Route path="/reportes" element={<RutaAdmin><ModuloGate codigo="reportes_avanzados"><Reportes /></ModuloGate></RutaAdmin>} />
      <Route path="/configuracion" element={<RutaAdmin><Configuracion /></RutaAdmin>} />
      <Route path="/usuarios" element={<RutaAdmin><Usuarios /></RutaAdmin>} />
      <Route path="/productos" element={<RutaAdmin><Productos /></RutaAdmin>} />

      {/* 2. LOGIN ADMIN */}
      <Route path="/admin-login" element={usuario ? <Navigate to="/dashboard" replace /> : <LoginAdmin />} />

      {/* 3. PORTAL PÚBLICO Y CLIENTES */}
      <Route path="/" element={<PortalPublico />} />
      <Route path="/hacer-pedido" element={<HacerPedido />} />
      <Route path="/login" element={cliente ? <Navigate to="/mis-pedidos" replace /> : <LoginCliente />} />
      <Route path="/registro" element={cliente ? <Navigate to="/mis-pedidos" replace /> : <RegistroCliente />} />
      <Route path="/mis-pedidos" element={<RutaCliente><MisPedidos /></RutaCliente>} />

      {/* 4. COMODÍN */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClienteAuthProvider>
        <GranjaProvider>
          <ThemeProvider>
            <Rutas />
          </ThemeProvider>
        </GranjaProvider>
      </ClienteAuthProvider>
    </AuthProvider>
  );
}