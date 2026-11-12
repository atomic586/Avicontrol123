import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { UserCog, Plus, Pencil, Shield, Mail, Phone } from "lucide-react";
import {
  USUARIOS_QUERY,
  ROLES_QUERY,
  CREAR_USUARIO,
  ACTUALIZAR_USUARIO,
} from "../graphql/usuarios";
import { useAuth } from "../auth/AuthContext";
import Modal from "../components/Modal";

const GRANJAS_QUERY = gql`
  query GranjasParaUsuarios {
    granjas { id codigo nombre }
  }
`;

const FORM_VACIO = {
  username: "",
  email: "",
  password: "",
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
  const { usuario: usuarioActual } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");

  const esSuperadmin = usuarioActual?.roles?.some((r) => r.codigo === "superadmin");

  const { data, loading, error: qError, refetch } = useQuery(USUARIOS_QUERY, {
    fetchPolicy: "network-only",
  });
  const { data: dataRoles } = useQuery(ROLES_QUERY, { fetchPolicy: "cache-first" });
  const { data: dataGranjas } = useQuery(GRANJAS_QUERY, {
    fetchPolicy: "cache-first",
    skip: !esSuperadmin,
  });

  const [crearUsuario, { loading: creando }] = useMutation(CREAR_USUARIO);
  const [actualizarUsuario, { loading: actualizando }] = useMutation(ACTUALIZAR_USUARIO);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
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
            granjaId: form.granjaId || null,
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

  const usuarios = data?.usuarios ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
            <UserCog className="w-8 h-8 text-brand-500" /> Usuarios
          </h1>
          <p className="text-gray-500 text-base mt-1 font-medium">
            {esSuperadmin ? "Administra todos los usuarios de la plataforma" : "Usuarios de tu granja"}
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary">
          <Plus className="w-5 h-5" /> Nuevo usuario
        </button>
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
                  <th className="text-right p-4 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-brand-50/30">
                      <td className="p-4 font-bold text-dark flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        {u.username}
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
                      <td className="p-4 text-right">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="text-brand-700 hover:text-brand-900 hover:bg-brand-50 p-2 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={cerrar} title={editando ? "Editar usuario" : "Nuevo usuario"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Username *</label>
              <input
                name="username"
                className="input-field disabled:bg-gray-100"
                value={form.username}
                onChange={onChange}
                required
                disabled={!!editando}
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
              />
            </div>
            {!editando && (
              <div className="sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 mb-1 block">Contraseña *</label>
                <input
                  name="password"
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={onChange}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Nombres</label>
              <input name="nombres" className="input-field" value={form.nombres} onChange={onChange} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Apellidos</label>
              <input name="apellidos" className="input-field" value={form.apellidos} onChange={onChange} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
              <input name="telefono" className="input-field" value={form.telefono} onChange={onChange} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Rol *</label>
              <select name="rolCodigo" className="input-field" value={form.rolCodigo} onChange={onChange} required>
                <option value="">Selecciona un rol</option>
                {dataRoles?.roles?.map((r) => (
                  <option key={r.id} value={r.codigo}>{r.nombre}</option>
                ))}
              </select>
            </div>
            {esSuperadmin && (
              <div className="sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 mb-1 block">Granja</label>
                <select name="granjaId" className="input-field" value={form.granjaId} onChange={onChange}>
                  <option value="">Sin granja (solo superadmin)</option>
                  {dataGranjas?.granjas?.map((g) => (
                    <option key={g.id} value={g.id}>{g.codigo} — {g.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
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