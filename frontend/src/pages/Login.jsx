<<<<<<< HEAD
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
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION } from "../graphql/auth";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await loginMutation({
        variables: { username, password },
      });
      const payload = data.login;
      iniciarSesion(payload.access, payload.refresh, payload.usuario);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hueso px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🥚</div>
          <h1 className="text-2xl font-bold text-mostaza-700">AVICONTROL</h1>
          <p className="text-sm text-gray-500">Sistema de Gestión Avícola</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
            />
          </div>

          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-avi-yellow"
=======
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
              placeholder="••••••••"
              required
            />
          </div>

<<<<<<< HEAD
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-avi-yellow text-white font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
=======
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Demo: admin / Admin12345
        </p>
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
      </div>
    </div>
  );
}