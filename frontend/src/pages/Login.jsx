import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      username
      rol
    }
  }
`;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('avicontrol_token', data.login.token);
      localStorage.setItem('avicontrol_user', JSON.stringify({
        username: data.login.username,
        rol: data.login.rol
      }));
      navigate('/dashboard');
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error al iniciar sesión');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    loginMutation({ variables: { username, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-avi-light px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border-t-4 border-avi-yellow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-avi-yellow">🥚 AVICONTROL</h1>
          <p className="text-gray-500 mt-2">Sistema de Gestión Avícola</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-avi-yellow"
              placeholder="Ej. Ernesto Garcia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-avi-yellow"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-avi-yellow text-white font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}