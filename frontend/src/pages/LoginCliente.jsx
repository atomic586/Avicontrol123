import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { Egg, ArrowLeft } from "lucide-react";
import { LOGIN_CLIENTE } from "../graphql/cliente_auth";
import { useClienteAuth } from "../auth/ClienteAuthContext";

export default function LoginCliente() {
  const navigate = useNavigate();
  const { iniciarSesion } = useClienteAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginMutation, { loading }] = useMutation(LOGIN_CLIENTE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await loginMutation({ variables: { email, password } });
      const payload = data.loginCliente;
      iniciarSesion(payload.access, payload.refresh, payload.cliente);
      navigate("/mis-pedidos", { replace: true });
    } catch (err) {
      setError(err.message || "Email o contraseña inválidos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hueso px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🥚</div>
          <h1 className="text-2xl font-black text-brand-700">Mis pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresa a tu cuenta de cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="tu@correo.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="font-bold text-brand-600 hover:text-brand-800">Crear cuenta</Link>
          </p>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al portal
          </Link>
        </div>
      </div>
    </div>
  );
}