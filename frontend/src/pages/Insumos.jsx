import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_INSUMOS = gql`
  query GetInsumos {
    insumos {
      id
      nombre
      tipo
      presentacion
      stock
      stockMinimo
      precioUnitario
      fechaVencimiento
    }
  }
`;

export default function Insumos() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');
  const [mostrarModal, setMostrarModal] = useState(false);

  const { data, loading, error } = useQuery(GET_INSUMOS, { fetchPolicy: 'network-only' });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  const esStockBajo = (insumo) => insumo.stock <= insumo.stockMinimo;
  const esProximoVencer = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    const vence = new Date(fecha);
    const dias = (vence - hoy) / (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= 30;
  };

  return (
    <div className="min-h-screen bg-avi-light">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-avi-yellow">🥚 AVICONTROL</h1>
              <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Dashboard</button>
              <button onClick={() => navigate('/clientes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Clientes</button>
              <button onClick={() => navigate('/lotes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Lotes</button>
              <button className="text-sm text-avi-yellow font-bold">Insumos</button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.username} ({user.rol})</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Inventario de Insumos</h2>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            + Nuevo Insumo
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando insumos...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && data.insumos && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presentación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.insumos.map((insumo) => (
                  <tr key={insumo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{insumo.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{insumo.tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{insumo.presentacion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-bold ${esStockBajo(insumo) ? 'text-red-600' : 'text-gray-700'}`}>
                        {insumo.stock} {esStockBajo(insumo) && '⚠️'}
                      </span>
                      <span className="text-xs text-gray-400"> / min {insumo.stockMinimo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${insumo.precioUnitario}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={esProximoVencer(insumo.fechaVencimiento) ? 'text-orange-600 font-bold' : 'text-gray-700'}>
                        {insumo.fechaVencimiento || '—'} {esProximoVencer(insumo.fechaVencimiento) && '🔔'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.insumos.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay insumos registrados todavía.</p>
            )}
          </div>
        )}

        {/* MODAL PLACEHOLDER */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Nuevo Insumo</h3>
              <p className="text-gray-600 mb-4">El formulario se completará en el siguiente paso.</p>
              <button
                onClick={() => setMostrarModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}