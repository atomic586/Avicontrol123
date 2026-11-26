import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { ArrowLeft } from "lucide-react";
import { LOGIN_CLIENTE } from "../graphql/cliente_auth";
import { useClienteAuth } from "../auth/ClienteAuthContext";
import HuevoMascota from "../components/HuevoMascota";
import ThemeToggle from "../components/ThemeToggle";

export default function LoginCliente() {
  const navigate = useNavigate();
  const { iniciarSesion } = useClienteAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [faseMascota, setFaseMascota] = useState("idle");
  const pausaEscritura = useRef(null);
  const [loginMutation, { loading }] = useMutation(LOGIN_CLIENTE);

  useEffect(() => () => window.clearTimeout(pausaEscritura.current), []);

  const animarEscritura = (fase) => {
    window.clearTimeout(pausaEscritura.current);
    setFaseMascota(fase);
    pausaEscritura.current = window.setTimeout(() => setFaseMascota("idle"), 260);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    window.clearTimeout(pausaEscritura.current);
    setFaseMascota("loading");
    try {
      const { data } = await loginMutation({ variables: { email: email.trim(), password } });
      const payload = data?.loginCliente;
      if (!payload?.access || !payload?.cliente) {
        throw new Error("No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.");
      }
      window.clearTimeout(pausaEscritura.current);
      setFaseMascota("success");
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      iniciarSesion(payload.access, payload.refresh, payload.cliente);
      navigate("/mis-pedidos", { replace: true });
    } catch (err) {
      setFaseMascota("error");
      setError(err.message || "Email o contraseña inválidos");
    }
  };

  return (
    <div className="login-cliente min-h-screen flex items-center justify-center bg-hueso px-4">
      <div className="card login-cliente__card max-w-md w-full">
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>
        <div className="text-center mb-6">
          <HuevoMascota phase={faseMascota} />
          <h1 className="login-cliente__heading text-2xl font-black text-brand-700">Mis pedidos</h1>
          <p className="login-cliente__subtitle text-sm text-gray-500 mt-1">Ingresa a tu cuenta de cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="login-cliente__label block text-sm font-bold text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" className="input-field" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); animarEscritura("email"); }} required autoFocus autoComplete="email" placeholder="tu@correo.com" />
          </div>
          <div>
            <label className="login-cliente__label block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input type="password" className="input-field" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); animarEscritura("password"); }} required autoComplete="current-password" placeholder="••••••••" />
          </div>
          {error && <div role="alert" className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <button type="submit" disabled={loading || faseMascota === "success"} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Verificando..." : faseMascota === "success" ? "¡Bienvenido!" : "Ingresar"}
          </button>
        </form>

        <div className="login-cliente__divider mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="login-cliente__subtitle text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="login-cliente__link font-bold text-brand-600 hover:text-brand-800">Crear cuenta</Link>
          </p>
          <Link to="/" className="login-cliente__link text-sm font-bold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al portal
          </Link>
        </div>
      </div>
    </div>
  );
}
