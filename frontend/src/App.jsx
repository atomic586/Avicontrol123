import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Clientes from "./pages/Clientes";
import Insumos from "./pages/Insumos";

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-gray-500 font-medium">Cargando...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
}

function Rutas() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/" element={usuario ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={usuario ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      <Route path="/clientes" element={<RutaProtegida><Clientes /></RutaProtegida>} />
      <Route path="/insumos" element={<RutaProtegida><Insumos /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  );
}