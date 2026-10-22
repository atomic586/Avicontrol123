import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

const GET_CLIENTES = gql`
  query GetClientes {
    clientes {
      id
      nombres
      apellidos
      dni
      telefono
      email
      direccion
    }
  }
`;

const CREAR_CLIENTE = gql`
  mutation CrearCliente($nombres: String!, $apellidos: String!, $dni: String!, $telefono: String!, $email: String, $direccion: String) {
    crearCliente(nombres: $nombres, apellidos: $apellidos, dni: $dni, telefono: $telefono, email: $email, direccion: $direccion) {
      cliente {
        id
        nombres
        apellidos
        dni
        telefono
        email
        direccion
      }
    }
  }
`;

export default function Clientes() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('avicontrol_user') || '{}');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estados del formulario
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  // Query para listar clientes
  const { data, loading, error, refetch } = useQuery(GET_CLIENTES, {
    fetchPolicy: 'network-only',
  });

  // Mutación para crear cliente
  const [crearCliente, { loading: creando, error: errorCrear }] = useMutation(CREAR_CLIENTE, {
    onCompleted: () => {
      setMostrarModal(false);
      setNombres('');
      setApellidos('');
      setDni('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      refetch();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('avicontrol_token');
    localStorage.removeItem('avicontrol_user');
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    crearCliente({
      variables: {
        nombres,
        apellidos,
        dni,
        telefono,
        email: email || null,
        direccion: direccion || null,
      },
    });
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
              <button className="text-sm text-avi-yellow font-bold">Clientes</button>
              <button onClick={() => navigate('/lotes')} className="text-sm text-gray-600 hover:text-avi-yellow font-medium">Lotes</button>
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
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-avi-yellow hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow"
          >
            + Nuevo Cliente
          </button>
        </div>

        {loading && <p className="text-gray-500">Cargando clientes...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}

        {data && data.clientes && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombres</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apellidos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombres}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.apellidos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.dni}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.telefono}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.direccion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.clientes.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay clientes registrados todavía.</p>
            )}
          </div>
        )}
      </main>

      {/* MODAL PARA AGREGAR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Nuevo Cliente</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="text" placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="text" placeholder="DNI" value={dni} onChange={(e) => setDni(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="email" placeholder="Email (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              <input type="text" placeholder="Dirección (opcional)" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />

              {errorCrear && <p className="text-red-500 text-sm">Error: {errorCrear.message}</p>}

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg">
                  Cancelar
                </button>
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