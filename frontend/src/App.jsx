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
}

export default function App() {
  return (
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
  );
}