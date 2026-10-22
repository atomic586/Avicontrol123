import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// 1. Queries y Mutations
const GET_PEDIDOS = gql`
  query GetPedidos {
    pedidos {
      id
      fechaPedido
      estado
      total
      cliente {
        nombres
        apellidos
      }
    }
  }
`;

const GET_CLIENTES = gql`
  query GetClientes {
    clientes {
      id
      nombres
      apellidos
    }
  }
`;

const GET_PRODUCTOS = gql`
  query GetProductos {
    productos {
      id
      nombre
      precioUnitario
      stock
    }
  }
`;

const CREAR_PEDIDO = gql`
  mutation CrearPedido($clienteId: ID!, $detalles: [DetallePedidoInput!]!) {
    crearPedido(clienteId: $clienteId, detalles: $detalles) {
      pedido {
        id
      }
    }
  }
`;

export default function Pedidos() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estado del formulario
  const [clienteId, setClienteId] = useState('');
  const [detalles, setDetalles] = useState([{ productoId: '', cantidad: 1 }]);

  // Queries
  const { data, loading, error, refetch } = useQuery(GET_PEDIDOS, { fetchPolicy: 'network-only' });
  const { data: dataClientes } = useQuery(GET_CLIENTES);
  const { data: dataProductos } = useQuery(GET_PRODUCTOS);

  // Mutation
  const [crearPedido, { loading: creando, error: errorCrear }] = useMutation(CREAR_PEDIDO, {
    onCompleted: () => {
      setMostrarModal(false);
      setClienteId('');
      setDetalles([{ productoId: '', cantidad: 1 }]);
      refetch();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  // Manejo de la lista de detalles
  const agregarDetalle = () => setDetalles([...detalles, { productoId: '', cantidad: 1 }]);
  const actualizarDetalle = (index, campo, valor) => {
    const nuevos = [...detalles];
    nuevos[index][campo] = valor;
    setDetalles(nuevos);
  };
  const eliminarDetalle = (index) => setDetalles(detalles.filter((_, i) => i !== index));

  // Cálculo del total en el formulario
  const calcularTotalFormulario = () => {
    return detalles.reduce((sum, d) => {
      const prod = dataProductos?.productos?.find((p) => p.id === d.productoId);
      return sum + (prod ? prod.precioUnitario * d.cantidad : 0);
    }, 0).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const detallesValidos = detalles.filter(d => d.productoId && d.cantidad > 0);
    if (!clienteId || detallesValidos.length === 0) {
      alert("Debe seleccionar un cliente y al menos un producto.");
      return;
    }

    crearPedido({
      variables: {
        clienteId,
        detalles: detallesValidos.map(d => ({ productoId: d.productoId, cantidad: Number(d.cantidad) })),
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
              <button className="text-sm text-avi-yellow font-bold whitespace-nowrap">Pedidos</button>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h2>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            + Nuevo Pedido
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando pedidos...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && data.pedidos && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{p.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.cliente?.nombres} {p.cliente?.apellidos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.fechaPedido}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${p.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        p.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {p.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pedidos.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay pedidos registrados todavía.</p>
            )}
          </div>
        )}
      </main>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Nuevo Pedido</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Selector de Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Seleccione un cliente</option>
                  {dataClientes?.clientes?.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>
                  ))}
                </select>
              </div>

              {/* Lista de Detalles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Productos</label>
                {detalles.map((detalle, index) => (
                  <div key={index} className="flex space-x-2 mb-2 items-center">
                    <select 
                      value={detalle.productoId} 
                      onChange={(e) => actualizarDetalle(index, 'productoId', e.target.value)} 
                      required 
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Seleccione producto</option>
                      {dataProductos?.productos?.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre} - ${p.precioUnitario} (Stock: {p.stock})</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      min="1" 
                      value={detalle.cantidad} 
                      onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)} 
                      required 
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2" 
                      placeholder="Cant."
                    />
                    {detalles.length > 1 && (
                      <button type="button" onClick={() => eliminarDetalle(index)} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={agregarDetalle} className="text-sm text-avi-yellow font-bold hover:underline">
                  + Agregar otro producto
                </button>
              </div>

              <div className="text-right text-lg font-bold text-gray-800 border-t pt-2">
                Total: ${calcularTotalFormulario()}
              </div>

              {errorCrear && <p className="text-red-500 text-sm">Error: {errorCrear.message}</p>}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg">Cancelar</button>
                <button type="submit" disabled={creando} className="flex-1 bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                  {creando ? 'Guardando...' : 'Crear Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}