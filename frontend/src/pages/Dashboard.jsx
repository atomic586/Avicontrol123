import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_METRICAS = gql`
  query GetMetricas {
    clientes { id }
    pedidos { id fechaPedido estado }
    ventas { id montoTotal }
    insumos { id nombre stock stockMinimo }
  }
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');

  // Consultamos todos los datos de una sola vez
  const { data, loading, error } = useQuery(GET_METRICAS, { fetchPolicy: 'network-only' });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  // Cálculos de Métricas
  const totalClientes = data?.clientes?.length || 0;
  const totalPedidos = data?.pedidos?.length || 0;
  
  // Ingresos totales
  const ingresosTotales = data?.ventas?.reduce((sum, v) => sum + parseFloat(v.montoTotal), 0).toFixed(2) || 0;

  // Pedidos pendientes
  const pedidosPendientes = data?.pedidos?.filter(p => p.estado === 'pendiente').length || 0;

  // Insumos con stock bajo (alerta)
  const insumosBajos = data?.insumos?.filter(i => i.stock <= i.stockMinimo) || [];

  return (
    <div className="min-h-screen bg-avi-light">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center overflow-x-auto">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-avi-yellow whitespace-nowrap">🥚 AVICONTROL</h1>
              <button className="text-sm text-avi-yellow font-bold whitespace-nowrap">Dashboard</button>
              <button onClick={() => navigate('/clientes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Clientes</button>
              <button onClick={() => navigate('/lotes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Lotes</button>
              <button onClick={() => navigate('/insumos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Insumos</button>
              <button onClick={() => navigate('/produccion')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Producción</button>
              <button onClick={() => navigate('/pedidos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Pedidos</button>
              <button onClick={() => navigate('/ventas')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Ventas</button>
            </div>
            <div className="flex items-center space-x-4 whitespace-nowrap pl-4">
              <span className="text-sm text-gray-600">{user.username} ({user.rol})</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Gestión Avícola</h2>
        
        {loading && <p className="text-gray-500">Cargando métricas...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && (
          <>
            {/* TARJETAS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* Clientes */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Clientes Registrados</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalClientes}</p>
                </div>
                <span className="text-3xl mt-4">👥</span>
              </div>

              {/* Pedidos */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Pedidos Pendientes</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{pedidosPendientes}</p>
                </div>
                <span className="text-3xl mt-4">📦</span>
              </div>

              {/* Ingresos */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Ingresos por Ventas</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">${ingresosTotales}</p>
                </div>
                <span className="text-3xl mt-4">💰</span>
              </div>

              {/* Total Pedidos */}
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Total de Pedidos</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{totalPedidos}</p>
                </div>
                <span className="text-3xl mt-4">📋</span>
              </div>

            </div>

            {/* ALERTAS DE INVENTARIO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Alertas de Stock (Insumos)</h3>
                {insumosBajos.length > 0 ? (
                  <ul className="space-y-2">
                    {insumosBajos.map(insumo => (
                      <li key={insumo.id} className="flex justify-between items-center bg-red-50 p-2 rounded">
                        <span className="text-sm font-medium text-red-800">{insumo.nombre}</span>
                        <span className="text-xs text-red-600 font-bold">Stock: {insumo.stock} / Min: {insumo.stockMinimo}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Todos los insumos tienen stock suficiente.</p>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Accesos Rápidos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => navigate('/pedidos')} className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">+ Nuevo Pedido</button>
                  <button onClick={() => navigate('/ventas')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">+ Nueva Venta</button>
                  <button onClick={() => navigate('/produccion')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">+ Producción</button>
                  <button onClick={() => navigate('/lotes')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Ver Lotes</button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
