import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { UserCog, Plus, Pencil, Trash2, Shield, Mail, Phone, Key, User, Eye, EyeOff } from "lucide-react";
import {
  USUARIOS_QUERY,
  CREAR_USUARIO,
  ACTUALIZAR_USUARIO,
  ELIMINAR_USUARIO,
} from "../graphql/usuarios";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";

const ROLES_QUERY = gql`
  query RolesParaUsuarios {
    roles { id codigo nombre descripcion }
  }
`;

const GRANJAS_QUERY = gql`
  query GranjasParaUsuarios {
    granjas { id codigo nombre }
  }
`;

const FORM_VACIO = {
  username: "",
  email: "",
  password: "",
  confirmarPassword: "",
  rolCodigo: "",
  granjaId: "",
  nombres: "",
  apellidos: "",
  telefono: "",
};

const ROL_COLOR = {
  superadmin: "badge-danger",
  admin_granja: "badge-warning",
  encargado_ventas: "badge-info",
  encargado_produccion: "badge-success",
  encargado_almacen: "badge-info",
};

export default function Usuarios() {
  const { esSuperadmin, usuario: usuarioActual } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  // Queries
  const { data, loading, error: qError, refetch } = useQuery(USUARIOS_QUERY, {
    fetchPolicy: "network-only",
  });
  const { data: dataRoles, loading: cargandoRoles, error: errorRoles } = useQuery(ROLES_QUERY, {
    fetchPolicy: "cache-first",
  });
  const { data: dataGranjas, loading: cargandoGranjas, error: errorGranjas } = useQuery(GRANJAS_QUERY, {
    fetchPolicy: "cache-first",
    skip: !esSuperadmin,
  });

  // Mutations
  const [crearUsuario, { loading: creando }] = useMutation(CREAR_USUARIO);
  const [actualizarUsuario, { loading: actualizando }] = useMutation(ACTUALIZAR_USUARIO);
  const [eliminarUsuario] = useMutation(ELIMINAR_USUARIO);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setVerPassword(false);
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      confirmarPassword: "",
      rolCodigo: u.roles?.[0]?.codigo || "",
      granjaId: u.granjaId || "",
      nombres: u.nombres || "",
      apellidos: u.apellidos || "",
      telefono: u.telefono || "",
    });
    setError("");
    setModalOpen(true);
  };

  const cerrar = () => setModalOpen(false);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editando) {
      if (!form.granjaId) { setError("Debes seleccionar una granja."); return; }
      if (form.password !== form.confirmarPassword) { setError("Las contraseñas no coinciden."); return; }
      if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    }
    if (!form.rolCodigo) { setError("Debes seleccionar un rol."); return; }

    try {
      if (editando) {
        await actualizarUsuario({
          variables: {
            id: editando.id,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono,
            email: form.email,
            activo: true,
            rolCodigo: form.rolCodigo,
          },
        });
      } else {
        await crearUsuario({
          variables: {
            username: form.username,
            email: form.email,
            password: form.password,
            rolCodigo: form.rolCodigo,
            granjaId: form.granjaId,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono,
          },
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const onEliminar = async (u) => {
    if (u.id === usuarioActual?.id) {
      alert("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (!window.confirm(`¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarUsuario({ variables: { id: u.id } });
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const usuarios = data?.usuarios ?? [];
  const roles = dataRoles?.roles ?? [];
  const granjas = dataGranjas?.granjas ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <UserCog className="w-8 h-8 text-brand-500" /> Usuarios
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            {esSuperadmin
              ? "Administra todos los usuarios de la plataforma"
              : "Usuarios registrados en tu granja"}
          </p>
        </div>
        {esSuperadmin && (
          <button onClick={abrirCrear} className="btn-primary">
            <Plus className="w-5 h-5" /> Nuevo usuario
          </button>
        )}
      </div>

      {qError && (
        <div className="card bg-red-50 border-red-200 text-red-700 p-4">
          <p className="font-bold mb-1">Error al cargar usuarios:</p>
          <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">{qError.message}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-gray-500">Cargando usuarios...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-brand-50 text-brand-800 text-sm uppercase tracking-wider">
                <tr>
                  <th className="text-left p-4 font-bold">Usuario</th>
                  <th className="text-left p-4 font-bold">Nombre</th>
                  <th className="text-left p-4 font-bold">Email</th>
                  <th className="text-left p-4 font-bold">Rol</th>
                  <th className="text-left p-4 font-bold">Estado</th>
                  {esSuperadmin && <th className="text-right p-4 font-bold">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={esSuperadmin ? 6 : 5} className="p-8 text-center text-gray-500">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                      <td className="p-4 font-bold text-dark">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black">
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p>{u.username}</p>
                            {u.id === usuarioActual?.id && (
                              <span className="text-xs text-brand-600">(Tú)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{u.nombres} {u.apellidos}</td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">
                        {u.roles?.length > 0 ? (
                          <span className={ROL_COLOR[u.roles[0].codigo] || "badge-info"}>
                            {u.roles[0].nombre}
                          </span>
                        ) : (
                          <span className="badge-info">Sin rol</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={u.activo ? "badge-success" : "badge-danger"}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {esSuperadmin && (
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="text-brand-700 hover:text-brand-900 hover:bg-brand-50 p-2 rounded-lg"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEliminar(u)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg ml-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrar}
        title={editando ? "Editar usuario" : "Nuevo usuario"}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {/* DATOS DE ACCESO */}
          <div>
            <h3 className="text-lg font-black text-dark flex items-center gap-2 border-b pb-2 mb-3">
              <Key className="w-5 h-5 text-brand-500" /> Datos de acceso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Usuario *</label>
                <input
                  name="username"
                  className="input-field disabled:bg-gray-100"
                  value={form.username}
                  onChange={onChange}
                  required
                  disabled={!!editando}
                  placeholder="Ej: juan_perez"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Email *</label>
                <input
                  name="email"
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="juan@avicontrol.com"
                />
              </div>
              {!editando && (
                <>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Contraseña *</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={verPassword ? "text" : "password"}
                        className="input-field pr-10"
                        value={form.password}
                        onChange={onChange}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setVerPassword(!verPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Confirmar contraseña *</label>
                    <input
                      name="confirmarPassword"
                      type={verPassword ? "text" : "password"}
                      className="input-field"
                      value={form.confirmarPassword}
                      onChange={onChange}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div>
            <h3 className="text-lg font-black text-dark flex items-center gap-2 border-b pb-2 mb-3">
              <User className="w-5 h-5 text-brand-500" /> Datos personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Nombres</label>
                <input name="nombres" className="input-field" value={form.nombres} onChange={onChange} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Apellidos</label>
                <input name="apellidos" className="input-field" value={form.apellidos} onChange={onChange} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
                <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} />
              </div>
            </div>
          </div>

          {/* ROL Y GRANJA */}
          <div>
            <h3 className="text-lg font-black text-dark flex items-center gap-2 border-b pb-2 mb-3">
              <Shield className="w-5 h-5 text-brand-500" /> Rol y granja
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Rol *</label>
                {cargandoRoles ? (
                  <p className="text-sm text-gray-500">Cargando roles...</p>
                ) : errorRoles ? (
                  <p className="text-sm text-red-600">Error al cargar roles: {errorRoles.message}</p>
                ) : roles.length === 0 ? (
                  <p className="text-sm text-amber-600">No hay roles disponibles en el sistema.</p>
                ) : (
                  <select name="rolCodigo" className="input-field" value={form.rolCodigo} onChange={onChange} required>
                    <option value="">Selecciona un rol</option>
                    {roles.filter((r) => r.codigo !== "superadmin").map((r) => (
                      <option key={r.id} value={r.codigo}>{r.nombre}</option>
                    ))}
                  </select>
                )}
              </div>
              {esSuperadmin && !editando && (
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Granja *</label>
                  {cargandoGranjas ? (
                    <p className="text-sm text-gray-500">Cargando granjas...</p>
                  ) : errorGranjas ? (
                    <p className="text-sm text-red-600">Error al cargar granjas: {errorGranjas.message}</p>
                  ) : granjas.length === 0 ? (
                    <p className="text-sm text-amber-600">No hay granjas registradas. Crea una primero en "Granjas".</p>
                  ) : (
                    <select name="granjaId" className="input-field" value={form.granjaId} onChange={onChange} required>
                      <option value="">Selecciona una granja</option>
                      {granjas.map((g) => (
                        <option key={g.id} value={g.id}>{g.codigo} — {g.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={cerrar} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={creando || actualizando} className="btn-primary">
              {creando || actualizando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}