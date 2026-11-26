import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import {
  CONFIRMAR_ACTIVACION_CLIENTE,
  REGISTRO_CLIENTE,
  SOLICITAR_ACTIVACION_CLIENTE,
} from "../graphql/cliente_auth";
import { useClienteAuth } from "../auth/ClienteAuthContext";

const GRANJAS_PUBLICAS = gql`
  query GranjasPublicas {
    granjas {
      id
      codigo
      nombre
    }
  }
`;

const CAMPO = "input-field";
const ETIQUETA = "block text-sm font-bold text-gray-700 mb-1";

export default function RegistroCliente() {
  const navigate = useNavigate();
  const { iniciarSesion } = useClienteAuth();
  const [modoActivacion, setModoActivacion] = useState(false);
  const [codigoSolicitado, setCodigoSolicitado] = useState(false);
  const [granjaId, setGranjaId] = useState("");
  const [form, setForm] = useState({ nombres: "", apellidos: "", dni: "", telefono: "", email: "", password: "", confirmar: "" });
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");

  const [registroMutation, { loading: creando }] = useMutation(REGISTRO_CLIENTE);
  const [solicitarActivacion, { loading: solicitando }] = useMutation(SOLICITAR_ACTIVACION_CLIENTE);
  const [confirmarActivacion, { loading: confirmando }] = useMutation(CONFIRMAR_ACTIVACION_CLIENTE);
  const { data: dataGranjas, loading: cargandoGranjas } = useQuery(GRANJAS_PUBLICAS, { fetchPolicy: "cache-first" });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmitRegistro = async (e) => {
    e.preventDefault();
    setError("");
    if (!granjaId) { setError("Selecciona una granja."); return; }
    if (form.password !== form.confirmar) { setError("Las contraseñas no coinciden."); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    try {
      const { data } = await registroMutation({
        variables: {
          granjaId,
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          dni: form.dni.trim(),
          telefono: form.telefono.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      });
      const payload = data?.registroCliente;
      if (!payload?.access || !payload?.cliente) throw new Error("No se pudo crear la cuenta.");
      iniciarSesion(payload.access, payload.refresh, payload.cliente);
      navigate("/mis-pedidos", { replace: true });
    } catch (err) {
      setError(err.message || "Error al crear la cuenta.");
    }
  };

  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    setError("");
    if (!granjaId) { setError("Selecciona la granja donde está registrado tu perfil."); return; }
    try {
      await solicitarActivacion({
        variables: {
          granjaId,
          email: form.email.trim(),
          dni: form.dni.trim(),
          telefono: form.telefono.trim(),
        },
      });
      setCodigoSolicitado(true);
    } catch (err) {
      setError(err.message || "No se pudo solicitar el código. Inténtalo más tarde.");
    }
  };

  const handleConfirmarCodigo = async (e) => {
    e.preventDefault();
    setError("");
    if (nuevaPassword.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (nuevaPassword !== confirmarPassword) { setError("Las contraseñas no coinciden."); return; }
    try {
      const { data } = await confirmarActivacion({
        variables: {
          email: form.email.trim(),
          codigo: codigo.trim(),
          password: nuevaPassword,
        },
      });
      const payload = data?.confirmarActivacionCliente;
      if (!payload?.access || !payload?.cliente) throw new Error("No se pudo activar la cuenta.");
      iniciarSesion(payload.access, payload.refresh, payload.cliente);
      navigate("/mis-pedidos", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo activar la cuenta.");
    }
  };

  const cambiarModo = (activar) => {
    setModoActivacion(activar);
    setCodigoSolicitado(false);
    setError("");
  };

  const selectorGranja = (
    <div>
      <label className={ETIQUETA} htmlFor="granjaId">Granja *</label>
      <select id="granjaId" className={CAMPO} value={granjaId} onChange={(e) => setGranjaId(e.target.value)} required disabled={cargandoGranjas}>
        <option value="">{cargandoGranjas ? "Cargando granjas..." : "Selecciona una granja"}</option>
        {dataGranjas?.granjas?.map((g) => (
          <option key={g.id} value={g.id}>{g.codigo} — {g.nombre}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-hueso px-4 py-10">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🥚</div>
          <h1 className="text-2xl font-black text-brand-700">{modoActivacion ? "Activa tu cuenta" : "Crear cuenta"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {modoActivacion ? "Confirma tus datos registrados y define tu contraseña" : "Regístrate para hacer pedidos"}
          </p>
        </div>

        {modoActivacion ? (
          <form onSubmit={codigoSolicitado ? handleConfirmarCodigo : handleSolicitarCodigo} className="space-y-4">
            {selectorGranja}
            <div>
              <label className={ETIQUETA} htmlFor="email-activacion">Correo registrado</label>
              <input id="email-activacion" type="email" className={CAMPO} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" placeholder="tu@correo.com" />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="dni-activacion">DNI registrado</label>
              <input id="dni-activacion" className={CAMPO} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required inputMode="numeric" autoComplete="off" />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="telefono-activacion">Teléfono registrado</label>
              <input id="telefono-activacion" type="tel" className={CAMPO} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required autoComplete="tel" />
            </div>

            {codigoSolicitado && (
              <>
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
                  Si los datos corresponden a un cliente, enviaremos un código al correo registrado. En desarrollo, revisa la consola del servidor.
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="codigo-activacion">Código de 6 dígitos</label>
                  <input id="codigo-activacion" className={CAMPO} value={codigo} onChange={(e) => setCodigo(e.target.value)} required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="nueva-password">Nueva contraseña</label>
                  <input id="nueva-password" type="password" className={CAMPO} value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="confirmar-password">Confirmar contraseña</label>
                  <input id="confirmar-password" type="password" className={CAMPO} value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                </div>
              </>
            )}

            {error && <div role="alert" className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
            <button type="submit" disabled={solicitando || confirmando || cargandoGranjas} className="btn-primary w-full disabled:opacity-50">
              {solicitando ? "Solicitando código..." : confirmando ? "Activando cuenta..." : codigoSolicitado ? "Activar cuenta" : "Enviar código"}
            </button>
            {codigoSolicitado && (
              <button type="button" onClick={() => { setCodigoSolicitado(false); setError(""); }} className="w-full text-sm font-bold text-brand-600 hover:text-brand-800 disabled:opacity-50" disabled={solicitando}>
                Solicitar otro código
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmitRegistro} className="space-y-4">
            {selectorGranja}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={ETIQUETA} htmlFor="nombres">Nombres *</label>
                <input id="nombres" name="nombres" className={CAMPO} value={form.nombres} onChange={onChange} required autoComplete="given-name" />
              </div>
              <div>
                <label className={ETIQUETA} htmlFor="apellidos">Apellidos *</label>
                <input id="apellidos" name="apellidos" className={CAMPO} value={form.apellidos} onChange={onChange} required autoComplete="family-name" />
              </div>
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="dni">DNI *</label>
              <input id="dni" name="dni" className={CAMPO} value={form.dni} onChange={onChange} required inputMode="numeric" placeholder="Solo dígitos" />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="telefono">Teléfono *</label>
              <input id="telefono" name="telefono" type="tel" className={CAMPO} value={form.telefono} onChange={onChange} required autoComplete="tel" />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="email">Correo *</label>
              <input id="email" name="email" type="email" className={CAMPO} value={form.email} onChange={onChange} required autoComplete="email" />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="password">Contraseña *</label>
              <input id="password" name="password" type="password" className={CAMPO} value={form.password} onChange={onChange} required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className={ETIQUETA} htmlFor="confirmar">Confirmar contraseña *</label>
              <input id="confirmar" name="confirmar" type="password" className={CAMPO} value={form.confirmar} onChange={onChange} required minLength={8} autoComplete="new-password" />
            </div>
            {error && <div role="alert" className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
            <button type="submit" disabled={creando || cargandoGranjas} className="btn-primary w-full disabled:opacity-50">
              {creando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-sm text-gray-500">
            {modoActivacion ? "¿Aún no tienes un perfil de cliente?" : "¿Ya eres cliente de una granja?"}{" "}
            <button type="button" onClick={() => cambiarModo(!modoActivacion)} className="font-bold text-brand-600 hover:text-brand-800">
              {modoActivacion ? "Crear cuenta nueva" : "Activa tu cuenta"}
            </button>
          </p>
          <p className="text-sm text-gray-500">
            ¿Ya tienes acceso? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800">Iniciar sesión</Link>
          </p>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al portal
          </Link>
        </div>
      </div>
    </div>
  );
}
