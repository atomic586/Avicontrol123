<<<<<<< HEAD
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Lotes from './pages/Lotes';
import Insumos from './pages/Insumos';
import Produccion from './pages/Produccion';
import Pedidos from './pages/Pedidos';
import Ventas from './pages/Ventas';

function RutaProtegida({ children }) {
  const token = localStorage.getItem('avicontrol_token');
  if (!token) return <Navigate to="/" replace />;
  return children;
=======
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

// Guard: si no hay usuario, redirige a /login
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hueso">
        <p className="text-gray-500">Cargando...</p>
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
      <Route
        path="/"
        element={usuario ? <Navigate to="/dashboard" replace /> : <Home />}
      />
      <Route
        path="/login"
        element={usuario ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
}

export default function App() {
  return (
<<<<<<< HEAD
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      <Route path="/clientes" element={<RutaProtegida><Clientes /></RutaProtegida>} />
      <Route path="/lotes" element={<RutaProtegida><Lotes /></RutaProtegida>} />
      <Route path="/insumos" element={<RutaProtegida><Insumos /></RutaProtegida>} />
      <Route path="/produccion" element={<RutaProtegida><Produccion /></RutaProtegida>} />
      <Route path="/pedidos" element={<RutaProtegida><Pedidos /></RutaProtegida>} />
      <Route path="/ventas" element={<RutaProtegida><Ventas /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
=======
    <AuthProvider>
      <Rutas />
    </AuthProvider>
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
  );
}