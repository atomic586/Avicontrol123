import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GET_LOTES = gql`
  query GetLotes {
    lotes {
      id
      codigo
      raza
      fechaIngreso
      cantidadAves
      estado
      galpon {
        id
        codigo
        granja {
          id
          nombre
        }
      }
    }
  }
`;

export default function Lotes() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');
  const [mostrarModal, setMostrarModal] = useState(false);

  const { data, loading, error } = useQuery(GET_LOTES, { fetchPolicy: 'network-only' });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
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
              <button className="text-sm text-avi-yellow font-bold">Lotes</button>
              <button onClick={() => navigate('/insumos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Insumos</button>
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
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Lotes</h2>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            + Nuevo Lote
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando lotes...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && data.lotes && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raza</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granja / Galpón</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aves</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.lotes.map((lote) => (
                  <tr key={lote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lote.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lote.raza}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lote.galpon?.granja?.nombre} / {lote.galpon?.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lote.cantidadAves}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lote.fechaIngreso}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lote.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lote.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.lotes.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay lotes registrados todavía.</p>
            )}
          </div>
        )}

        {/* MODAL PLACEHOLDER (lo completamos en el siguiente paso) */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Nuevo Lote</h3>
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