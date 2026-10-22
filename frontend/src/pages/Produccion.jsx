import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

const GET_PRODUCCION = gql`
  query GetProduccion {
    producciones {
      id
      fecha
      huevosPrimera
      huevosSegunda
      huevosTercera
      huevosDescartados
      total
      lote {
        id
        codigo
      }
    }
  }
`;

const GET_LOTES = gql`
  query GetLotesProd {
    lotes {
      id
      codigo
    }
  }
`;

const CREAR_PRODUCCION = gql`
  mutation CrearProduccion($loteId: ID!, $fecha: Date!, $huevosPrimera: Int!, $huevosSegunda: Int!, $huevosTercera: Int!, $huevosDescartados: Int!) {
    crearProduccion(loteId: $loteId, fecha: $fecha, huevosPrimera: $huevosPrimera, huevosSegunda: $huevosSegunda, huevosTercera: $huevosTercera, huevosDescartados: $huevosDescartados) {
      produccion {
        id
      }
    }
  }
`;

export default function Produccion() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estado del formulario
  const [loteId, setLoteId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [huevosPrimera, setHuevosPrimera] = useState(0);
  const [huevosSegunda, setHuevosSegunda] = useState(0);
  const [huevosTercera, setHuevosTercera] = useState(0);
  const [huevosDescartados, setHuevosDescartados] = useState(0);

  const { data, loading, error, refetch } = useQuery(GET_PRODUCCION, { fetchPolicy: 'network-only' });
  const { data: dataLotes } = useQuery(GET_LOTES);
  const [crearProduccion, { loading: creando, error: errorCrear }] = useMutation(CREAR_PRODUCCION, {
    onCompleted: () => {
      setMostrarModal(false);
      setLoteId('');
      setHuevosPrimera(0);
      setHuevosSegunda(0);
      setHuevosTercera(0);
      setHuevosDescartados(0);
      refetch();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  const totalFormulario = Number(huevosPrimera) + Number(huevosSegunda) + Number(huevosTercera);

  const handleSubmit = (e) => {
    e.preventDefault();
    crearProduccion({
      variables: {
        loteId,
        fecha,
        huevosPrimera: Number(huevosPrimera),
        huevosSegunda: Number(huevosSegunda),
        huevosTercera: Number(huevosTercera),
        huevosDescartados: Number(huevosDescartados),
      },
    });
  };

  return (
    <div className="min-h-screen bg-avi-light">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-avi-yellow">🥚 AVICONTROL</h1>
              <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Dashboard</button>
              <button onClick={() => navigate('/clientes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Clientes</button>
              <button onClick={() => navigate('/lotes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Lotes</button>
              <button onClick={() => navigate('/insumos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Insumos</button>
              <button className="text-sm text-avi-yellow font-bold">Producción</button>
              <button onClick={() => navigate('/pedidos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Pedidos</button>
              <button onClick={() => navigate('/ventas')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Ventas</button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.username} ({user.rol})</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Producción Diaria</h2>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            + Nuevo Registro
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando producción...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && data.producciones && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">1ra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">2da</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">3ra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descartados</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.producciones.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.lote?.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.huevosPrimera}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.huevosSegunda}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.huevosTercera}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.huevosDescartados}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.producciones.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay registros de producción todavía.</p>
            )}
          </div>
        )}
      </main>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Nuevo Registro de Producción</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={loteId} onChange={(e) => setLoteId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Seleccione un lote</option>
                {dataLotes?.lotes?.map((l) => (
                  <option key={l.id} value={l.id}>{l.codigo}</option>
                ))}
              </select>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="number" placeholder="Huevos de primera" value={huevosPrimera} onChange={(e) => setHuevosPrimera(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="number" placeholder="Huevos de segunda" value={huevosSegunda} onChange={(e) => setHuevosSegunda(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="number" placeholder="Huevos de tercera" value={huevosTercera} onChange={(e) => setHuevosTercera(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="number" placeholder="Huevos descartados" value={huevosDescartados} onChange={(e) => setHuevosDescartados(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <p className="text-sm text-gray-600">Total calculado: <strong>{totalFormulario}</strong></p>

              {errorCrear && <p className="text-red-500 text-sm">Error: {errorCrear.message}</p>}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg">Cancelar</button>
                <button type="submit" disabled={creando} className="flex-1 bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                  {creando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}