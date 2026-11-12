import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { Shield, ArrowLeft } from "lucide-react";
import { LOGIN_MUTATION } from "../graphql/auth";
import { useAuth } from "../auth/AuthContext";

export default function LoginAdmin() {
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
      const { data } = await loginMutation({ variables: { username, password } });
      const payload = data.login;
      iniciarSesion(payload.access, payload.refresh, payload.usuario);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-3">
            <Shield className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-2xl font-black text-dark">Acceso administrativo</h1>
          <p className="text-sm text-gray-500 mt-1">Solo personal autorizado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
            <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus placeholder="superadmin" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Verificando..." : "Ingresar al panel"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al portal público
          </Link>
        </div>
      </div>
    </div>
  );
}