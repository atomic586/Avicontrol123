import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// 1. Queries y Mutations
const GET_VENTAS = gql`
  query GetVentas {
    ventas {
      id
      fecha
      montoTotal
      formaPago
      pedido {
        id
        cliente {
          nombres
          apellidos
        }
      }
    }
  }
`;

const GET_PEDIDOS_PENDIENTES = gql`
  query GetPedidosPendientes {
    pedidos(estado: "pendiente") {
      id
      fechaPedido
      total
      cliente {
        nombres
        apellidos
      }
    }
  }
`;

const CREAR_VENTA = gql`
  mutation CrearVenta($pedidoId: ID!, $formaPago: String!) {
    crearVenta(pedidoId: $pedidoId, formaPago: $formaPago) {
      venta {
        id
      }
    }
  }
`;

export default function Ventas() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estado del formulario
  const [pedidoId, setPedidoId] = useState('');
  const [formaPago, setFormaPago] = useState('efectivo');

  // Queries
  const { data, loading, error, refetch } = useQuery(GET_VENTAS, { fetchPolicy: 'network-only' });
  const { data: dataPendientes, refetch: refetchPendientes } = useQuery(GET_PEDIDOS_PENDIENTES);

  // Mutation
  const [crearVenta, { loading: creando, error: errorCrear }] = useMutation(CREAR_VENTA, {
    onCompleted: () => {
      setMostrarModal(false);
      setPedidoId('');
      setFormaPago('efectivo');
      refetch(); // Recargar ventas
      refetchPendientes(); // Recargar pedidos pendientes (el actual ya no debe salir)
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pedidoId) {
      alert("Debe seleccionar un pedido pendiente.");
      return;
    }

    crearVenta({
      variables: {
        pedidoId,
        formaPago,
      },
    });
  };

  return (
    <div className="min-h-screen bg-avi-light">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center overflow-x-auto">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-avi-yellow whitespace-nowrap">🥚 AVICONTROL</h1>
              <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Dashboard</button>
              <button onClick={() => navigate('/clientes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Clientes</button>
              <button onClick={() => navigate('/lotes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Lotes</button>
              <button onClick={() => navigate('/insumos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Insumos</button>
              <button onClick={() => navigate('/produccion')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Producción</button>
              <button onClick={() => navigate('/pedidos')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium whitespace-nowrap">Pedidos</button>
              <button className="text-sm text-avi-yellow font-bold whitespace-nowrap">Ventas</button>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Ventas</h2>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            + Registrar Venta
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando ventas...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && data.ventas && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Venta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma de Pago</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{v.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(v.fecha).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.pedido?.cliente?.nombres} {v.pedido?.cliente?.apellidos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${v.montoTotal}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 uppercase">
                        {v.formaPago}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.ventas.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay ventas registradas todavía.</p>
            )}
          </div>
        )}
      </main>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Registrar Nueva Venta</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Selector de Pedido Pendiente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Pendiente</label>
                <select value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Seleccione un pedido</option>
                  {dataPendientes?.pedidos?.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.cliente?.nombres} {p.cliente?.apellidos} - ${p.total}
                    </option>
                  ))}
                </select>
                {dataPendientes?.pedidos?.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No hay pedidos pendientes.</p>
                )}
              </div>

              {/* Selector de Forma de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
                <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              {errorCrear && <p className="text-red-500 text-sm">Error: {errorCrear.message}</p>}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg">Cancelar</button>
                <button type="submit" disabled={creando} className="flex-1 bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                  {creando ? 'Registrando...' : 'Cobrar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}