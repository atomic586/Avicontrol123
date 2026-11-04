import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { ArrowLeft } from "lucide-react";
import { REGISTRO_CLIENTE } from "../graphql/cliente_auth";
import { useClienteAuth } from "../auth/ClienteAuthContext";

const FORM_VACIO = {
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  email: "",
  password: "",
  confirmar: "",
};

export default function RegistroCliente() {
  const navigate = useNavigate();
  const { iniciarSesion } = useClienteAuth();
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [registroMutation, { loading }] = useMutation(REGISTRO_CLIENTE);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    try {
      const { data } = await registroMutation({
        variables: {
          nombres: form.nombres,
          apellidos: form.apellidos,
          dni: form.dni,
          telefono: form.telefono,
          email: form.email,
          password: form.password,
        },
      });
      const payload = data.registroCliente;
      iniciarSesion(payload.access, payload.refresh, payload.cliente);
      navigate("/mis-pedidos", { replace: true });
    } catch (err) {
      setError(err.message || "Error al registrarse.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hueso px-4 py-10">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🥚</div>
          <h1 className="text-2xl font-black text-brand-700">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Regístrate para hacer pedidos y ver tu historial</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombres *</label>
              <input name="nombres" className="input-field" value={form.nombres} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Apellidos *</label>
              <input name="apellidos" className="input-field" value={form.apellidos} onChange={onChange} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">DNI *</label>
            <input name="dni" className="input-field" value={form.dni} onChange={onChange} required placeholder="Solo dígitos" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono *</label>
            <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo *</label>
            <input name="email" type="email" className="input-field" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña *</label>
            <input name="password" type="password" className="input-field" value={form.password} onChange={onChange} required placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar contraseña *</label>
            <input name="confirmar" type="password" className="input-field" value={form.confirmar} onChange={onChange} required />
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800">Iniciar sesión</Link>
          </p>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al portal
          </Link>
        </div>
      </div>
    </div>
  );
}